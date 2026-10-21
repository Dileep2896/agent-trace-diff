import { describe, expect, it } from "vitest";
import { flatten, canonicalizeSiblings, stableHash } from "./flatten";
import { align } from "./align";
import { findDivergence } from "./divergence";
import { jsonDiff } from "./jsonDiff";
import { traceDeltas } from "./deltas";
import { toRegressionCase } from "./regression";
import {
  traceSchema,
  parseTrace,
  type Trace,
  type Span,
} from "../trace/schema";

const span = (name: string, args = { region: "us-east" }): Span => ({
  id: name,
  name,
  type: "TOOL",
  parentId: "root",
  startMs: 0,
  endMs: 10,
  args,
  output: { ok: true },
});
const trace = (children: Span[]): Trace => ({
  id: "trace",
  name: "Test",
  input: "Help",
  output: "Done",
  createdAt: "2026-10-21T10:00:00Z",
  tags: [],
  evalScores: [{ metric: "Accuracy", score: 0.9, threshold: 0.7 }],
  root: {
    id: "root",
    name: "agent",
    type: "AGENT",
    parentId: null,
    startMs: 0,
    endMs: 100,
    children,
  },
});
const compare = (a: Trace, b: Trace) =>
  align(canonicalizeSiblings(flatten(a)), canonicalizeSiblings(flatten(b)));

describe("trace alignment (written before implementation)", () => {
  it("flattens in pre-order with depth, path, semantic key and stable signature", () => {
    const steps = flatten(trace([span("lookup")]));
    expect(steps.map((s) => [s.depth, s.key])).toEqual([
      [0, "AGENT:agent"],
      [1, "TOOL:lookup"],
    ]);
    expect(steps[1].path).toEqual([0, 0]);
    expect(stableHash({ a: 1, b: 2 })).toBe(stableHash({ b: 2, a: 1 }));
  });
  it("identical traces match and have no divergence", () => {
    const t = trace([span("a"), span("b")]);
    const rows = compare(t, structuredClone(t));
    expect(rows.every((r) => r.status === "match")).toBe(true);
    expect(findDivergence(rows)).toBeNull();
  });
  it("marks a single arg change at the right index but ignores isolated noise", () => {
    const a = trace([span("a"), span("b"), span("c")]);
    const b = structuredClone(a);
    b.root.children![0].args = { region: "eu-west" };
    const rows = compare(a, b);
    expect(rows[1].status).toBe("changed");
    expect(rows[1].fieldDiffs).toContainEqual({
      path: "args.region",
      kind: "changed",
      before: "us-east",
      after: "eu-west",
    });
    expect(findDivergence(rows)).toBeNull();
  });
  it("finds sustained divergence and counts downstream non-match rows", () => {
    const a = trace([span("a"), span("b"), span("c")]);
    const b = structuredClone(a);
    b.root.children![0].args = { region: "eu-west" };
    b.root.children![1].output = { ok: false };
    const found = findDivergence(compare(a, b));
    expect(found).toMatchObject({ index: 1, step: 2, downstreamCount: 1 });
    expect(found?.reason).toContain("args.region");
  });
  it("aligns inserted retrieval and detects sustained downstream changes", () => {
    const a = trace([span("a"), span("b")]);
    const b = structuredClone(a);
    b.root.children!.unshift({ ...span("search"), type: "RETRIEVER" });
    b.root.children![1].output = "new retrieval result";
    const rows = align(flatten(a), flatten(b));
    expect(rows.map((r) => r.status)).toEqual([
      "match",
      "inserted",
      "changed",
      "match",
    ]);
    expect(findDivergence(rows)?.index).toBe(1);
  });
  it("marks removed tools", () => {
    const rows = align(
      flatten(trace([span("a"), span("b")])),
      flatten(trace([span("b")])),
    );
    expect(rows.map((r) => r.status)).toEqual(["match", "removed", "match"]);
  });
  it("normalizes independent sibling reordering", () => {
    expect(
      compare(
        trace([span("a"), span("b")]),
        trace([span("b"), span("a")]),
      ).every((r) => r.status === "match"),
    ).toBe(true);
  });
  it("does not normalize siblings whose args consume another sibling's output", () => {
    const a = { ...span("z"), output: { accountId: "acct-123" } };
    const b = { ...span("a"), args: { accountId: "acct-123" } };
    expect(
      canonicalizeSiblings(flatten(trace([a, b]))).map((s) => s.name),
    ).toEqual(["agent", "z", "a"]);
  });
  it("does not normalize siblings from different parents or reorder agent subtrees", () => {
    const a = {
      ...span("z"),
      type: "AGENT" as const,
      children: [{ ...span("inner"), parentId: "z" }],
    };
    expect(
      canonicalizeSiblings(flatten(trace([a, span("a")]))).map((s) => s.name),
    ).toEqual(["agent", "z", "inner", "a"]);
  });
  it("treats a mismatch at the end as sustained, and supports k=0", () => {
    const rows = compare(
      trace([span("a")]),
      trace([{ ...span("a"), model: "changed" }]),
    );
    expect(findDivergence(rows)?.index).toBe(1);
    expect(findDivergence(rows, 0)?.index).toBe(1);
  });
  it("never marks unrelated keys as changed", () => {
    const rows = align(
      flatten(trace([span("a")])),
      flatten(trace([span("other")])),
    );
    expect(rows.map((r) => r.status)).toEqual(["match", "removed", "inserted"]);
  });
});

