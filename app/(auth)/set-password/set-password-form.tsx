"use client";

import { useActionState } from "react";

import { setPasswordAction } from "@/app/(auth)/set-password/actions";
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

type SetPasswordFormProps = {
  token: string;
  userName: string;
  userEmail: string;
};

export function SetPasswordForm({
  token,
  userName,
  userEmail,
}: SetPasswordFormProps) {
  const [state, formAction, pending] = useActionState(setPasswordAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set your password</CardTitle>
        <CardDescription>
          Welcome, {userName}. Create a password for {userEmail}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />

          {state.error ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            {state.fieldErrors?.password?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.password[0]}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
            />
            {state.fieldErrors?.confirmPassword?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving…" : "Set password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
