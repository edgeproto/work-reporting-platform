import { ClipboardList, ScrollText } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FilingActionMeta } from "@/lib/filing/action-meta";
import { cn } from "@/lib/utils";

type FilingActionButtonProps = {
  kind: "plan" | "report";
  meta: FilingActionMeta;
  disabled?: boolean;
  onClick: () => void;
  pendingLabel?: string;
  className?: string;
};

export function FilingActionButton({
  kind,
  meta,
  disabled,
  onClick,
  pendingLabel,
  className,
}: FilingActionButtonProps) {
  const Icon = kind === "plan" ? ClipboardList : ScrollText;

  return (
    <Button
      type="button"
      size="sm"
      variant={meta.variant}
      disabled={disabled}
      className={cn("w-full", className)}
      onClick={onClick}
    >
      <Icon className="size-3.5" aria-hidden />
      {pendingLabel ?? meta.label}
    </Button>
  );
}
