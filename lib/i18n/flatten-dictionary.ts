export function flattenDictionary(
  value: unknown,
  prefix = "",
): Record<string, string> {
  if (typeof value === "string") {
    return prefix ? { [prefix]: value } : {};
  }

  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, string>>(
    (acc, [key, nested]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return { ...acc, ...flattenDictionary(nested, path) };
    },
    {},
  );
}
