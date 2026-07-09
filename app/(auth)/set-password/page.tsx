import { findValidPasswordSetToken } from "@/lib/password-set-token";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

import { SetPasswordForm } from "./set-password-form";

type SetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

function InvalidTokenMessage({
  reason,
  labels,
}: {
  reason: string;
  labels: ReturnType<typeof getDictionary>["auth"]["setPassword"];
}) {
  const messages: Record<string, string> = {
    invalid: labels.tokenInvalid,
    used: labels.tokenUsedSignIn,
    expired: labels.tokenExpired,
    inactive: labels.tokenInactive,
  };

  return (
    <div className="rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
      <h1 className="text-lg font-medium">{labels.unableTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {messages[reason] ?? messages.invalid}
      </p>
    </div>
  );
}

export default async function SetPasswordPage({
  searchParams,
}: SetPasswordPageProps) {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  const { token } = await searchParams;

  if (!token) {
    return <InvalidTokenMessage reason="invalid" labels={dict.auth.setPassword} />;
  }

  const validation = await findValidPasswordSetToken(token);

  if (!validation.ok) {
    return (
      <InvalidTokenMessage
        reason={validation.reason}
        labels={dict.auth.setPassword}
      />
    );
  }

  return (
    <SetPasswordForm
      token={token}
      userName={validation.record.user.name}
      userEmail={validation.record.user.email}
    />
  );
}
