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
import { LanguageSwitcher } from "@/components/language-switcher";
import { useDictionary } from "@/components/i18n-provider";
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
import type { Locale } from "@/lib/i18n/locales";

type ProfileFormProps = {
  user: {
    id: string;
    name: string;
    email: string;
    roleLabel: string;
    hasAvatar: boolean;
    hasPassword: boolean;
  };
  locale: Locale;
  languageLabel: string;
};

export function SettingsProfileForms({
  user,
  locale,
  languageLabel,
}: ProfileFormProps) {
  return (
    <div className="space-y-6">
      <AvatarCard userId={user.id} hasAvatar={user.hasAvatar} />
      <ProfileCard
        name={user.name}
        email={user.email}
        roleLabel={user.roleLabel}
      />
      <LanguageCard locale={locale} languageLabel={languageLabel} />
      <PasswordCard hasPassword={user.hasPassword} />
    </div>
  );
}

function LanguageCard({
  locale,
  languageLabel,
}: {
  locale: Locale;
  languageLabel: string;
}) {
  const dict = useDictionary();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.settings.languageTitle}</CardTitle>
        <CardDescription>{dict.settings.languageDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <LanguageSwitcher
          locale={locale}
          label={languageLabel}
          variant="settings"
        />
      </CardContent>
    </Card>
  );
}

function AvatarCard({
  userId,
  hasAvatar,
}: {
  userId: string;
  hasAvatar: boolean;
}) {
  const dict = useDictionary();
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
      setClientError(dict.settings.avatarTooLarge);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.settings.avatarTitle}</CardTitle>
        <CardDescription>{dict.settings.avatarDescription}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-4">
        <div className="flex size-16 items-center justify-center overflow-hidden rounded-full border bg-muted text-lg font-medium">
          {hasAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/avatars/${userId}?v=${Date.now()}`}
              alt={dict.settings.avatarAlt}
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
            {pending ? dict.settings.uploading : dict.settings.upload}
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
            {isRemoving ? dict.settings.removing : dict.settings.remove}
          </Button>
        ) : null}
        {clientError ? (
          <p className="w-full text-sm text-destructive">{clientError}</p>
        ) : null}
        {state.error ? (
          <p className="w-full text-sm text-destructive">{state.error}</p>
        ) : null}
        {state.success ? (
          <p className="w-full text-sm text-muted-foreground">{dict.settings.avatarUpdated}</p>
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
  const dict = useDictionary();
  const router = useRouter();
  const [nameValue, setNameValue] = useState(name);
  const [emailValue, setEmailValue] = useState(email);
  const [state, formAction, pending] = useActionState<
    SettingsActionResult,
    FormData
  >(updateProfileAction, {});

  useEffect(() => {
    setNameValue(name);
    setEmailValue(email);
  }, [name, email]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.settings.profileTitle}</CardTitle>
        <CardDescription>{dict.settings.profileDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings-name">{dict.common.name}</Label>
            <Input
              id="settings-name"
              name="name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
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
            <Label htmlFor="settings-email">{dict.common.email}</Label>
            <Input
              id="settings-email"
              name="email"
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              required
            />
            {state.fieldErrors?.email?.[0] ? (
              <p className="text-sm text-destructive">
                {state.fieldErrors.email[0]}
              </p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="settings-role">{dict.common.role}</Label>
            <Input id="settings-role" value={roleLabel} disabled readOnly />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-muted-foreground">{dict.settings.profileSaved}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? dict.common.saving : dict.settings.saveProfile}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PasswordCard({ hasPassword }: { hasPassword: boolean }) {
  const dict = useDictionary();
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
          <CardTitle>{dict.settings.passwordTitle}</CardTitle>
          <CardDescription>{dict.settings.passwordNoPassword}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{dict.settings.passwordTitle}</CardTitle>
        <CardDescription>{dict.settings.passwordDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          className="max-w-md space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="current-password">{dict.settings.passwordCurrent}</Label>
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
            <Label htmlFor="new-password">{dict.settings.passwordNew}</Label>
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
            <Label htmlFor="confirm-password">{dict.settings.passwordConfirm}</Label>
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
            <p className="text-sm text-muted-foreground">{dict.settings.passwordUpdated}</p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {pending ? dict.settings.updating : dict.settings.changePassword}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
