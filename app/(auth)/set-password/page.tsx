import { findValidPasswordSetToken } from "@/lib/password-set-token";

import { SetPasswordForm } from "./set-password-form";

type SetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

function InvalidTokenMessage({ reason }: { reason: string }) {
  const messages: Record<string, string> = {
    invalid: "This password-set link is invalid.",
    used: "This link has already been used. Sign in or ask your admin for a new link.",
    expired: "This link has expired. Ask your admin for a new one.",
    inactive: "This account is inactive. Contact your admin.",
  };

  return (
    <div className="rounded-xl bg-card p-6 text-center ring-1 ring-foreground/10">
      <h1 className="text-lg font-medium">Unable to set password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {messages[reason] ?? messages.invalid}
      </p>
    </div>
  );
}

export default async function SetPasswordPage({
  searchParams,
}: SetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <InvalidTokenMessage reason="invalid" />;
  }

  const validation = await findValidPasswordSetToken(token);

  if (!validation.ok) {
    return <InvalidTokenMessage reason={validation.reason} />;
  }

  return (
    <SetPasswordForm
      token={token}
      userName={validation.record.user.name}
      userEmail={validation.record.user.email}
    />
  );
}
