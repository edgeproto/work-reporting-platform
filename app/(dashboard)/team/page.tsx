import { auth } from "@/lib/auth";
import { isManagerOrAbove } from "@/lib/rbac";
import { PlaceholderPage } from "@/components/placeholder-page";

export default async function TeamPage() {
  const session = await auth();
  const managerView = isManagerOrAbove(session!.user);

  return (
    <PlaceholderPage
      title={managerView ? "Team Dashboard" : "Team Feed"}
      description={
        managerView
          ? "Manager and admin views with private entries will appear here."
          : "Public plans and report entries from teammates will appear here."
      }
    />
  );
}
