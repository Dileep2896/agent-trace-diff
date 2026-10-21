import { Circle, GitBranch } from "lucide-react";
import type { AlignedRow } from "@/lib/diff/align";
import type { TracePair } from "@/lib/trace/schema";
import { DiffRow, StatusBadge } from "./DiffRow";
export function AlignedTree({
  rows,
  pair,
  labels,
  selected,
  divergenceIndex,
  onSelect,
}: {
  rows: AlignedRow[];
  pair: TracePair;
  labels: [string, string];
  selected: number | null;
  divergenceIndex?: number;
  onSelect: (i: number) => void;
}) {
  return (
    <section className="trace-tree" aria-label="Aligned execution traces">
      <div className="trace-column-headings">
        {(["baseline", "candidate"] as const).map((side, i) => (
          <div className={`trace-column-heading ${side}`} key={side}>
            <div>
              <span className={`trace-dot ${side}`} />
              <strong>{side}</strong>
              <span className="model-tag">{labels[i]}</span>
            </div>
            <p>
              <GitBranch size={12} />
              <span>{pair[side].id}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="tree-column-labels">
        <span>
          SPAN NAME <span>DURATION</span>
        </span>
        <span>DIFF</span>
        <span>
          SPAN NAME <span>DURATION</span>
        </span>
      </div>
      <div className="tree-rows">
        {rows.map((row, index) => (
          <DiffRow
            key={`${row.baseline?.id ?? "-"}:${row.candidate?.id ?? "-"}`}
            row={row}
            index={index}
            selected={selected === index}
            firstDivergence={divergenceIndex === index}
            onClick={() => onSelect(index)}
          />
        ))}
      </div>
      <div className="trace-legend">
        {(["match", "changed", "inserted", "removed"] as const).map(
          (status) => (
            <span key={status}>
              <StatusBadge status={status} />
              <span>{rows.filter((r) => r.status === status).length}</span>
            </span>
          ),
        )}
        <span className="aligned-note">
          <Circle size={7} fill="currentColor" /> Aligned by span identity
        </span>
      </div>
    </section>
  );
}
