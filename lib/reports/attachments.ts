import { Role, Visibility } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  buildStorageKey,
  deleteFile,
  deleteFilesForEntry,
  getMaxUploadBytes,
  saveFile,
} from "@/lib/storage/local";
import { canViewPrivate } from "@/lib/visibility";
import { validateUploadFile } from "@/lib/validation";

async function assertEditableReportEntry(
  reportId: string,
  entryId: string,
  userId: string,
  organizationId: string,
) {
  const report = await db.report.findFirst({
    where: { id: reportId, userId, organizationId },
  });

  if (!report) {
    throw new Error("Report not found.");
  }

  if (report.status === "SUBMITTED") {
    throw new Error("Submitted reports cannot be edited.");
  }

  const entry = await db.reportEntry.findFirst({
    where: { id: entryId, reportId },
  });

  if (!entry) {
    throw new Error("Report entry not found.");
  }

  return { report, entry };
}

export async function addAttachment(
  reportId: string,
  entryId: string,
  userId: string,
  organizationId: string,
  file: File,
) {
  await assertEditableReportEntry(reportId, entryId, userId, organizationId);

  const validation = validateUploadFile(file);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > getMaxUploadBytes()) {
    throw new Error(
      `File exceeds maximum size of ${Math.round(getMaxUploadBytes() / (1024 * 1024))} MB.`,
    );
  }

  const storageKey = buildStorageKey(
    organizationId,
    reportId,
    entryId,
    file.name,
  );

  await saveFile(storageKey, buffer);

  try {
    return await db.attachment.create({
      data: {
        reportEntryId: entryId,
        fileName: file.name,
        storageKey,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: buffer.byteLength,
      },
    });
  } catch (error) {
    await deleteFile(storageKey);
    throw error;
  }
}

export async function deleteAttachment(
  attachmentId: string,
  reportId: string,
  userId: string,
  organizationId: string,
) {
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      reportEntry: {
        reportId,
        report: { userId, organizationId, status: "DRAFT" },
      },
    },
    select: {
      id: true,
      storageKey: true,
      reportEntryId: true,
    },
  });

  if (!attachment) {
    throw new Error("Attachment not found.");
  }

  await deleteFile(attachment.storageKey);
  await db.attachment.delete({ where: { id: attachment.id } });
}

export async function deleteAttachmentsForReportEntry(
  organizationId: string,
  reportId: string,
  entryId: string,
) {
  const attachments = await db.attachment.findMany({
    where: { reportEntryId: entryId },
    select: { storageKey: true },
  });

  await Promise.all(attachments.map((a) => deleteFile(a.storageKey)));
  await deleteFilesForEntry(organizationId, reportId, entryId);
}

export async function deleteAttachmentsForReport(
  organizationId: string,
  reportId: string,
) {
  const entries = await db.reportEntry.findMany({
    where: { reportId },
    select: { id: true },
  });

  await Promise.all(
    entries.map((entry) =>
      deleteAttachmentsForReportEntry(organizationId, reportId, entry.id),
    ),
  );
}

type DownloadViewer = {
  id: string;
  role: Role;
  organizationId: string;
};

export async function getAttachmentForDownload(
  attachmentId: string,
  viewer: DownloadViewer,
) {
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      reportEntry: {
        report: { organizationId: viewer.organizationId },
      },
    },
    include: {
      reportEntry: {
        select: {
          visibility: true,
          report: {
            select: {
              userId: true,
              status: true,
            },
          },
        },
      },
    },
  });

  if (!attachment) {
    return null;
  }

  const ownerId = attachment.reportEntry.report.userId;
  const entryVisibility = attachment.reportEntry.visibility;

  if (viewer.id !== ownerId) {
    if (
      entryVisibility === Visibility.PRIVATE &&
      !canViewPrivate(viewer, ownerId, viewer.id)
    ) {
      return null;
    }
  }

  return attachment;
}
