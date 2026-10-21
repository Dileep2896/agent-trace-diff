import type { TraceClient, TracePairSummary } from "./client";
import type { Trace } from "../trace/schema";
import type { RegressionCase, RegressionCaseInput } from "../diff/regression";
/** Server-only integration boundary. No network or credentials in the demo. */
export class RemoteTraceClient implements TraceClient {
  async listTracePairs(): Promise<TracePairSummary[]> {
    throw new Error("Remote trace client not configured");
  }
  async getTrace(_traceId: string): Promise<Trace> {
    void _traceId;
    throw new Error("Remote trace client not configured");
  }
  async createRegressionTestCase(
    _input: RegressionCaseInput,
  ): Promise<{ id: string }> {
    void _input;
    throw new Error("Remote trace client not configured");
  }
  async listRegressionTestCases(): Promise<RegressionCase[]> {
    throw new Error("Remote trace client not configured");
  }
}
