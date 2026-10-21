import { ChevronDown, GitCompareArrows } from "lucide-react";
import type { TracePairSummary } from "@/lib/traces/client";
export function PairPicker({
  pairs,
  value,
  disabled,
  onChange,
}: {
  pairs: TracePairSummary[];
  value: string;
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  return (
    <div className="pair-picker">
      <GitCompareArrows size={17} />
      <select
        aria-label="Trace pair"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        {pairs.map((pair) => (
          <option key={pair.id} value={pair.id}>
            {pair.name} · {pair.category}
          </option>
        ))}
        {value === "imported" && (
          <option value="imported">Imported trace pair</option>
        )}
      </select>
      <ChevronDown size={14} aria-hidden="true" />
    </div>
  );
}
