export interface FieldDiff {
  path: string;
  kind: "added" | "removed" | "changed";
  before?: unknown;
  after?: unknown;
}
const object = (v: unknown): v is Record<string, unknown> =>
  v !== null && typeof v === "object" && !Array.isArray(v);
export function jsonDiff(a: unknown, b: unknown, path = ""): FieldDiff[] {
  if (Object.is(a, b)) return [];
  if (Array.isArray(a) && Array.isArray(b)) {
    return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => {
      const p = `${path}[${i}]`;
      if (i >= a.length)
        return [{ path: p, kind: "added" as const, after: b[i] }];
      if (i >= b.length)
        return [{ path: p, kind: "removed" as const, before: a[i] }];
      return jsonDiff(a[i], b[i], p);
    }).flat();
  }
  if (object(a) && object(b)) {
    return [...new Set([...Object.keys(a), ...Object.keys(b)])]
      .sort()
      .flatMap((key) => {
        const p = path ? `${path}.${key}` : key;
        if (!Object.hasOwn(a, key))
          return [{ path: p, kind: "added" as const, after: b[key] }];
        if (!Object.hasOwn(b, key))
          return [{ path: p, kind: "removed" as const, before: a[key] }];
        return jsonDiff(a[key], b[key], p);
      });
  }
  if (a === undefined) return [{ path: path || "$", kind: "added", after: b }];
  if (b === undefined)
    return [{ path: path || "$", kind: "removed", before: a }];
  return [{ path: path || "$", kind: "changed", before: a, after: b }];
}
