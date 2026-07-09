import { redirect } from "next/navigation";

import { Role } from "@/app/generated/prisma/enums";
import type { DashboardNavLink } from "@/components/dashboard-nav";
import { DashboardShell } from "@/components/dashboard-shell";
import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { canManageUsers } from "@/lib/rbac";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

function buildNavLinks(role: Role, dict: Dictionary): DashboardNavLink[] {
  const links: DashboardNavLink[] = [
    { href: "/", label: dict.nav.home, icon: "home" },
    { href: "/my-feed", label: dict.nav.myFeed, icon: "myFeed" },
    { href: "/dashboard", label: dict.nav.teamFeed, icon: "teamFeed" },
  ];

  if (canManageUsers({ role })) {
    links.push({ href: "/admin/users", label: dict.nav.users, icon: "users" });
  }

  links.push({ href: "/settings", label: dict.nav.settings, icon: "settings" });

  return links;
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const locale = await getLocale();
  const dict = getDictionary(locale);
  const navLinks = buildNavLinks(session.user.role, dict);
  const roleLabel = dict.roles[session.user.role];
  const avatarUser = await db.user.findFirst({
    where: { id: session.user.id },
    select: { avatarKey: true },
  });

  return (
    <DashboardShell
      appTitle={dict.app.title}
      navLinks={navLinks}
      userName={session.user.name ?? session.user.email ?? "User"}
      roleLabel={roleLabel}
      userId={session.user.id}
      hasAvatar={!!avatarUser?.avatarKey}
      signOutLabel={dict.header.signOut}
      signOutAction={signOutAction}
    >
      {children}
    </DashboardShell>
  );
}
