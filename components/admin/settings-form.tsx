"use client";

import { useActionState } from "react";

import { updateOrganizationNameAction } from "@/app/(dashboard)/admin/settings/actions";
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

type OrganizationSettingsFormProps = {
  organizationName: string;
  organizationSlug: string;
  appUrl: string;
};

export function OrganizationSettingsForm({
  organizationName,
  organizationSlug,
  appUrl,
}: OrganizationSettingsFormProps) {
  const dict = useDictionary();
  const [state, formAction, pending] = useActionState(
    updateOrganizationNameAction,
    {},
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.organizationTitle}</CardTitle>
          <CardDescription>{dict.admin.organizationDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">{dict.common.name}</Label>
              <Input
                id="org-name"
                name="name"
                defaultValue={organizationName}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">{dict.admin.slug}</Label>
              <Input
                id="org-slug"
                value={organizationSlug}
                readOnly
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">{dict.admin.slugFixed}</p>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? dict.common.saving : dict.admin.saveChanges}
            </Button>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-green-700 dark:text-green-300">
                {dict.admin.settingsSaved}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{dict.admin.appUrlTitle}</CardTitle>
          <CardDescription>{dict.admin.appUrlDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input readOnly value={appUrl} className="font-mono text-sm" />
          <p className="text-sm text-muted-foreground">{dict.admin.appUrlHint}</p>
        </CardContent>
      </Card>
    </div>
  );
}
