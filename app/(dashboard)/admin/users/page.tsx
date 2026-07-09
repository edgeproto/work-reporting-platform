import { redirect } from "next/navigation";

import { UsersManagement } from "@/components/admin/users-management";
import { auth } from "@/lib/auth";
import { listOrganizationUsers } from "@/lib/admin/users";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
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
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const users = await listOrganizationUsers(session!.user.organizationId);

  const serializedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    hasPassword: user.hasPassword,
    hasAvatar: user.hasAvatar,
    passwordSetLink: user.passwordSetLink,
    tokenExpiresAt: user.tokenExpiresAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.admin.usersTitle}
        </h1>
        <p className="text-muted-foreground">{dict.admin.usersDescription}</p>
      </div>

      <UsersManagement
        users={serializedUsers}
        currentUserId={session!.user.id}
        createdLink={createdLink}
      />
    </div>
  );
}
