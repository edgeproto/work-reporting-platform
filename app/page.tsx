import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Status Reporting Platform
        </h1>
        <p className="text-muted-foreground">
          Self-hosted plans and reports for your team. Scaffold ready — auth and
          workflows coming next.
        </p>
      </div>
      <Button variant="outline" disabled>
        Sign in (Phase 1)
      </Button>
    </main>
  );
}
