import { Role, Visibility } from "@/app/generated/prisma/enums";
import { isManagerOrAbove } from "@/lib/rbac";

type RoleHolder = { role: Role };

export function canViewPrivate(
  viewer: RoleHolder,
  ownerId: string,
  viewerId: string,
): boolean {
  if (viewerId === ownerId) {
    return true;
  }

  return isManagerOrAbove(viewer);
}

/** Prisma where fragment for entry/item visibility based on viewer role. */
export function visibilityWhereForViewer(
  viewer: RoleHolder,
  ownerId: string,
  viewerId: string,
  visibilityFilter?: Visibility,
): { visibility?: Visibility } | Record<string, never> {
  const canSeePrivate = canViewPrivate(viewer, ownerId, viewerId);

  if (visibilityFilter) {
    if (!canSeePrivate && visibilityFilter === Visibility.PRIVATE) {
      return { visibility: Visibility.PUBLIC };
    }
    return { visibility: visibilityFilter };
  }

  if (!canSeePrivate) {
    return { visibility: Visibility.PUBLIC };
  }

  return {};
}
