import type { Span, Trace } from "../trace/schema";
export interface Step extends Span {
  path: number[];
  depth: number;
  key: string;
  signature: string;
}
/** Collision-free canonical JSON fingerprint; object property order is immaterial. */
export function stableHash(value: unknown): string {
  if (value === undefined) return "undefined";
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableHash).join(",")}]`;
  return `{${Object.keys(value)
    .sort()
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableHash((value as Record<string, unknown>)[key])}`,
    )
    .join(",")}}`;
}
export function flatten(trace: Trace): Step[] {
  const steps: Step[] = [];
  const visit = (span: Span, path: number[], depth: number) => {
    steps.push({
      ...span,
      path,
      depth,
      key: `${span.type}:${span.name}`,
      signature: stableHash({ args: span.args, input: span.input }),
    });
    span.children?.forEach((child, i) => visit(child, [...path, i], depth + 1));
  };
  visit(trace.root, [0], 0);
  return steps;
}
function strings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === "object")
    return Object.values(value).flatMap(strings);
  return [];
}
function dependent(a: Step, b: Step): boolean {
  const inputs = strings([b.args, b.input]);
  const refs = [a.id, a.name, ...strings(a.output)];
  return inputs.some((input) =>
    refs.some(
      (ref) =>
        ref.length > 0 &&
        (input === ref ||
          input.includes(`\${${ref}}`) ||
          input.includes(`$ref:${ref}`)),
    ),
  );
}
/** Conservative: only contiguous leaf tools/retrievers, same parent, no visible data references. */
export function canonicalizeSiblings(steps: Step[]): Step[] {
  const result: Step[] = [];
  const eligible = (s: Step) =>
    (s.type === "TOOL" || s.type === "RETRIEVER") && !s.children?.length;
  for (let i = 0; i < steps.length; ) {
    if (!eligible(steps[i])) {
      result.push(steps[i++]);
      continue;
    }
    let end = i + 1;
    while (
      end < steps.length &&
      eligible(steps[end]) &&
      steps[end].parentId === steps[i].parentId &&
      steps[end].depth === steps[i].depth
    )
      end++;
    const group = steps.slice(i, end);
    const hasDependency = group.some((a, ai) =>
      group.some((b, bi) => ai !== bi && dependent(a, b)),
    );
    result.push(
      ...(hasDependency
        ? group
        : group.sort((a, b) =>
            `${a.key}:${a.signature}`.localeCompare(
              `${b.key}:${b.signature}`,
              "en",
            ),
          )),
    );
    i = end;
  }
  return result;
}
