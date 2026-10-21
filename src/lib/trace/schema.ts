import { z } from "zod";

export const spanTypes = ["AGENT", "LLM", "TOOL", "RETRIEVER", "FUNC"] as const;
export type SpanType = (typeof spanTypes)[number];
export interface Span {
  id: string;
  name: string;
  type: SpanType;
  parentId: string | null;
  startMs: number;
  endMs: number;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  input?: unknown;
  args?: Record<string, unknown>;
  output?: unknown;
  error?: string;
  children?: Span[];
}
const nonnegative = z.number().finite().nonnegative();
export const spanSchema: z.ZodType<Span> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1),
      name: z.string().min(1),
      type: z.enum(spanTypes),
      parentId: z.string().nullable(),
      startMs: nonnegative,
      endMs: nonnegative,
      model: z.string().optional(),
      tokensIn: nonnegative.int().optional(),
      tokensOut: nonnegative.int().optional(),
      costUsd: nonnegative.optional(),
      input: z.unknown().optional(),
      args: z.record(z.string(), z.unknown()).optional(),
      output: z.unknown().optional(),
      error: z.string().optional(),
      children: z.array(spanSchema).optional(),
    })
    .refine((s) => s.endMs >= s.startMs, {
      message: "Span endMs must be at or after startMs",
      path: ["endMs"],
    }),
);
export const traceSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    input: z.string(),
    output: z.string(),
    createdAt: z.iso.datetime({ offset: true }),
    tags: z.array(z.string()),
    evalScores: z.array(
      z.object({
        metric: z.string().min(1),
        score: z.number().min(0).max(1),
        threshold: z.number().min(0).max(1),
      }),
    ),
    root: spanSchema,
  })
  .superRefine((trace, ctx) => {
    const ids = new Set<string>();
    const visit = (span: Span, parentId: string | null) => {
      if (ids.has(span.id))
        ctx.addIssue({
          code: "custom",
          message: "Span IDs must be unique within a trace",
        });
      ids.add(span.id);
      if (span.parentId !== parentId)
        ctx.addIssue({
          code: "custom",
          message: `Invalid parentId for span ${span.name}`,
        });
      span.children?.forEach((s) => visit(s, span.id));
    };
    visit(trace.root, null);
  });
export type Trace = z.infer<typeof traceSchema>;
export interface TracePair {
  id: string;
  baseline: Trace;
  candidate: Trace;
}

export function parseTrace(text: string): Trace {
  if (text.length > 2_000_000)
    throw new Error("Trace is too large. Use a JSON file smaller than 2 MB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("Please enter valid JSON for this trace.");
  }
  // Bound recursive validation and O(n*m) alignment before touching user-controlled trees.
  let count = 0;
  const check = (node: unknown, depth: number) => {
    if (!node || typeof node !== "object") return;
    if (++count > 500)
      throw new Error("Each trace supports at most 500 spans.");
    if (depth > 32)
      throw new Error("Trace nesting must be 32 levels or fewer.");
    const children = (node as { children?: unknown }).children;
    if (Array.isArray(children))
      children.forEach((child) => check(child, depth + 1));
  };
  if (value && typeof value === "object")
    check((value as { root?: unknown }).root, 0);
  const parsed = traceSchema.safeParse(value);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    throw new Error(
      `Invalid trace${issue.path.length ? ` at ${issue.path.join(".")}` : ""}: ${issue.message}`,
    );
  }
  return parsed.data;
}
