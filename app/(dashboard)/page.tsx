import Link from "next/link";

import { auth } from "@/lib/auth";
import { isManagerOrAbove } from "@/lib/rbac";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function DashboardHomePage() {
  const session = await auth();
  const user = session!.user;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome, {user.name}
        </h1>
        <p className="mt-1 text-muted-foreground">
          File plans, submit reports, and keep your team in sync without daily
          standups.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Plans</CardTitle>
            <CardDescription>
              Plan what you intend to work on today, this week, or this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/my-plans"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              View plans
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Reports</CardTitle>
            <CardDescription>
              Report completed work and check off items from your plans.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/my-reports"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              View reports
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              {isManagerOrAbove(user) ? "Team Dashboard" : "Team Feed"}
            </CardTitle>
            <CardDescription>
              {isManagerOrAbove(user)
                ? "See all team plans and reports, including private entries."
                : "Browse public plans and report entries from teammates."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/team"
              className="inline-flex h-8 items-center justify-center rounded-lg bg-primary px-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
            >
              Open team view
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
