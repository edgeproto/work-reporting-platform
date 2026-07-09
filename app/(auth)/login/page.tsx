import { Suspense } from "react";

import { LoginForm } from "@/app/(auth)/login/login-form";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

function LoginFallback({ dict }: { dict: Awaited<ReturnType<typeof getDictionary>> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.auth.signIn}</CardTitle>
        <CardDescription>{dict.auth.loading}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default async function LoginPage() {
  const locale = await getLocale();
  const dict = getDictionary(locale);

  return (
    <Suspense fallback={<LoginFallback dict={dict} />}>
      <LoginForm labels={dict.auth} />
    </Suspense>
  );
}
