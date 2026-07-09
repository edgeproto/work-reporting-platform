import { auth } from "@/lib/auth";
import { HomeHub } from "@/components/home/home-hub";
import { getHomePeriodPrefs } from "@/lib/home/prefs";
import { loadHomeHubData } from "@/lib/home/queries";
import { formatMessage } from "@/lib/i18n/format";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

export default async function DashboardHomePage() {
  const session = await auth();
  const user = session!.user;
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const prefs = await getHomePeriodPrefs();
  const sections = await loadHomeHubData(
    user.id,
    user.organizationId,
    prefs,
    locale,
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {formatMessage(dict.home.welcome, { name: user.name ?? "" })}
        </h1>
        <p className="mt-1 text-muted-foreground">{dict.home.subtitle}</p>
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
