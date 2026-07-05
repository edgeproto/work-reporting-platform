import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!canManageUsers(session!.user)) {
    redirect("/");
  }

  return (
    <PlaceholderPage
      title="User Management"
      description="Create users, assign roles, and copy password-set links."
    />
  );
}
