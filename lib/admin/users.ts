import { Role } from "@/app/generated/prisma/enums";
import { db } from "@/lib/db";
import {
  createPasswordSetToken,
  getPasswordSetLink,
} from "@/lib/password-set-token";

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  hasPassword: boolean;
  passwordSetLink: string | null;
  tokenExpiresAt: Date | null;
  createdAt: Date;
};

export async function listOrganizationUsers(
  organizationId: string,
): Promise<AdminUserRow[]> {
  const users = await db.user.findMany({
    where: { organizationId },
    orderBy: [{ isActive: "desc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      passwordHash: true,
      createdAt: true,
      passwordSetTokens: {
        where: {
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { token: true, expiresAt: true },
      },
    },
  });

  return users.map((user) => {
    const activeToken = user.passwordSetTokens[0];
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.passwordHash,
      passwordSetLink: activeToken
        ? getPasswordSetLink(activeToken.token)
        : null,
      tokenExpiresAt: activeToken?.expiresAt ?? null,
      createdAt: user.createdAt,
    };
  });
}

export async function createOrganizationUser(
  organizationId: string,
  data: { name: string; email: string; role: Role },
) {
  const email = data.email.toLowerCase();

  const existing = await db.user.findUnique({
    where: {
      organizationId_email: {
        organizationId,
        email,
      },
    },
  });

  if (existing) {
    throw new Error("A user with this email already exists.");
  }

  const user = await db.user.create({
    data: {
      name: data.name.trim(),
      email,
      role: data.role,
      organizationId,
      passwordHash: null,
      isActive: true,
    },
  });

  const tokenResult = await createPasswordSetToken(user.id);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
    passwordSetLink: tokenResult.link,
    tokenExpiresAt: tokenResult.expiresAt,
  };
}

export async function regeneratePasswordSetLink(
  userId: string,
  organizationId: string,
) {
  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.isActive) {
    throw new Error("Cannot generate a link for an inactive user.");
  }

  const tokenResult = await createPasswordSetToken(userId);

  return {
    passwordSetLink: tokenResult.link,
    tokenExpiresAt: tokenResult.expiresAt,
  };
}

export async function updateOrganizationUserRole(
  userId: string,
  organizationId: string,
  role: Role,
  actorId: string,
) {
  if (userId === actorId) {
    throw new Error("You cannot change your own role.");
  }

  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return db.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function setOrganizationUserActive(
  userId: string,
  organizationId: string,
  isActive: boolean,
  actorId: string,
) {
  if (userId === actorId && !isActive) {
    throw new Error("You cannot deactivate your own account.");
  }

  const user = await db.user.findFirst({
    where: { id: userId, organizationId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  return db.user.update({
    where: { id: userId },
    data: { isActive },
  });
}
