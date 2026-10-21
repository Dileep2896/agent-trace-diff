import { useState } from "react";
import { X, ArrowRight, Braces } from "lucide-react";
import type { AlignedRow } from "@/lib/diff/align";
import { spanDeltas } from "@/lib/diff/deltas";
import { JsonDiff } from "./JsonDiff";
import { StatusBadge } from "./DiffRow";
export function SpanDetailPanel({
  row,
  index,
  onClose,
}: {
  row: AlignedRow;
  index: number;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"changes" | "full">("changes");
  const span = row.baseline ?? row.candidate!;
  const deltas = spanDeltas(row.baseline, row.candidate);
  return (
    <aside className="span-detail" aria-label="Span details">
      <header className="detail-heading">
        <span>
          <Braces size={16} /> Span details
        </span>
        <button
          className="icon-button"
          aria-label="Close span details"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </header>
      <div className="detail-identity">
        <div>
          <span className={`type-chip type-${span.type}`}>{span.type}</span>
          <span className="muted mono">STEP {index + 1}</span>
        </div>
        <h2>{span.name}</h2>
        <StatusBadge status={row.status} />
      </div>
      <div
        className="detail-tabs"
        role="tablist"
        aria-label="Span detail view"
        onKeyDown={(event) => {
          if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            const next =
              event.key === "Home"
                ? "changes"
                : event.key === "End"
                  ? "full"
                  : tab === "changes"
                    ? "full"
                    : "changes";
            setTab(next);
            document.getElementById(`span-${next}-tab`)?.focus();
          }
        }}
      >
        <button
          id="span-changes-tab"
          aria-controls="span-tab-panel"
          tabIndex={tab === "changes" ? 0 : -1}
          role="tab"
          aria-selected={tab === "changes"}
          onClick={() => setTab("changes")}
        >
          Changes <span>{row.fieldDiffs.length}</span>
        </button>
        <button
          id="span-full-tab"
          aria-controls="span-tab-panel"
          tabIndex={tab === "full" ? 0 : -1}
          role="tab"
          aria-selected={tab === "full"}
          onClick={() => setTab("full")}
        >
          Full span
        </button>
      </div>
      <div
        id="span-tab-panel"
        className="detail-content"
        role="tabpanel"
        aria-labelledby={`span-${tab}-tab`}
      >
        {tab === "changes" ? (
          <JsonDiff fields={row.fieldDiffs} />
        ) : (
          <div className="full-spans">
            {(["baseline", "candidate"] as const).map((side) => (
              <div key={side}>
                <h3>{side}</h3>
                <pre>
                  {row[side]
                    ? JSON.stringify(
                        {
                          input: row[side].input,
                          args: row[side].args,
                          output: row[side].output,
                          model: row[side].model,
                          error: row[side].error,
                        },
                        null,
                        2,
                      )
                    : "No span"}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="span-metrics">
        <h3>
          SPAN METRICS{" "}
          <span>
            BASELINE <ArrowRight size={11} /> CANDIDATE
          </span>
        </h3>
        {Object.entries(deltas).map(([key, value]) => (
          <div key={key}>
            <span>
              {
                {
                  latency: "Latency",
                  tokensIn: "Tokens in",
                  tokensOut: "Tokens out",
                  cost: "Cost",
                }[key]
              }
            </span>
            <code>
              {key === "cost"
                ? `$${value.baseline.toFixed(5)}`
                : key === "latency"
                  ? `${value.baseline}ms`
                  : value.baseline}{" "}
              <span>→</span>{" "}
              {key === "cost"
                ? `$${value.candidate.toFixed(5)}`
                : key === "latency"
                  ? `${value.candidate}ms`
                  : value.candidate}
            </code>
            <span className="metric-delta">
              {value.percent === null
                ? "new"
                : `${value.percent > 0 ? "+" : ""}${value.percent.toFixed(0)}%`}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
