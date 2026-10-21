import { GitCompareArrows } from "lucide-react";
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand">
      <span className="brand-mark">
        <GitCompareArrows size={21} strokeWidth={2.5} />
      </span>
      {!compact && (
        <span>
          trace<span className="brand-ai"> diff</span>
        </span>
      )}
    </span>
  );
}
