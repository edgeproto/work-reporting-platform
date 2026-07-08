import { Role, Visibility } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import { canEditPeriod } from "@/lib/periods";
import {
  buildPlanItemStorageKey,
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

  if (!canEditPeriod(report.type, report.periodStart, report.periodEnd)) {
    throw new Error("This period is outside the edit window.");
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

async function assertEditablePlanItem(
  planId: string,
  planItemId: string,
  userId: string,
  organizationId: string,
) {
  const plan = await db.plan.findFirst({
    where: { id: planId, userId, organizationId },
  });

  if (!plan) {
    throw new Error("Plan not found.");
  }

  if (plan.status === "SUBMITTED") {
    throw new Error("Submitted plans cannot be edited.");
  }

  if (!canEditPeriod(plan.type, plan.periodStart, plan.periodEnd)) {
    throw new Error("This period is outside the edit window.");
  }

  const item = await db.planItem.findFirst({
    where: { id: planItemId, planId },
  });

  if (!item) {
    throw new Error("Plan item not found.");
  }

  return { plan, item };
}

export async function addPlanItemAttachment(
  planId: string,
  planItemId: string,
  userId: string,
  organizationId: string,
  file: File,
) {
  await assertEditablePlanItem(planId, planItemId, userId, organizationId);

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

  const storageKey = buildPlanItemStorageKey(
    organizationId,
    planId,
    planItemId,
    file.name,
  );

  await saveFile(storageKey, buffer);

  try {
    return await db.attachment.create({
      data: {
        planItemId,
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

export async function deletePlanItemAttachment(
  attachmentId: string,
  planId: string,
  userId: string,
  organizationId: string,
) {
  const attachment = await db.attachment.findFirst({
    where: {
      id: attachmentId,
      planItem: {
        planId,
        plan: { userId, organizationId, status: "DRAFT" },
      },
    },
    select: {
      id: true,
      storageKey: true,
    },
  });

  if (!attachment) {
    throw new Error("Attachment not found.");
  }

  await deleteFile(attachment.storageKey);
  await db.attachment.delete({ where: { id: attachment.id } });
}

export async function deleteAttachmentsForPlanItem(planItemId: string) {
  const attachments = await db.attachment.findMany({
    where: { planItemId },
    select: { id: true, storageKey: true },
  });

  await Promise.all(attachments.map((a) => deleteFile(a.storageKey)));
  if (attachments.length > 0) {
    await db.attachment.deleteMany({ where: { planItemId } });
  }
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
      OR: [
        {
          reportEntry: {
            report: { organizationId: viewer.organizationId },
          },
        },
        {
          planItem: {
            plan: { organizationId: viewer.organizationId },
          },
        },
      ],
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
      planItem: {
        select: {
          visibility: true,
          plan: {
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

  if (attachment.reportEntry) {
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

  if (attachment.planItem) {
    const ownerId = attachment.planItem.plan.userId;
    const itemVisibility = attachment.planItem.visibility;

    if (viewer.id !== ownerId) {
      if (
        itemVisibility === Visibility.PRIVATE &&
        !canViewPrivate(viewer, ownerId, viewer.id)
      ) {
        return null;
      }
    }

    return attachment;
  }

  return null;
}
