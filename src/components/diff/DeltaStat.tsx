import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Delta } from "@/lib/diff/deltas";
export function DeltaStat({
  label,
  value,
  format,
  higherIsBetter = false,
}: {
  label: string;
  value: Delta;
  format: (n: number) => string;
  higherIsBetter?: boolean;
}) {
  const down = value.absolute < 0;
  const Icon =
    value.absolute === 0 ? ArrowRight : down ? ArrowDownRight : ArrowUpRight;
  const tone =
    value.absolute === 0
      ? "neutral"
      : down !== higherIsBetter
        ? "positive"
        : "negative";
  return (
    <div className="delta-stat">
      <div className="stat-label">
        {label}
        <span className={`stat-change ${tone}`}>
          <Icon size={13} />
          {value.percent === null
            ? "new"
            : `${Math.abs(value.percent).toFixed(1)}%`}
        </span>
      </div>
      <div className="stat-values">
        <span>{format(value.baseline)}</span>
        <ArrowRight size={14} />
        <strong>{format(value.candidate)}</strong>
      </div>
    </div>
  );
}
