import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  buildAvatarStorageKey,
  deleteFile,
  getMaxUploadBytes,
  saveFile,
} from "@/lib/storage/local";

export async function getUserProfile(userId: string, organizationId: string) {
  return db.user.findFirst({
    where: { id: userId, organizationId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarKey: true,
      avatarMimeType: true,
      passwordHash: true,
    },
  });
}

export async function updateUserProfile(
  userId: string,
  organizationId: string,
  data: { name: string; email: string },
) {
  const email = data.email.toLowerCase().trim();
  const name = data.name.trim();

  if (!name) {
    throw new Error("Name is required.");
  }
  if (!email) {
    throw new Error("Email is required.");
  }

  const conflict = await db.user.findFirst({
    where: {
      organizationId,
      email,
      NOT: { id: userId },
    },
    select: { id: true },
  });

  if (conflict) {
    throw new Error("A user with this email already exists.");
  }

  return db.user.update({
    where: { id: userId },
    data: { name, email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatarKey: true,
    },
  });
}

export async function changeUserPassword(
  userId: string,
  organizationId: string,
  currentPassword: string,
  newPassword: string,
) {
  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, passwordHash: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.passwordHash) {
    throw new Error(
      "No password is set for this account. Use a password-set link from your admin.",
    );
  }

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await hashPassword(newPassword);
  await db.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });
}

const AVATAR_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const AVATAR_EXT = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp"]);
const MAX_AVATAR_BYTES = Math.min(2 * 1024 * 1024, getMaxUploadBytes());

export async function updateUserAvatar(
  userId: string,
  organizationId: string,
  file: File,
) {
  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, avatarKey: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!file.name?.trim() || file.size <= 0) {
    throw new Error("Select an image file.");
  }

  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : "";
  const mimeOk = file.type && AVATAR_MIME.has(file.type.toLowerCase());
  const extOk = ext && AVATAR_EXT.has(ext);

  if (!mimeOk && !extOk) {
    throw new Error("Avatar must be a JPEG, PNG, GIF, or WebP image.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error(
      `Avatar exceeds maximum size of ${Math.round(MAX_AVATAR_BYTES / (1024 * 1024))} MB.`,
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storageKey = buildAvatarStorageKey(organizationId, userId, file.name);
  await saveFile(storageKey, buffer);

  try {
    await db.user.update({
      where: { id: userId },
      data: {
        avatarKey: storageKey,
        avatarMimeType: file.type || "application/octet-stream",
      },
    });
  } catch (error) {
    await deleteFile(storageKey);
    throw error;
  }

  if (user.avatarKey && user.avatarKey !== storageKey) {
    await deleteFile(user.avatarKey);
  }

  return storageKey;
}

export async function removeUserAvatar(userId: string, organizationId: string) {
  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
    select: { id: true, avatarKey: true },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.avatarKey) {
    await deleteFile(user.avatarKey);
  }

  await db.user.update({
    where: { id: userId },
    data: { avatarKey: null, avatarMimeType: null },
  });
}
