"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCheck,
  ChevronRight,
  Database,
  FlaskConical,
  GitCompareArrows,
  MessageSquare,
  Play,
  Plus,
  RotateCcw,
  Terminal,
  TriangleAlert,
} from "lucide-react";
import type { TracePair } from "@/lib/trace/schema";
import type { TraceClient, TracePairSummary } from "@/lib/traces/client";
import { MemoryTraceClient } from "@/lib/traces/mock";
import { flatten, canonicalizeSiblings } from "@/lib/diff/flatten";
import { align } from "@/lib/diff/align";
import { findDivergence } from "@/lib/diff/divergence";
import { traceDeltas } from "@/lib/diff/deltas";
import { toRegressionCase, type RegressionCase } from "@/lib/diff/regression";
import { Brand } from "../Brand";
import { AlignedTree } from "./AlignedTree";
import { SpanDetailPanel } from "./SpanDetailPanel";
import { PairPicker } from "./PairPicker";
import { UploadPair } from "./UploadPair";
import { DeltaStat } from "./DeltaStat";
import { DivergenceBanner } from "./DivergenceBanner";
import { RegressionDrawer } from "../regression/RegressionDrawer";
import { Toast } from "../regression/Toast";

const getRows = (pair: TracePair) =>
  align(
    canonicalizeSiblings(flatten(pair.baseline)),
    canonicalizeSiblings(flatten(pair.candidate)),
  );
