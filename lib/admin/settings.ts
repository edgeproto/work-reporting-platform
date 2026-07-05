import { db } from "@/lib/db";

export async function getOrganizationSettings(organizationId: string) {
  return db.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function updateOrganizationName(
  organizationId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Organization name is required.");
  }

  return db.organization.update({
    where: { id: organizationId },
    data: { name: trimmed },
  });
}
