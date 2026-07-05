import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { canManageUsers } from "@/lib/rbac";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!canManageUsers(session!.user)) {
    redirect("/");
  }

  return (
    <PlaceholderPage
      title="Organization Settings"
      description="Configure organization name and APP_URL for link generation."
    />
  );
}
