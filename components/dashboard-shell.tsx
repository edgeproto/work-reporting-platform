"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import {
  DashboardNav,
  type DashboardNavLink,
} from "@/components/dashboard-nav";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

const SIDEBAR_COOKIE = "sidebarCollapsed";

type DashboardShellProps = {
  appTitle: string;
  navLinks: DashboardNavLink[];
  locale: Locale;
  languageLabel: string;
  userName: string;
  roleLabel: string;
  userId: string;
  hasAvatar: boolean;
  signOutLabel: string;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
};

function readCollapsedCookie(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.cookie
    .split("; ")
    .some((part) => part === `${SIDEBAR_COOKIE}=1`);
}

function writeCollapsedCookie(collapsed: boolean) {
  document.cookie = `${SIDEBAR_COOKIE}=${collapsed ? "1" : "0"}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function DashboardShell({
  appTitle,
  navLinks,
  locale,
  languageLabel,
  userName,
  roleLabel,
  userId,
  hasAvatar,
  signOutLabel,
  signOutAction,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsedCookie());
    setHydrated(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      writeCollapsedCookie(next);
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside
        className={cn(
          "sticky top-0 flex h-screen shrink-0 flex-col border-r bg-background transition-[width] duration-200 ease-out",
          !hydrated ? "w-60" : collapsed ? "w-14" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex items-center border-b",
            collapsed
              ? "justify-center px-2 py-3"
              : "justify-between gap-2 px-3 py-3",
          )}
        >
          {!collapsed ? (
            <Link
              href="/"
              className="min-w-0 truncate px-1 font-semibold tracking-tight"
            >
              {appTitle}
            </Link>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
          </Button>
        </div>

        <div
          className={cn(
            "flex-1 overflow-y-auto py-4",
            collapsed ? "px-1.5" : "px-2",
          )}
        >
          <DashboardNav
            links={navLinks}
            orientation="vertical"
            collapsed={collapsed}
          />
        </div>

        <div
          className={cn(
            "space-y-3 border-t py-4",
            collapsed ? "px-1.5" : "px-4",
          )}
        >
          {!collapsed ? (
            <>
              <LanguageSwitcher locale={locale} label={languageLabel} />
              <div className="flex items-center gap-3 text-sm">
                {hasAvatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/avatars/${userId}`}
                    alt=""
                    className="size-9 shrink-0 rounded-full border object-cover"
                  />
                ) : (
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-medium">
                    {userName.slice(0, 1).toUpperCase() || "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-medium">{userName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </div>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  {signOutLabel}
                </Button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              {hasAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={`/api/avatars/${userId}`}
                  alt=""
                  className="size-8 rounded-full border object-cover"
                  title={userName}
                />
              ) : (
                <div
                  className="flex size-8 items-center justify-center rounded-full border bg-muted text-xs font-medium"
                  title={`${userName} · ${roleLabel}`}
                >
                  {userName.slice(0, 1).toUpperCase() || "?"}
                </div>
              )}
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={signOutLabel}
                  title={signOutLabel}
                >
                  <LogOut className="size-4" />
                </Button>
              </form>
            </div>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
