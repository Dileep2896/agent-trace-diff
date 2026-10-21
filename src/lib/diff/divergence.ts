import type { AlignedRow } from "./align";
export interface Divergence {
  index: number;
  step: number;
  name: string;
  type: string;
  reason: string;
  downstreamCount: number;
}
export function findDivergence(rows: AlignedRow[], k = 1): Divergence | null {
  if (!Number.isInteger(k) || k < 0)
    throw new Error("Resync window k must be a nonnegative integer");
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (row.status === "match") continue;
    const next = rows.slice(i + 1, i + 1 + k);
    if (k > 0 && next.length === k && next.every((r) => r.status === "match"))
      continue;
    const span = row.baseline ?? row.candidate!;
    const field = row.fieldDiffs[0];
    const reason =
      row.status === "inserted"
        ? "Span inserted in candidate"
        : row.status === "removed"
          ? "Span removed from candidate"
          : field
            ? `${field.path} ${field.kind}: ${JSON.stringify(field.before) ?? "missing"} → ${JSON.stringify(field.after) ?? "missing"}`
            : "Span changed";
    return {
      index: i,
      step: i + 1,
      name: span.name,
      type: span.type,
      reason,
      downstreamCount: rows.slice(i + 1).filter((r) => r.status !== "match")
        .length,
    };
  }
  return null;
}
