import type { Step } from "./flatten";
import { jsonDiff, type FieldDiff } from "./jsonDiff";
export type RowStatus = "match" | "changed" | "inserted" | "removed";
export interface AlignedRow {
  status: RowStatus;
  baseline?: Step;
  candidate?: Step;
  fieldDiffs: FieldDiff[];
}
const semantic = (s: Step) => ({
  input: s.input,
  args: s.args,
  output: s.output,
  model: s.model,
  error: s.error,
});
function row(baseline?: Step, candidate?: Step): AlignedRow {
  const fieldDiffs = jsonDiff(
    baseline && semantic(baseline),
    candidate && semantic(candidate),
  );
  return {
    baseline,
    candidate,
    fieldDiffs,
    status: !baseline
      ? "inserted"
      : !candidate
        ? "removed"
        : fieldDiffs.length
          ? "changed"
          : "match",
  };
}
/** Needleman–Wunsch: key match +2, mismatch -1, gap -1; deterministic diagonal ties. */
export function align(a: Step[], b: Step[]): AlignedRow[] {
  const n = a.length,
    m = b.length;
  const grid = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = 0; i <= n; i++) grid[i][0] = -i;
  for (let j = 0; j <= m; j++) grid[0][j] = -j;
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++) {
      grid[i][j] = Math.max(
        grid[i - 1][j - 1] + (a[i - 1].key === b[j - 1].key ? 2 : -1),
        grid[i - 1][j] - 1,
        grid[i][j - 1] - 1,
      );
    }
  const rows: AlignedRow[] = [];
  let i = n,
    j = m;
  while (i || j) {
    if (
      i &&
      j &&
      grid[i][j] ===
        grid[i - 1][j - 1] + (a[i - 1].key === b[j - 1].key ? 2 : -1)
    ) {
      if (a[i - 1].key === b[j - 1].key) rows.push(row(a[--i], b[--j]));
      else {
        rows.push(row(undefined, b[--j]), row(a[--i], undefined));
      }
    } else if (i && (!j || grid[i][j] === grid[i - 1][j] - 1))
      rows.push(row(a[--i], undefined));
    else rows.push(row(undefined, b[--j]));
  }
  return rows.reverse();
}
