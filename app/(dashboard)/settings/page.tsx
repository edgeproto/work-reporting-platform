import { notFound } from "next/navigation";

import { SettingsProfileForms } from "@/components/settings/profile-forms";
import { requireSession } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { getUserProfile } from "@/lib/settings/profile";

export default async function SettingsPage() {
  const session = await requireSession();
  const locale = await getLocale();
  const dict = getDictionary(locale);

  const profile = await getUserProfile(
    session.user.id,
    session.user.organizationId,
  );

  if (!profile) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {dict.nav.settings}
        </h1>
        <p className="text-muted-foreground">{dict.settings.subtitle}</p>
      </div>

      <SettingsProfileForms
        locale={locale}
        languageLabel={dict.header.language}
        user={{
          id: profile.id,
          name: profile.name,
          email: profile.email,
          roleLabel: dict.roles[profile.role],
          hasAvatar: !!profile.avatarKey,
          hasPassword: !!profile.passwordHash,
        }}
      />
    </div>
  );
}
