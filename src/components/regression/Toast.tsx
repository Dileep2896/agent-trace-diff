import { CheckCircle2, X } from "lucide-react";
export function Toast({
  message,
  onClose,
  onView,
}: {
  message: string;
  onClose: () => void;
  onView: () => void;
}) {
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={18} />
      <span>{message}</span>
      <button onClick={onView}>View dataset</button>
      <button
        className="icon-button"
        aria-label="Dismiss notification"
        onClick={onClose}
      >
        <X size={15} />
      </button>
    </div>
  );
}
