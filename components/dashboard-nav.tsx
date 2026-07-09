"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutDashboard,
  Newspaper,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardNavLink = {
  href: string;
  label: string;
  icon?: "home" | "myFeed" | "teamFeed" | "users" | "settings";
};

const ICONS: Record<NonNullable<DashboardNavLink["icon"]>, LucideIcon> = {
  home: Home,
  myFeed: Newspaper,
  teamFeed: LayoutDashboard,
  users: Users,
  settings: Settings,
};

function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({
  links,
  orientation = "horizontal",
  collapsed = false,
}: {
  links: DashboardNavLink[];
  orientation?: "horizontal" | "vertical";
  collapsed?: boolean;
}) {
  const pathname = usePathname();
  const vertical = orientation === "vertical";

  return (
    <nav
      className={cn(
        vertical
          ? "flex flex-col gap-1"
          : "hidden items-center gap-1 sm:flex",
      )}
      aria-label="Main"
    >
      {links.map((link) => {
        const active = isNavLinkActive(pathname, link.href);
        const Icon = link.icon ? ICONS[link.icon] : null;

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? link.label : undefined}
            className={cn(
              "rounded-lg text-sm transition-colors",
              vertical
                ? collapsed
                  ? "flex items-center justify-center px-2 py-2"
                  : "flex items-center gap-3 px-3 py-2"
                : "px-2.5 py-1.5",
              active
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {Icon ? <Icon className="size-4 shrink-0" aria-hidden /> : null}
            {!collapsed || !vertical ? <span>{link.label}</span> : null}
            {collapsed && vertical && !Icon ? (
              <span className="text-xs font-medium">
                {link.label.slice(0, 1)}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
