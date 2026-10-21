import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Upload, FileJson } from "lucide-react";
import { parseTrace, type TracePair } from "@/lib/trace/schema";
export function UploadPair({
  onImport,
  disabled,
}: {
  onImport: (pair: TracePair) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [baseline, setBaseline] = useState("");
  const [candidate, setCandidate] = useState("");
  const [error, setError] = useState("");
  const [reading, setReading] = useState(false);
  async function readFile(
    file: File | undefined,
    setValue: (value: string) => void,
  ) {
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("Use a JSON file smaller than 2 MB.");
      return;
    }
    setReading(true);
    setError("");
    try {
      setValue(await file.text());
    } catch {
      setError("Could not read this file. Try pasting its JSON instead.");
    } finally {
      setReading(false);
    }
  }
  function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      let a, b;
      try {
        a = parseTrace(baseline);
      } catch (e) {
        throw new Error(`Baseline: ${(e as Error).message}`);
      }
      try {
        b = parseTrace(candidate);
      } catch (e) {
        throw new Error(`Candidate: ${(e as Error).message}`);
      }
      if (a.input !== b.input)
        throw new Error(
          "Both traces must use the same input so their executions can be compared.",
        );
      onImport({ id: "imported", baseline: a, candidate: b });
      setOpen(false);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button className="button secondary" disabled={disabled}>
          <Upload size={14} />
          Import traces
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content import-dialog">
          <Dialog.Title>
            <FileJson size={20} /> Compare your traces
          </Dialog.Title>
          <Dialog.Description>
            Paste JSON or select a file for each run. Use the same input for
            both traces. Up to 500 spans and 2 MB per trace.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              className="icon-button dialog-close"
              aria-label="Close import"
            >
              <X size={19} />
            </button>
          </Dialog.Close>
          <form onSubmit={submit}>
            <div className="import-grid">
              {[
                { side: "Baseline", value: baseline, setValue: setBaseline },
                { side: "Candidate", value: candidate, setValue: setCandidate },
              ].map(({ side, value, setValue }) => (
                <div key={side}>
                  <label htmlFor={`${side}-json`}>{side} JSON</label>
                  <textarea
                    id={`${side}-json`}
                    spellCheck={false}
                    placeholder={
                      '{\n  "id": "trace-001",\n  "name": "My agent",\n  "root": { ... }\n}'
                    }
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                  <label className="file-label">
                    <Upload size={14} />
                    Upload {side.toLowerCase()} file
                    <input
                      type="file"
                      accept=".json,application/json"
                      aria-label={`Upload ${side.toLowerCase()} file`}
                      disabled={reading}
                      onChange={(e) =>
                        void readFile(e.target.files?.[0], setValue)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="dialog-actions">
              <span className="muted">
                Processed locally. No data leaves this app.
              </span>
              <button
                className="button primary"
                type="submit"
                disabled={reading}
              >
                {reading ? "Reading file…" : "Compare traces"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
