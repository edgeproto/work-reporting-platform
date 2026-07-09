"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  changePasswordAction,
  removeAvatarAction,
  updateProfileAction,
  uploadAvatarAction,
  type SettingsActionResult,
} from "@/app/(dashboard)/settings/actions";
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

type ProfileFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
    roleLabel: string;
    hasAvatar: boolean;
    hasPassword: boolean;
  };
};

export function SettingsProfileForms({ user }: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <AvatarCard userId={user.id} hasAvatar={user.hasAvatar} />
      <ProfileCard
        name={user.name}
        email={user.email}
        roleLabel={user.roleLabel}
      />
      <PasswordCard hasPassword={user.hasPassword} />
    </div>
  );
}

function AvatarCard({
  userId,
  hasAvatar,
}: {
  userId: string;
  hasAvatar: boolean;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    SettingsActionResult,
    FormData
  >(uploadAvatarAction, {});
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isRemoving, startRemove] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const maxAvatarBytes = 2 * 1024 * 1024;

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    setClientError(null);
    const file = fileRef.current?.files?.[0];
    if (file && file.size > maxAvatarBytes) {
      event.preventDefault();
      setClientError("Avatar must be 2 MB or smaller.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Avatar</CardTitle>
        <CardDescription>
          Upload a square image (JPEG, PNG, GIF, or WebP). Max 2 MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border bg-muted text-lg font-medium">
          {hasAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/avatars/${userId}?v=${Date.now()}`}
              alt="Your avatar"
              className="size-full object-cover"
            />
          ) : (
            <span>?</span>
          )}
        </div>
        <form
          action={formAction}
          onSubmit={handleSubmit}
          className="flex flex-wrap items-center gap-2"
        >
          <Input
            ref={fileRef}
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/gif,image/webp,.jpg,.jpeg,.png,.gif,.webp"
            className="max-w-xs"
            required
            onChange={() => setClientError(null)}
          />
          <Button type="submit" disabled={pending}>
            {pending ? "Uploading…" : "Upload"}
          </Button>
        </form>
        {hasAvatar ? (
          <Button
            type="button"
            variant="outline"
            disabled={isRemoving}
            onClick={() => {
              setRemoveError(null);
              startRemove(async () => {
                const result = await removeAvatarAction();
                if (result.error) {
                  setRemoveError(result.error);
                  return;
                }
                router.refresh();
              });
            }}
          >
            {isRemoving ? "Removing…" : "Remove"}
          </Button>
        ) : null}
        {clientError ? (
          <p className="w-full text-sm text-destructive">{clientError}</p>
        ) : null}
        {state.error ? (
          <p className="w-full text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="w-full text-sm text-muted-foreground">Avatar updated.</p>
        ) : null}
        {removeError ? (
          <p className="w-full text-sm text-destructive">{removeError}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ProfileCard({
  name,
  email,
  roleLabel,
}: {
  name: string;
  email: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    SettingsActionResult,
    FormData
  >(updateProfileAction, {});

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your display name and email. Role is managed by an admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              name="name"
              defaultValue={name}
              required
              maxLength={100}
            />
            {state.fieldErrors?.name?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.name[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-email">Email</Label>
            <Input
              id="settings-email"
              name="email"
              type="email"
              defaultValue={email}
              required
            />
            {state.fieldErrors?.email?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-role">Role</Label>
            <Input id="settings-role" value={roleLabel} disabled readOnly />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-muted-foreground">
              Profile saved. Sign out and back in if your name in the sidebar
              looks stale.
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const [state, formAction, pending] = useActionState<
    SettingsActionResult,
    FormData
  >(changePasswordAction, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) {
      formRef.current?.reset();
    }
  }, [state.success]);

  if (!hasPassword) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            No password is set yet. Ask an admin for a password-set link.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Password</CardTitle>
        <CardDescription>
          Choose a new password (at least 8 characters).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          className="max-w-md space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
            />
            {state.fieldErrors?.currentPassword?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.currentPassword[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {state.fieldErrors?.newPassword?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.newPassword[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
            {state.fieldErrors?.confirmPassword?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            ) : null}
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-muted-foreground">Password updated.</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? "Updating…" : "Change password"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
