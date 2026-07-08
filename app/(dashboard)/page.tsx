import { auth } from "@/lib/auth";
import { HomeHub } from "@/components/home/home-hub";
import { getHomePeriodPrefs } from "@/lib/home/prefs";
import { loadHomeHubData } from "@/lib/home/queries";

export default async function DashboardHomePage() {
  const session = await auth();
  const user = session!.user;
  const prefs = await getHomePeriodPrefs();
  const sections = await loadHomeHubData(
    user.id,
    user.organizationId,
    prefs,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          File monthly, weekly, and daily plans and reports from here.
        </p>
      </div>

      <HomeHub
        monthly={sections.monthly}
        weekly={sections.weekly}
        daily={sections.daily}
        prefs={prefs}
      />
    </div>
  );
}
