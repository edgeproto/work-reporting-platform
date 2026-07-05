import { Role } from "@/app/generated/prisma/enums";

type RoleHolder = { role: Role };

export function isAdmin(user: RoleHolder): boolean {
  return user.role === Role.ADMIN;
}

export function isManager(user: RoleHolder): boolean {
  return user.role === Role.MANAGER;
}

export function isManagerOrAbove(user: RoleHolder): boolean {
  return user.role === Role.ADMIN || user.role === Role.MANAGER;
}

export function canManageUsers(user: RoleHolder): boolean {
  return isAdmin(user);
}

export function canViewPrivate(viewer: RoleHolder, ownerId: string, viewerId: string): boolean {
  if (viewerId === ownerId) {
    return true;
  }

  return isManagerOrAbove(viewer);
}
