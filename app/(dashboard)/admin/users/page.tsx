import { redirect } from "next/navigation";

import { UsersManagement } from "@/components/admin/users-management";
import { auth } from "@/lib/auth";
import { listOrganizationUsers } from "@/lib/admin/users";
import { canManageUsers } from "@/lib/rbac";

type PageProps = {
  searchParams: Promise<{ createdLink?: string }>;
};

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();

  if (!canManageUsers(session!.user)) {
    redirect("/");
  }

  const { createdLink } = await searchParams;
  const users = await listOrganizationUsers(session!.user.organizationId);

  const serializedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    hasPassword: user.hasPassword,
    passwordSetLink: user.passwordSetLink,
    tokenExpiresAt: user.tokenExpiresAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          User Management
        </h1>
        <p className="text-muted-foreground">
          Create users, assign roles, and share password-set links manually.
        </p>
      </div>

      <UsersManagement
        users={serializedUsers}
        currentUserId={session!.user.id}
        createdLink={createdLink}
      />
    </div>
  );
}
