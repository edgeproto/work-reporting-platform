"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RefreshCw } from "lucide-react";

import { Role } from "@/app/generated/prisma/enums";
import {
  createUserAction,
  regeneratePasswordLinkAction,
  setUserActiveAction,
  updateUserRoleAction,
  type AdminActionResult,
} from "@/app/(dashboard)/admin/users/actions";
import { Badge } from "@/components/ui/badge";
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

export type SerializedAdminUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  hasPassword: boolean;
  passwordSetLink: string | null;
  tokenExpiresAt: string | null;
  createdAt: string;
};

type UsersManagementProps = {
  users: SerializedAdminUser[];
  currentUserId: string;
};

function roleLabel(role: Role): string {
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatExpiry(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleString();
}

function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("textarea");
      input.value = link;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleCopy}
      data-testid="copy-password-link"
    >
      {copied ? <Check /> : <Copy />}
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function CreateUserForm({ onUserCreated }: { onUserCreated?: () => void }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<
    AdminActionResult,
    FormData
  >(createUserAction, {});
  const [createdLink, setCreatedLink] = useState<string | null>(null);

  useEffect(() => {
    if (state.success && state.passwordSetLink) {
      setCreatedLink(state.passwordSetLink);
      onUserCreated?.();
      router.refresh();
    }
  }, [state.success, state.passwordSetLink, onUserCreated, router]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create user</CardTitle>
        <CardDescription>
          New users receive a one-time password-set link to share manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="create-name">Name</Label>
            <Input
              id="create-name"
              name="name"
              required
              data-testid="create-user-name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-email">Email</Label>
            <Input
              id="create-email"
              name="email"
              type="email"
              required
              data-testid="create-user-email"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-role">Role</Label>
            <select
              id="create-role"
              name="role"
              defaultValue={Role.MEMBER}
              data-testid="create-user-role"
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              {Object.values(Role).map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={pending}
              data-testid="create-user-submit"
            >
              {pending ? "Creating…" : "Create user"}
            </Button>
          </div>
        </form>

        {state.error ? (
          <p className="text-sm text-destructive" data-testid="create-user-error">
            {state.error}
          </p>
        ) : null}

        {createdLink ? (
          <div
            className="space-y-2 rounded-lg border bg-muted/30 p-4"
            data-testid="created-user-link"
          >
            <p className="text-sm font-medium">Password-set link created</p>
            <p className="text-sm text-muted-foreground">
              Share this link with the new user (Slack, Teams, in person, etc.).
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                readOnly
                value={createdLink}
                className="font-mono text-xs"
                data-testid="password-set-link"
              />
              <CopyLinkButton link={createdLink} />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function UserRow({
  user,
  currentUserId,
}: {
  user: SerializedAdminUser;
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [linkOverride, setLinkOverride] = useState<string | null>(null);

  const isSelf = user.id === currentUserId;
  const activeLink = linkOverride ?? user.passwordSetLink;
  const expiry = linkOverride ? null : formatExpiry(user.tokenExpiresAt);

  const handleRoleChange = (role: Role) => {
    setError(null);
    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, role);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleToggleActive = () => {
    setError(null);
    startTransition(async () => {
      const result = await setUserActiveAction(user.id, !user.isActive);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  const handleRegenerateLink = () => {
    setError(null);
    startTransition(async () => {
      const result = await regeneratePasswordLinkAction(user.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.passwordSetLink) {
        setLinkOverride(result.passwordSetLink);
      }
      router.refresh();
    });
  };

  return (
    <li
      className="space-y-3 px-4 py-4"
      data-testid={`user-row-${user.email}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{user.name}</span>
            <Badge variant="outline">{roleLabel(user.role)}</Badge>
            {!user.isActive ? (
              <Badge variant="secondary">Inactive</Badge>
            ) : null}
            {user.hasPassword ? (
              <Badge variant="secondary">Password set</Badge>
            ) : (
              <Badge variant="outline">Awaiting password</Badge>
            )}
            {isSelf ? <Badge>You</Badge> : null}
          </div>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isSelf ? (
            <>
              <select
                value={user.role}
                onChange={(e) => handleRoleChange(e.target.value as Role)}
                disabled={isPending || !user.isActive}
                aria-label={`Role for ${user.name}`}
                className="flex h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
              >
                {Object.values(Role).map((role) => (
                  <option key={role} value={role}>
                    {roleLabel(role)}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant={user.isActive ? "outline" : "default"}
                size="sm"
                onClick={handleToggleActive}
                disabled={isPending}
              >
                {user.isActive ? "Deactivate" : "Activate"}
              </Button>
            </>
          ) : null}
        </div>
      </div>

      {user.isActive ? (
        <div className="space-y-2">
          {activeLink ? (
            <div className="flex flex-wrap items-center gap-2">
              <Input
                readOnly
                value={activeLink}
                className="min-w-0 flex-1 font-mono text-xs"
                data-testid={`password-link-${user.email}`}
              />
              <CopyLinkButton link={activeLink} />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRegenerateLink}
                disabled={isPending}
                data-testid={`regenerate-link-${user.email}`}
              >
                <RefreshCw />
                Regenerate
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRegenerateLink}
              disabled={isPending}
              data-testid={`generate-link-${user.email}`}
            >
              <RefreshCw />
              Generate password-set link
            </Button>
          )}
          {expiry ? (
            <p className="text-xs text-muted-foreground">
              Link expires {expiry}
            </p>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </li>
  );
}

export function UsersManagement({
  users,
  currentUserId,
}: UsersManagementProps) {
  return (
    <div className="space-y-8">
      <CreateUserForm />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Team members</h2>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length === 1 ? "" : "s"} in your
            organization
          </p>
        </div>

        {users.length === 0 ? (
          <p className="rounded-lg border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
            No users yet. Create the first account above.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border" data-testid="users-list">
            {users.map((user) => (
              <UserRow
                key={user.id}
                user={user}
                currentUserId={currentUserId}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
