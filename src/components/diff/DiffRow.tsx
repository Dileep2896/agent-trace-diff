import {
  Check,
  GitFork,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  Bot,
  Braces,
  Wrench,
  Search,
  Sparkles,
} from "lucide-react";
import type { AlignedRow, RowStatus } from "@/lib/diff/align";
import type { Step } from "@/lib/diff/flatten";
export const statusIcons = {
  match: Check,
  changed: GitFork,
  inserted: Plus,
  removed: Minus,
};
const typeIcons = {
  AGENT: Bot,
  FUNC: Braces,
  TOOL: Wrench,
  RETRIEVER: Search,
  LLM: Sparkles,
};
export function StatusBadge({ status }: { status: RowStatus }) {
  const Icon = statusIcons[status];
  return (
    <span className={`status-badge ${status}`}>
      <Icon size={11} />
      <span>{status}</span>
    </span>
  );
}
function SpanCell({ step, side }: { step?: Step; side: string }) {
  if (!step)
    return (
      <span className="span-cell missing">
        <span>—</span>
        <span>No span in {side}</span>
      </span>
    );
  const Icon = typeIcons[step.type];
  return (
    <span
      className="span-cell"
      style={{ "--depth": step.depth } as React.CSSProperties}
    >
      <span className="tree-branch" aria-hidden="true" />
      {step.children?.length ? (
        <ChevronDown size={12} className="tree-chevron" />
      ) : (
        <ChevronRight size={11} className="tree-chevron leaf" />
      )}
      <span className={`span-type-icon type-${step.type}`}>
        <Icon size={13} />
      </span>
      <span className="span-name" title={step.name}>
        {step.name}
        <span className="span-subtitle">
          {step.model ?? step.type.toLowerCase()}
        </span>
      </span>
      <span className="span-time">
        {((step.endMs - step.startMs) / 1000).toFixed(2)}s
      </span>
    </span>
  );
}
export function DiffRow({
  row,
  index,
  selected,
  firstDivergence,
  onClick,
}: {
  row: AlignedRow;
  index: number;
  selected: boolean;
  firstDivergence: boolean;
  onClick: () => void;
}) {
  const name = row.baseline?.name ?? row.candidate?.name;
  return (
    <button
      id={`trace-row-${index}`}
      type="button"
      className={`diff-row ${row.status} ${selected ? "selected" : ""} ${firstDivergence ? "first-divergence" : ""}`}
      aria-label={`Step ${index + 1}: ${name}, ${row.status}`}
      aria-pressed={selected}
      onClick={onClick}
    >
      <SpanCell step={row.baseline} side="baseline" />
      <span className="row-gutter">
        <StatusBadge status={row.status} />
      </span>
      <SpanCell step={row.candidate} side="candidate" />
    </button>
  );
}