describe("structural diff and trace metrics", () => {
  it("diffs nested objects, arrays, null and missing keys", () => {
    expect(
      jsonDiff(
        { a: [1, { x: 2 }], gone: null },
        { a: [1, { x: 3 }, 4], added: true },
      ),
    ).toEqual([
      { path: "a[1].x", kind: "changed", before: 2, after: 3 },
      { path: "a[2]", kind: "added", after: 4 },
      { path: "added", kind: "added", after: true },
      { path: "gone", kind: "removed", before: null },
    ]);
    expect(jsonDiff(null, {})).toEqual([
      { path: "$", kind: "changed", before: null, after: {} },
    ]);
  });
  it("calculates root wall-clock latency without double counting nested spans", () => {
    const a = trace([
      { ...span("a"), tokensIn: 10, tokensOut: 5, costUsd: 0.01 },
    ]);
    const b = structuredClone(a);
    b.root.endMs = 80;
    b.root.children![0].tokensOut = 10;
    b.evalScores[0].score = 0.45;
    const d = traceDeltas(a, b);
    expect(d.latency).toMatchObject({
      baseline: 100,
      candidate: 80,
      percent: -20,
    });
    expect(d.tokens).toMatchObject({ baseline: 15, candidate: 20 });
    expect(d.evalScore.percent).toBe(-50);
    expect(traceDeltas(trace([]), trace([])).cost.percent).toBe(0);
  });
  it("uses null percent when baseline is zero and candidate is positive", () => {
    expect(
      traceDeltas(trace([]), trace([{ ...span("a"), costUsd: 1 }])).cost
        .percent,
    ).toBeNull();
  });
  it("builds baseline tool expectations with candidate output and divergence", () => {
    const baseline = trace([span("lookup")]);
    const candidate = structuredClone(baseline);
    candidate.output = "Regressed";
    const result = toRegressionCase({ id: "pair", baseline, candidate }, null);
    expect(result).toMatchObject({
      input: "Help",
      expected_tools: [{ name: "lookup", args: { region: "us-east" } }],
      actual_output: "Regressed",
      divergence: null,
    });
  });
});

describe("trace validation", () => {
  it("accepts valid traces and rejects malformed spans, times and scores", () => {
    expect(traceSchema.safeParse(trace([span("a")])).success).toBe(true);
    expect(traceSchema.safeParse({ input: "missing root" }).success).toBe(
      false,
    );
    expect(
      traceSchema.safeParse(trace([{ ...span("a"), endMs: -1 }])).success,
    ).toBe(false);
    const bad = trace([]);
    bad.evalScores[0].score = 2;
    expect(traceSchema.safeParse(bad).success).toBe(false);
  });
  it("rejects duplicate ids, broken parents and excessive trace sizes with friendly errors", () => {
    expect(() =>
      parseTrace(JSON.stringify(trace([span("a"), span("a")]))),
    ).toThrow(/unique/i);
    expect(() =>
      parseTrace(
        JSON.stringify(trace([{ ...span("a"), parentId: "missing" }])),
      ),
    ).toThrow(/parent/i);
    expect(() => parseTrace("{ nope")).toThrow(/valid JSON/i);
    expect(() =>
      parseTrace(
        JSON.stringify(
          trace(Array.from({ length: 501 }, (_, i) => span(`s${i}`))),
        ),
      ),
    ).toThrow(/500/);
  });
});
