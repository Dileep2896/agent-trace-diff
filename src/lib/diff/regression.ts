import type { TracePair } from "../trace/schema";
import type { Divergence } from "./divergence";
import { flatten } from "./flatten";
export interface RegressionCaseInput {
  input: string;
  expected_tools: { name: string; args: Record<string, unknown> }[];
  actual_output: string;
  divergence: Divergence | null;
  sourcePairId: string;
  baselineTraceId: string;
  candidateTraceId: string;
}
export interface RegressionCase extends RegressionCaseInput {
  id: string;
  createdAt: string;
}
export function toRegressionCase(
  pair: TracePair,
  divergence: Divergence | null,
): RegressionCaseInput {
  return {
    input: pair.baseline.input,
    expected_tools: flatten(pair.baseline)
      .filter((s) => s.type === "TOOL")
      .map((s) => ({ name: s.name, args: s.args ?? {} })),
    actual_output: pair.candidate.output,
    divergence,
    sourcePairId: pair.id,
    baselineTraceId: pair.baseline.id,
    candidateTraceId: pair.candidate.id,
  };
}
