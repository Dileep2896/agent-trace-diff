import type { Trace } from "../trace/schema";
import type { RegressionCase, RegressionCaseInput } from "../diff/regression";
export interface TracePairSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  baselineId: string;
  candidateId: string;
  baselineLabel: string;
  candidateLabel: string;
}
export interface TraceClient {
  listTracePairs(): Promise<TracePairSummary[]>;
  getTrace(traceId: string): Promise<Trace>;
  createRegressionTestCase(input: RegressionCaseInput): Promise<{ id: string }>;
  listRegressionTestCases(): Promise<RegressionCase[]>;
}
