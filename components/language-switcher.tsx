"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { setLocaleAction } from "@/lib/i18n/actions";
import { locales, localeLabels, type Locale } from "@/lib/i18n/locales";
import { cn } from "@/lib/utils";

const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  ko: "🇰🇷",
  zh: "🇨🇳",
};

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
  className?: string;
  variant?: "select" | "icon" | "settings";
};

export function LanguageSwitcher({
  locale,
  label,
  className,
  variant = "icon",
}: LanguageSwitcherProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleChange = (nextLocale: Locale) => {
    setOpen(false);
    if (nextLocale === locale) {
      return;
    }

    startTransition(async () => {
      await setLocaleAction(nextLocale);
      router.refresh();
    });
  };

  if (variant === "settings") {
    return (
      <div
        role="radiogroup"
        aria-label={label}
        className={cn("flex flex-wrap gap-2", className)}
      >
        {locales.map((code) => (
          <Button
            key={code}
            type="button"
            variant={code === locale ? "default" : "outline"}
            size="sm"
            disabled={isPending}
            role="radio"
            aria-checked={code === locale}
            onClick={() => handleChange(code)}
            className="gap-2"
          >
            <span className="text-base leading-none" aria-hidden>
              {localeFlags[code]}
            </span>
            <span>{localeLabels[code]}</span>
          </Button>
        ))}
      </div>
    );
  }

  if (variant === "select") {
    return (
      <select
        id="language-switcher"
        aria-label={label}
        value={locale}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.value as Locale)}
        className={cn(
          "h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30",
          className,
        )}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeLabels[code]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={isPending}
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="overflow-hidden p-0"
      >
        <span className="text-base leading-none" aria-hidden>
          {localeFlags[locale]}
        </span>
      </Button>

      {open ? (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute right-0 bottom-full z-50 mb-1 min-w-36 overflow-hidden rounded-lg border bg-popover p-1 shadow-md"
        >
          {locales.map((code) => (
            <li key={code} role="option" aria-selected={code === locale}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleChange(code)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted",
                  code === locale && "bg-muted font-medium",
                )}
              >
                <span className="text-base leading-none" aria-hidden>
                  {localeFlags[code]}
                </span>
                <span>{localeLabels[code]}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
