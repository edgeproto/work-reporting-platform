"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";

export const FEED_INITIAL_LINES = 5;

export function ExpandableLineList<T>({
  lines,
  expanded,
  renderLine,
  emptyLabel,
  lineKey,
}: {
  lines: T[];
  expanded: boolean;
  renderLine: (line: T, index: number) => React.ReactNode;
  emptyLabel: string;
  lineKey: (line: T, index: number) => string;
}) {
  if (lines.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  const visible = expanded ? lines : lines.slice(0, FEED_INITIAL_LINES);
  const hasMore = lines.length > FEED_INITIAL_LINES;

  return (
    <div className="space-y-1">
      <ul className="space-y-1">{visible.map((line, index) => (
        <li key={lineKey(line, index)}>{renderLine(line, index)}</li>
      ))}</ul>
      {!expanded && hasMore ? (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MoreHorizontal className="size-3.5" aria-hidden />
          <span>{lines.length - FEED_INITIAL_LINES} more</span>
        </div>
      ) : null}
    </div>
  );
}

export function useExpandableItems(itemIds: string[]) {
  const [expandAll, setExpandAll] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const anyExpandable = useMemo(
    () => itemIds.some((id) => id.length > 0),
    [itemIds],
  );

  const isExpanded = (id: string) => expandAll || expandedItems.has(id);

  const toggleItem = (id: string) => {
    if (expandAll) {
      setExpandAll(false);
      setExpandedItems(new Set(itemIds.filter((itemId) => itemId !== id)));
      return;
    }

    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleExpandAll = () => {
    if (expandAll) {
      setExpandAll(false);
      setExpandedItems(new Set());
      return;
    }

    setExpandAll(true);
    setExpandedItems(new Set());
  };

  return {
    expandAll,
    anyExpandable,
    isExpanded,
    toggleItem,
    toggleExpandAll,
  };
}

export function ExpandAllToggleButton({
  expandAll,
  onToggle,
  disabled,
}: {
  expandAll: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onToggle}
      disabled={disabled}
    >
      {expandAll ? "Collapse all" : "Expand all"}
    </Button>
  );
}

export function ExpandMoreButton({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={onToggle}
      aria-label={expanded ? `Collapse ${label}` : `Expand ${label}`}
      aria-expanded={expanded}
    >
      <MoreHorizontal className="size-4" />
    </Button>
  );
}

export function itemHasMoreLines(planCount: number, reportCount: number): boolean {
  return (
    planCount > FEED_INITIAL_LINES || reportCount > FEED_INITIAL_LINES
  );
}
