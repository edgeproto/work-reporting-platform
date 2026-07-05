"use client";

import { useActionState } from "react";

import { updateOrganizationNameAction } from "@/app/(dashboard)/admin/settings/actions";
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
  const [state, formAction, pending] = useActionState(
    updateOrganizationNameAction,
    {},
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>
            Display name shown across the platform.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                name="name"
                defaultValue={organizationName}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={organizationSlug}
                readOnly
                className="text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Slug is fixed in v1 single-org mode.
              </p>
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
            {state.error ? (
              <p className="text-sm text-destructive">{state.error}</p>
            ) : null}
            {state.success ? (
              <p className="text-sm text-green-700 dark:text-green-300">
                Settings saved.
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Application URL</CardTitle>
          <CardDescription>
            Base URL used when generating password-set links for new users.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input readOnly value={appUrl} className="font-mono text-sm" />
          <p className="text-sm text-muted-foreground">
            Set <code className="text-xs">APP_URL</code> in your{" "}
            <code className="text-xs">.env</code> file (e.g.{" "}
            <code className="text-xs">http://192.168.1.50:3000</code> for LAN
            access) and restart the app.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
