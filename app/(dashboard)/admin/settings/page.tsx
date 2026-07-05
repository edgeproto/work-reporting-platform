import { redirect } from "next/navigation";

import { OrganizationSettingsForm } from "@/components/admin/settings-form";
import { auth } from "@/lib/auth";
import { getOrganizationSettings } from "@/lib/admin/settings";
import { canManageUsers } from "@/lib/rbac";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!canManageUsers(session!.user)) {
    redirect("/");
  }

  const organization = await getOrganizationSettings(
    session!.user.organizationId,
  );

  if (!organization) {
    redirect("/");
  }

  const appUrl = process.env.APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Organization Settings
        </h1>
        <p className="text-muted-foreground">
          Configure organization name and review the application URL for link
          generation.
        </p>
      </div>

      <OrganizationSettingsForm
        organizationName={organization.name}
        organizationSlug={organization.slug}
        appUrl={appUrl}
      />
    </div>
  );
}
