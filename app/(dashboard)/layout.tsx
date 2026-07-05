import Link from "next/link";
import { redirect } from "next/navigation";

import { Role } from "@/app/generated/prisma/enums";
import { DashboardNav, type DashboardNavLink } from "@/components/dashboard-nav";
import { auth, signOut } from "@/lib/auth";
import { canManageUsers, isManagerOrAbove } from "@/lib/rbac";
import { Button } from "@/components/ui/button";

async function signOutAction() {
  "use server";
  await signOut({ redirectTo: "/login" });
}

type NavLink = DashboardNavLink;

function buildNavLinks(role: Role): NavLink[] {
  const links: NavLink[] = [
    { href: "/", label: "Home" },
    { href: "/my-plans", label: "My Plans" },
    { href: "/my-reports", label: "My Reports" },
    { href: "/tasks", label: "My Tasks" },
  ];

  if (isManagerOrAbove({ role })) {
    links.push({ href: "/team", label: "Team Dashboard" });
  } else {
    links.push({ href: "/team", label: "Team Feed" });
  }

  if (canManageUsers({ role })) {
    links.push({ href: "/admin/users", label: "Users" });
    links.push({ href: "/admin/settings", label: "Settings" });
  }

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

  const navLinks = buildNavLinks(session.user.role);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/" className="font-semibold tracking-tight">
              Status Reports
            </Link>
            <DashboardNav links={navLinks} />
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {session.user.role.toLowerCase()}
              </p>
            </div>
            <form action={signOutAction}>
              <Button type="submit" variant="outline" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
