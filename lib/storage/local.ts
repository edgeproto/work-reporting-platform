import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const DEFAULT_UPLOAD_DIR = "./data/uploads";
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024;

export function getUploadDir(): string {
  return process.env.UPLOAD_DIR?.trim() || DEFAULT_UPLOAD_DIR;
}

export function getMaxUploadBytes(): number {
  const raw = process.env.MAX_UPLOAD_BYTES?.trim();
  if (!raw) {
    return DEFAULT_MAX_BYTES;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_MAX_BYTES;
}

/** Safe segment for storage paths — strips path separators and control chars. */
export function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName).replace(/[\x00-\x1f\x7f]/g, "").trim();
  const sanitized = base.replace(/[^a-zA-Z0-9._-]/g, "_");
  const trimmed = sanitized.slice(0, 200);
  return trimmed.length > 0 ? trimmed : "file";
}

export function buildStorageKey(
  organizationId: string,
  reportId: string,
  entryId: string,
  fileName: string,
): string {
  const safeName = sanitizeFileName(fileName);
  return `${organizationId}/${reportId}/${entryId}/${randomUUID()}-${safeName}`;
}

export function getAbsolutePath(storageKey: string): string {
  const uploadDir = path.resolve(getUploadDir());
  const absolute = path.resolve(uploadDir, storageKey);
  if (!absolute.startsWith(uploadDir + path.sep) && absolute !== uploadDir) {
    throw new Error("Invalid storage key.");
  }
  return absolute;
}

export async function saveFile(storageKey: string, data: Buffer): Promise<void> {
  const absolutePath = getAbsolutePath(storageKey);
  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, data);
}

export async function readFile(storageKey: string): Promise<Buffer> {
  return fs.readFile(getAbsolutePath(storageKey));
}

export async function deleteFile(storageKey: string): Promise<void> {
  try {
    await fs.unlink(getAbsolutePath(storageKey));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

export async function deleteFilesForEntry(
  organizationId: string,
  reportId: string,
  entryId: string,
): Promise<void> {
  const entryDir = path.join(
    path.resolve(getUploadDir()),
    organizationId,
    reportId,
    entryId,
  );
  try {
    await fs.rm(entryDir, { recursive: true, force: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}
