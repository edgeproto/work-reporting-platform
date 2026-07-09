import { MyFeed } from "@/components/my-feed/my-feed";
import { requireSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { loadMyFeedData } from "@/lib/my-feed/queries";

export default async function MyFeedPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const data = await loadMyFeedData(
    session.user.id,
    session.user.organizationId,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.nav.myFeed}
        </h1>
        <p className="text-muted-foreground">
          Your recent daily and weekly filings side by side.
        </p>
      </div>
      <MyFeed data={data} />
    </div>
  );
}