export function TraceDiffView({
  pairs,
  initialPair,
  client: suppliedClient,
}: {
  pairs: TracePairSummary[];
  initialPair: TracePair;
  client?: TraceClient;
}) {
  const [client] = useState(() => suppliedClient ?? new MemoryTraceClient());
  const [pair, setPair] = useState(initialPair);
  const [selected, setSelected] = useState<number | null>(
    () => findDivergence(getRows(initialPair))?.index ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [cases, setCases] = useState<RegressionCase[]>([]);
  const [datasetOpen, setDatasetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const requestVersion = useRef(0);
  const rows = useMemo(() => getRows(pair), [pair]);
  const divergence = useMemo(() => findDivergence(rows), [rows]);
  const deltas = useMemo(
    () => traceDeltas(pair.baseline, pair.candidate),
    [pair],
  );
  const summary = pairs.find((p) => p.id === pair.id);
  const changedCount = rows.filter((r) => r.status !== "match").length;
  const jump = useCallback((index: number) => {
    const element = document.getElementById(`trace-row-${index}`);
    element?.scrollIntoView({
      block: "nearest",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }, []);
  useEffect(() => {
    if (divergence) jump(divergence.index);
  }, [pair.id, divergence, jump]);
  useEffect(() => {
    let active = true;
    client
      .listRegressionTestCases()
      .then((result) => {
        if (active) setCases(result);
      })
      .catch(() => {
        if (active)
          setError(
            "Could not load the regression dataset. Try opening it again.",
          );
      });
    return () => {
      active = false;
    };
  }, [client]);
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (
        busy ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        document.querySelector('[role="dialog"]')
      )
        return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true]"))
        return;
      const indices = rows.flatMap((r, i) => (r.status === "match" ? [] : [i]));
      if ((event.key === "j" || event.key === "k") && indices.length) {
        event.preventDefault();
        const position = selected === null ? -1 : indices.indexOf(selected);
        const next =
          event.key === "j"
            ? indices[(position + 1) % indices.length]
            : indices[(position <= 0 ? indices.length : position) - 1];
        setSelected(next);
        jump(next);
        document
          .getElementById(`trace-row-${next}`)
          ?.focus({ preventScroll: true });
      } else if (
        event.key === "Enter" &&
        selected !== null &&
        (target === document.body || target.id.startsWith("trace-row-"))
      ) {
        event.preventDefault();
        setSelected(selected);
        jump(selected);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, selected, busy, jump]);
  async function switchPair(id: string) {
    const next = pairs.find((p) => p.id === id);
    if (!next) return;
    const version = ++requestVersion.current;
    setBusy(true);
    setError("");
    try {
      const [baseline, candidate] = await Promise.all([
        client.getTrace(next.baselineId),
        client.getTrace(next.candidateId),
      ]);
      if (version !== requestVersion.current) return;
      const loaded = { id, baseline, candidate };
      setPair(loaded);
      setSelected(findDivergence(getRows(loaded))?.index ?? null);
    } catch {
      setError("Could not load this trace pair. Please try again.");
    } finally {
      if (version === requestVersion.current) setBusy(false);
    }
  }
  async function saveCase() {
    if (saving || busy) return;
    setSaving(true);
    setError("");
    try {
      const { id } = await client.createRegressionTestCase(
        toRegressionCase(pair, divergence),
      );
      setCases(await client.listRegressionTestCases());
      setToast(`${id} added to your regression dataset`);
    } catch {
      setError("Could not create the regression test. Please try again.");
    } finally {
      setSaving(false);
    }
  }
  async function openDataset() {
    setDatasetOpen(true);
    try {
      setCases(await client.listRegressionTestCases());
    } catch {
      setError("Could not refresh the regression dataset.");
    }
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to comparison
      </a>
      <aside className="sidebar">
        <Link
          href="/"
          className="brand-link"
          aria-label="Trace Diff home"
        >
          <Brand />
        </Link>
        <div className="project-switch">
          <span className="project-avatar">C</span>
          <div>
            Credit Advisor<span>Demo workspace</span>
          </div>
        </div>
        <div className="nav-section-label">OBSERVABILITY</div>
        <nav aria-label="Main navigation">
          <a href="#comparison" className="nav-item active" aria-current="page">
            <GitCompareArrows size={17} />
            Trace Diff<span className="new-label">NEW</span>
          </a>
          <button
            id="dataset-trigger"
            className="nav-item"
            onClick={() => void openDataset()}
          >
            <Database size={17} />
            Regression dataset
            {cases.length > 0 && (
              <span className="nav-count">{cases.length}</span>
            )}
          </button>
          <Link href="/story" className="nav-item">
            <Play size={17} />
            The story
            <ArrowRight size={13} className="nav-arrow" />
          </Link>
        </nav>
        <div className="sidebar-bottom">
          <div className="local-note">
            <span className="live-dot" />
            Local demo<span>No API key needed</span>
          </div>
          <Link className="nav-item" href="/story#pain">
            <BookOpen size={15} />
            Why we built this
            <ArrowRight size={12} />
          </Link>
          <div className="workspace-user">
            <span className="user-avatar">DE</span>
            <div>
              Demo engineer<span>Built with Codex</span>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <div className="breadcrumbs">
            <span className="mobile-brand">
              <Brand compact />
            </span>
            <span>Workspace</span>
            <ChevronRight size={12} />
            <span>Credit Advisor</span>
            <ChevronRight size={12} />
            <strong>Trace Diff</strong>
          </div>
          <span className="demo-tag">
            <span />
            Interactive demo
          </span>
        </header>
        <main id="main">
          <section className="page-heading">
            <div>
              <div className="eyebrow">
                <Activity size={13} />
                OBSERVABILITY / COMPARE
              </div>
              <h1>Find the first wrong turn.</h1>
              <p>
                Compare agent traces. Pinpoint the divergence. Make it a test.
              </p>
            </div>
            <button
              className="button primary regression-button"
              disabled={saving || busy}
              onClick={() => void saveCase()}
            >
              <Plus size={16} />
              {saving ? "Creating test…" : "Turn into regression test"}
            </button>
          </section>
          <section
            className="comparison-toolbar"
            aria-label="Comparison controls"
          >
            <PairPicker
              pairs={pairs}
              value={pair.id}
              disabled={busy || saving}
              onChange={(id) => void switchPair(id)}
            />
            <span className="scenario-description">
              {summary?.description ?? "Your traces, compared locally."}
            </span>
            <UploadPair
              disabled={busy || saving}
              onImport={(loaded) => {
                requestVersion.current++;
                setPair(loaded);
                setSelected(findDivergence(getRows(loaded))?.index ?? null);
                setError("");
              }}
            />
          </section>
          {error && (
            <div className="form-error global-error" role="alert">
              <TriangleAlert size={17} />
              {error}
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}
          <div className="comparison-content" aria-busy={busy}>
            <section className="metrics-grid" aria-label="Trace-level deltas">
              <DeltaStat
                label="TOTAL LATENCY"
                value={deltas.latency}
                format={(n) => `${(n / 1000).toFixed(2)}s`}
              />
              <DeltaStat
                label="TOTAL TOKENS"
                value={deltas.tokens}
                format={(n) => n.toLocaleString("en-US")}
              />
              <DeltaStat
                label="TOTAL COST"
                value={deltas.cost}
                format={(n) => `$${n.toFixed(4)}`}
              />
              <DeltaStat
                label={deltas.evalMetric?.toUpperCase() ?? "NO SHARED EVAL"}
                value={deltas.evalScore}
                format={(n) => (deltas.evalMetric ? n.toFixed(2) : "—")}
                higherIsBetter
              />
            </section>
            <div className="trace-input">
              <span>
                <MessageSquare size={14} />
                INPUT
              </span>
              <p>{pair.baseline.input}</p>
              <span className="same-input">
                <CheckCheck size={13} />
                Same input
              </span>
            </div>
            <DivergenceBanner
              divergence={divergence}
              changedCount={changedCount}
              onJump={() => {
                if (divergence) {
                  setSelected(divergence.index);
                  jump(divergence.index);
                }
              }}
            />
            <section id="comparison" className="comparison-section">
              <div className="section-title">
                <h2>
                  Execution comparison <span>{rows.length} aligned steps</span>
                </h2>
                <span className="keyboard-help">
                  <kbd>j</kbd>
                  <kbd>k</kbd> navigate changes <kbd>↵</kbd> inspect
                </span>
              </div>
              <div
                className={`comparison-workspace ${selected === null ? "no-detail" : ""}`}
              >
                <AlignedTree
                  rows={rows}
                  pair={pair}
                  labels={[
                    summary?.baselineLabel ?? "uploaded baseline",
                    summary?.candidateLabel ?? "uploaded candidate",
                  ]}
                  selected={selected}
                  divergenceIndex={divergence?.index}
                  onSelect={setSelected}
                />
                {selected !== null && rows[selected] && (
                  <SpanDetailPanel
                    key={`${pair.id}-${selected}`}
                    row={rows[selected]}
                    index={selected}
                    onClose={() => setSelected(null)}
                  />
                )}
              </div>
            </section>
            <section className="response-comparison">
              <header>
                <h2>
                  <Terminal size={16} />
                  Final response
                </h2>
                <span>The downstream effect</span>
              </header>
              <div className="response-grid">
                {(["baseline", "candidate"] as const).map((side) => (
                  <div key={side} className={`response ${side}`}>
                    <span className="response-label">
                      <span className={`trace-dot ${side}`} />
                      {side}
                      <span>
                        {pair[side].evalScores
                          .find((s) => s.metric === deltas.evalMetric)
                          ?.score.toFixed(2) ?? "—"}{" "}
                        {deltas.evalMetric ?? "no shared eval"}
                      </span>
                    </span>
                    <p>{pair[side].output}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
          <footer className="app-footer">
            <span>
              <RotateCcw size={12} />
              Deterministic alignment · re-sync window k = 1
            </span>
            <Link href="/story">
              <FlaskConical size={13} />
              From a failing trace to a lasting eval
              <ArrowRight size={13} />
            </Link>
          </footer>
        </main>
      </div>
      <RegressionDrawer
        cases={cases}
        open={datasetOpen}
        onOpenChange={setDatasetOpen}
      />
      {toast && (
        <Toast
          message={toast}
          onClose={() => setToast("")}
          onView={() => {
            setToast("");
            void openDataset();
          }}
        />
      )}
    </div>
  );
}
