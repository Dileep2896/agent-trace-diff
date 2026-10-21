import { z } from "zod";
import type { TraceClient, TracePairSummary } from "./client";
import { traceSchema, type Trace } from "../trace/schema";
import type { RegressionCase, RegressionCaseInput } from "../diff/regression";
import modelBaseline from "@/data/seed/model-swap.baseline.json";
import modelCandidate from "@/data/seed/model-swap.candidate.json";
import promptBaseline from "@/data/seed/prompt-edit.baseline.json";
import promptCandidate from "@/data/seed/prompt-edit.candidate.json";
import toolBaseline from "@/data/seed/tool-bump.baseline.json";
import toolCandidate from "@/data/seed/tool-bump.candidate.json";
import controlBaseline from "@/data/seed/control.baseline.json";
import controlCandidate from "@/data/seed/control.candidate.json";
const fixtures = [
  modelBaseline,
  modelCandidate,
  promptBaseline,
  promptCandidate,
  toolBaseline,
  toolCandidate,
  controlBaseline,
  controlCandidate,
].map((t) => traceSchema.parse(t));
const pairs: TracePairSummary[] = [
  {
    id: "model-swap",
    name: "Credit score advisor",
    description: "A cheaper model sends the lookup to the wrong region.",
    category: "Model swap",
    baselineLabel: "gpt-4.1",
    candidateLabel: "gpt-4.1-mini",
    baselineId: "model-swap-baseline",
    candidateId: "model-swap-candidate",
  },
  {
    id: "prompt-edit",
    name: "Extra retrieval step",
    description: "An edited prompt retrieves an unverified source.",
    category: "Prompt edit",
    baselineLabel: "prompt v1.2",
    candidateLabel: "prompt v1.3",
    baselineId: "prompt-edit-baseline",
    candidateId: "prompt-edit-candidate",
  },
  {
    id: "tool-bump",
    name: "Tool schema migration",
    description: "A nested tool response breaks the agent's assumptions.",
    category: "Tool version",
    baselineLabel: "lookup v1.0",
    candidateLabel: "lookup v2.0",
    baselineId: "tool-bump-baseline",
    candidateId: "tool-bump-candidate",
  },
  {
    id: "control",
    name: "Independent tool reorder",
    description: "The same calls in a different order. No regression.",
    category: "Control",
    baselineLabel: "original order",
    candidateLabel: "reordered tools",
    baselineId: "control-baseline",
    candidateId: "control-candidate",
  },
];
const storedCaseSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  input: z.string(),
  actual_output: z.string(),
  expected_tools: z.array(
    z.object({ name: z.string(), args: z.record(z.string(), z.unknown()) }),
  ),
  divergence: z
    .object({
      index: z.number(),
      step: z.number(),
      name: z.string(),
      type: z.string(),
      reason: z.string(),
      downstreamCount: z.number(),
    })
    .nullable(),
  sourcePairId: z.string(),
  baselineTraceId: z.string(),
  candidateTraceId: z.string(),
});
interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
const STORAGE_KEY = "trace-diff:cases:v1";
export class MemoryTraceClient implements TraceClient {
  private cases: RegressionCase[] = [];
  private storage?: StorageAdapter;
  private delay: boolean;
  constructor(options: { delay?: boolean; storage?: StorageAdapter } = {}) {
    this.delay = options.delay ?? true;
    try {
      this.storage =
        options.storage ??
        (typeof window !== "undefined" ? window.localStorage : undefined);
    } catch {
      /* Browser storage denied: use memory. */
    }
    this.restore();
  }
  private restore() {
    try {
      const raw = this.storage?.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = z.array(storedCaseSchema).safeParse(JSON.parse(raw));
        if (parsed.success) this.cases = parsed.data;
      }
    } catch {
      /* Corrupted/denied storage does not block the demo. */
    }
  }
  private async wait() {
    if (this.delay)
      await new Promise((resolve) =>
        setTimeout(resolve, 120 + Math.random() * 180),
      );
  }
  async listTracePairs(): Promise<TracePairSummary[]> {
    await this.wait();
    return structuredClone(pairs);
  }
  async getTrace(traceId: string): Promise<Trace> {
    await this.wait();
    const trace = fixtures.find((t) => t.id === traceId);
    if (!trace) throw new Error(`Trace ${traceId} not found`);
    return structuredClone(trace);
  }
  async createRegressionTestCase(
    input: RegressionCaseInput,
  ): Promise<{ id: string }> {
    await this.wait();
    this.restore();
    const rand =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : Math.random().toString(16).slice(2) + Date.now().toString(16);
    const id = `TC-${rand.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
    this.cases.unshift({
      ...structuredClone(input),
      id,
      createdAt: new Date().toISOString(),
    });
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(this.cases));
    } catch {
      this.storage =
        undefined; /* Keep all subsequent saves in memory after storage fails. */
    }
    return { id };
  }
  async listRegressionTestCases(): Promise<RegressionCase[]> {
    await this.wait();
    return structuredClone(this.cases);
  }
}
