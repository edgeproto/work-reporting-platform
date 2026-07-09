import type { Dictionary } from "@/lib/i18n/dictionaries/en";
import { formatMessage } from "@/lib/i18n/format";

export function formatFileSize(bytes: number, dict: Dictionary): string {
  if (bytes < 1024) {
    return formatMessage(dict.common.fileSizeB, { size: bytes });
  }
  if (bytes < 1024 * 1024) {
    return formatMessage(dict.common.fileSizeKB, {
      size: (bytes / 1024).toFixed(1),
    });
  }
  return formatMessage(dict.common.fileSizeMB, {
    size: (bytes / (1024 * 1024)).toFixed(1),
  });
}
