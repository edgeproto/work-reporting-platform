"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteReportAction } from "@/app/(dashboard)/my-reports/actions";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

type DeleteReportButtonProps = {
  reportId: string;
  label?: string;
  size?: "default" | "sm" | "icon-sm";
  variant?: "ghost" | "outline" | "destructive";
};

export function DeleteReportButton({
  reportId,
  label,
  size = "sm",
  variant = "outline",
}: DeleteReportButtonProps) {
  const dict = useDictionary();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const buttonLabel = label ?? dict.common.delete;

  const handleDelete = () => {
    if (!window.confirm(dict.reports.deleteConfirm)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deleteReportAction(reportId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  };

  if (size === "icon-sm") {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button
          type="button"
          variant={variant}
          size="icon-sm"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={dict.reports.deleteAria}
        >
          <Trash2 />
        </Button>
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={handleDelete}
        disabled={isPending}
      >
        {isPending ? dict.common.deleting : buttonLabel}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
