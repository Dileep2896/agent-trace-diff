import type { Span, Trace } from "../trace/schema";
import { flatten } from "./flatten";
export interface Delta {
  baseline: number;
  candidate: number;
  absolute: number;
  percent: number | null;
}
export const delta = (baseline: number, candidate: number): Delta => ({
  baseline,
  candidate,
  absolute: candidate - baseline,
  percent:
    baseline === 0
      ? candidate === 0
        ? 0
        : null
      : ((candidate - baseline) / baseline) * 100,
});
export function spanDeltas(a?: Span, b?: Span) {
  return {
    latency: delta(a ? a.endMs - a.startMs : 0, b ? b.endMs - b.startMs : 0),
    tokensIn: delta(a?.tokensIn ?? 0, b?.tokensIn ?? 0),
    tokensOut: delta(a?.tokensOut ?? 0, b?.tokensOut ?? 0),
    cost: delta(a?.costUsd ?? 0, b?.costUsd ?? 0),
  };
}
export function traceDeltas(a: Trace, b: Trace) {
  const sum = (t: Trace, key: "tokensIn" | "tokensOut" | "costUsd") =>
    flatten(t).reduce((total, span) => total + (span[key] ?? 0), 0);
  // Compare the same evaluation metric, never unrelated positions in an array.
  const metric = a.evalScores.find((score) =>
    b.evalScores.some((other) => other.metric === score.metric),
  );
  const scoreA = metric?.score ?? 0;
  const scoreB =
    b.evalScores.find((score) => score.metric === metric?.metric)?.score ?? 0;
  return {
    latency: delta(
      a.root.endMs - a.root.startMs,
      b.root.endMs - b.root.startMs,
    ),
    tokens: delta(
      sum(a, "tokensIn") + sum(a, "tokensOut"),
      sum(b, "tokensIn") + sum(b, "tokensOut"),
    ),
    cost: delta(sum(a, "costUsd"), sum(b, "costUsd")),
    evalScore: delta(scoreA, scoreB),
    evalMetric: metric?.metric ?? null,
  };
}
