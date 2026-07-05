import { randomBytes } from "node:crypto";

import { db } from "@/lib/db";

const TOKEN_BYTES = 32;
const TOKEN_EXPIRY_DAYS = 7;

export function generateTokenValue(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function getPasswordSetLink(token: string): string {
  const baseUrl = process.env.APP_URL ?? "http://localhost:3000";
  return `${baseUrl.replace(/\/$/, "")}/set-password?token=${token}`;
}

export async function createPasswordSetToken(userId: string) {
  const token = generateTokenValue();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  const record = await db.passwordSetToken.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return {
    token: record.token,
    expiresAt: record.expiresAt,
    link: getPasswordSetLink(record.token),
  };
}

export async function findValidPasswordSetToken(token: string) {
  const record = await db.passwordSetToken.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          passwordHash: true,
        },
      },
    },
  });

  if (!record) {
    return { ok: false as const, reason: "invalid" as const };
  }

  if (record.usedAt) {
    return { ok: false as const, reason: "used" as const };
  }

  if (record.expiresAt < new Date()) {
    return { ok: false as const, reason: "expired" as const };
  }

  if (!record.user.isActive) {
    return { ok: false as const, reason: "inactive" as const };
  }

  return { ok: true as const, record };
}

export async function setPasswordWithToken(token: string, password: string) {
  const validation = await findValidPasswordSetToken(token);

  if (!validation.ok) {
    return { ok: false as const, reason: validation.reason };
  }

  const { hashPassword } = await import("@/lib/password");
  const passwordHash = await hashPassword(password);
  const now = new Date();

  await db.$transaction([
    db.user.update({
      where: { id: validation.record.userId },
      data: { passwordHash },
    }),
    db.passwordSetToken.update({
      where: { id: validation.record.id },
      data: { usedAt: now },
    }),
  ]);

  return { ok: true as const };
}
