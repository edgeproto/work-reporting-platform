import Link from "next/link";
import { ClipboardList, ScrollText } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import type { FilingActionMeta } from "@/lib/filing/action-meta";
import { cn } from "@/lib/utils";

type FilingActionLinkProps = {
  href: string;
  kind: "plan" | "report";
  meta: FilingActionMeta;
  className?: string;
};

export function FilingActionLink({
  href,
  kind,
  meta,
  className,
}: FilingActionLinkProps) {
  const Icon = kind === "plan" ? ClipboardList : ScrollText;

  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: meta.variant, size: "sm" }),
        "w-full",
        className,
      )}
    >
      <Icon className="size-3.5" aria-hidden />
      {meta.label}
    </Link>
  );
}
