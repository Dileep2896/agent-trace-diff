import { beforeEach, describe, expect, it } from "vitest";
import { MemoryTraceClient } from "./mock";
import { RemoteTraceClient } from "./real";
import { traceSchema } from "../trace/schema";
import { flatten, canonicalizeSiblings } from "../diff/flatten";
import { align } from "../diff/align";
import { findDivergence } from "../diff/divergence";
import { toRegressionCase } from "../diff/regression";

beforeEach(() => localStorage.clear());
describe("seed and client contract", () => {
  it("returns four validated pairs, each with 8–14 spans and expected divergence", async () => {
    const client = new MemoryTraceClient({
      delay: false,
      storage: localStorage,
    });
    const pairs = await client.listTracePairs();
    expect(pairs).toHaveLength(4);
    for (const summary of pairs) {
      const a = await client.getTrace(summary.baselineId),
        b = await client.getTrace(summary.candidateId);
      expect(traceSchema.safeParse(a).success).toBe(true);
      expect(traceSchema.safeParse(b).success).toBe(true);
      expect(flatten(a).length).toBeGreaterThanOrEqual(8);
      expect(flatten(b).length).toBeLessThanOrEqual(14);
      const rows = align(
        canonicalizeSiblings(flatten(a)),
        canonicalizeSiblings(flatten(b)),
      );
      expect(findDivergence(rows)?.index ?? null).toBe(
        summary.id === "control" ? null : 4,
      );
      if (summary.id === "control")
        expect(rows.every((r) => r.status === "match")).toBe(true);
      if (summary.id === "model-swap")
        expect(findDivergence(rows)?.downstreamCount).toBe(3);
    }
  });
  it("creates and persists regression cases behind the interface", async () => {
    const client = new MemoryTraceClient({
      delay: false,
      storage: localStorage,
    });
    const baseline = await client.getTrace("model-swap-baseline"),
      candidate = await client.getTrace("model-swap-candidate");
    const payload = toRegressionCase(
      { id: "model-swap", baseline, candidate },
      null,
    );
    const { id } = await client.createRegressionTestCase(payload);
    expect(id).toMatch(/^TC-/);
    const reload = new MemoryTraceClient({
      delay: false,
      storage: localStorage,
    });
    expect(await reload.listRegressionTestCases()).toEqual([
      expect.objectContaining({ id, actual_output: candidate.output }),
    ]);
  });
  it("does not expose mutable fixture references", async () => {
    const client = new MemoryTraceClient({ delay: false });
    const t = await client.getTrace("control-baseline");
    t.name = "mutated";
    expect((await client.getTrace("control-baseline")).name).not.toBe(
      "mutated",
    );
  });
  it("reports unknown traces and unconfigured real service", async () => {
    await expect(
      new MemoryTraceClient({ delay: false }).getTrace("unknown"),
    ).rejects.toThrow(/not found/i);
    await expect(new RemoteTraceClient().listTracePairs()).rejects.toThrow(
      "not configured",
    );
  });
  it("recovers safely from corrupted or unavailable local storage", async () => {
    localStorage.setItem("trace-diff:cases:v1", "invalid");
    expect(
      await new MemoryTraceClient({
        delay: false,
        storage: localStorage,
      }).listRegressionTestCases(),
    ).toEqual([]);
    const unavailable = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
    };
    const client = new MemoryTraceClient({
      delay: false,
      storage: unavailable,
    });
    const baseline = await client.getTrace("control-baseline");
    await client.createRegressionTestCase(
      toRegressionCase({ id: "control", baseline, candidate: baseline }, null),
    );
    expect(await client.listRegressionTestCases()).toHaveLength(1);
  });
});
