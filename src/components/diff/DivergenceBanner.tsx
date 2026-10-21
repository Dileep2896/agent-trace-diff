import { CheckCheck, GitFork, ArrowDown } from "lucide-react";
import type { Divergence } from "@/lib/diff/divergence";
export function DivergenceBanner({
  divergence,
  changedCount,
  onJump,
}: {
  divergence: Divergence | null;
  changedCount: number;
  onJump: () => void;
}) {
  if (!divergence)
    return (
      <div className="divergence-banner success">
        <CheckCheck size={21} />
        <div>
          <strong>
            {changedCount
              ? "No sustained divergence"
              : "No divergence: runs match"}
          </strong>
          <p>
            {changedCount
              ? "Isolated changes re-sync within one step. Inspect the changed rows below."
              : "Both runs follow the same execution path. Independent sibling reordering is normalized."}
          </p>
        </div>
      </div>
    );
  return (
    <div className="divergence-banner">
      <span className="divergence-icon">
        <GitFork size={20} />
      </span>
      <div>
        <strong>
          Diverged at step {divergence.step}{" "}
          <span className="banner-divider">/</span>{" "}
          <code>{divergence.name}</code>
          <span className="type-mini">{divergence.type}</span>
        </strong>
        <p>
          <span>{divergence.reason}</span>
          <span className="downstream">
            {divergence.downstreamCount} downstream spans affected
          </span>
        </p>
      </div>
      <button
        className="icon-button"
        aria-label="Jump to divergence"
        title="Jump to divergence"
        onClick={onJump}
      >
        <ArrowDown size={17} />
      </button>
    </div>
  );
}
