import * as Dialog from "@radix-ui/react-dialog";
import { Database, X, Download, FlaskConical } from "lucide-react";
import type { RegressionCase } from "@/lib/diff/regression";
export function RegressionDrawer({
  cases,
  open,
  onOpenChange,
}: {
  cases: RegressionCase[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  function download(test: RegressionCase) {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(test, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `${test.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          className="dialog-content dataset-drawer"
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            document.getElementById("dataset-trigger")?.focus();
          }}
        >
          <Dialog.Title>
            <Database size={20} />
            Regression dataset
          </Dialog.Title>
          <Dialog.Description>
            Real failures, ready for your next evaluation. {cases.length} saved{" "}
            {cases.length === 1 ? "case" : "cases"} in this browser.
          </Dialog.Description>
          <Dialog.Close asChild>
            <button
              className="icon-button dialog-close"
              aria-label="Close dataset"
            >
              <X size={19} />
            </button>
          </Dialog.Close>
          {!cases.length ? (
            <div className="dataset-empty">
              <FlaskConical size={32} />
              <h3>Your next regression test starts here.</h3>
              <p>
                Compare two traces, then select “Turn into regression test” to
                preserve the baseline tools and candidate output.
              </p>
            </div>
          ) : (
            <div className="dataset-list">
              {cases.map((test) => (
                <article key={test.id} className="dataset-case">
                  <header>
                    <code>{test.id}</code>
                    <button
                      className="icon-button"
                      aria-label={`Download ${test.id}`}
                      onClick={() => download(test)}
                    >
                      <Download size={16} />
                    </button>
                  </header>
                  <p>{test.input}</p>
                  <span className="dataset-source">
                    {test.divergence
                      ? `Step ${test.divergence.step} · ${test.divergence.name}`
                      : "No sustained divergence"}
                  </span>
                  <details>
                    <summary>View test case JSON</summary>
                    <pre>{JSON.stringify(test, null, 2)}</pre>
                  </details>
                </article>
              ))}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
