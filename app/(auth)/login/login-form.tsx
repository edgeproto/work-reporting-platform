"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";

import { loginAction } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

type LoginFormProps = {
  labels: Dictionary["auth"];
};

export function LoginForm({ labels }: LoginFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const passwordSet = searchParams.get("passwordSet") === "1";
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>{labels.signIn}</CardTitle>
        <CardDescription>{labels.signInDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          {passwordSet ? (
            <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
              {labels.passwordSetSuccess}
            </p>
          ) : null}

          {state.error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">{labels.email}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{labels.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? labels.signingIn : labels.signIn}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
