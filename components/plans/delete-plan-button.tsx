"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deletePlanAction } from "@/app/(dashboard)/my-plans/actions";
import { useDictionary } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";

type DeletePlanButtonProps = {
  planId: string;
  label?: string;
  size?: "default" | "sm" | "icon-sm";
  variant?: "ghost" | "outline" | "destructive";
};

export function DeletePlanButton({
  planId,
  label,
  size = "sm",
  variant = "outline",
}: DeletePlanButtonProps) {
  const dict = useDictionary();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const buttonLabel = label ?? dict.common.delete;

  const handleDelete = () => {
    if (!window.confirm(dict.plans.deleteConfirm)) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await deletePlanAction(planId);
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
          aria-label={dict.plans.deleteAria}
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
