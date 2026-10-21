"use client";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  GitCompareArrows,
  GitFork,
  MousePointer2,
  Pause,
  Play,
  ShieldCheck,
  Sparkles,
  Layers,
  Terminal,
  Wrench,
} from "lucide-react";
import { Brand } from "../Brand";
import { AnimatedMetric } from "./AnimatedMetric";
import { BeforeAfterDiagram } from "./BeforeAfterDiagram";
const scenes = ["hero", "pain", "decision", "diagram", "impact"] as const;
const labels = [
  "The domain",
  "The problem",
  "Why this feature",
  "What it does",
  "Measured impact",
];
const miniSpans = [
  "advisor_orchestrator",
  "credit_analyst_agent",
  "load_credit_context",
  "credit_policy_search",
  "bureau_score_lookup",
  "bureau_score_lookup",
  "generate_advice",
  "advice_formatter",
];
const pipeline = [
  "Flatten both trees",
  "Ignore safe reordering",
  "Align spans (Needleman–Wunsch)",
  "Flag the first sustained change",
  "Save it as a regression eval",
];
export function Story({ autoplay }: { autoplay: boolean }) {
  const reduced = useReducedMotion();
  const [playing, setPlaying] = useState(autoplay);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const { scrollYProgress } = useScroll();
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -70]);
  const duration = reduced ? 0 : 0.6;
  useEffect(() => {
    if (!playing || reduced === null || reduced) return;
    const timer = window.setInterval(() => {
      const next = activeRef.current + 1;
      if (next >= scenes.length) {
        setPlaying(false);
        return;
      }
      activeRef.current = next;
      setActive(next);
      document
        .getElementById(scenes[next])
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [playing, reduced]);
  function goTo(index: number) {
    activeRef.current = index;
    setActive(index);
    document
      .getElementById(scenes[index])
      ?.scrollIntoView({
        behavior: reduced ? "instant" : "smooth",
        block: "start",
      });
  }
  const reveal = {
    initial: reduced ? (false as const) : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: {
      duration,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  };
  return (
    <div
      className="story"
      data-active-scene={scenes[active]}
      data-reduced-motion={reduced ? "true" : "false"}
    >
      <motion.div
        className="story-progress"
        style={{ scaleX: reduced ? 1 : progress }}
      />
      <header className="story-header">
        <Link href="/" aria-label="Trace Diff home">
          <Brand />
        </Link>
        <span className="story-header-label">AN ENGINEERING STORY</span>
        <Link href="/" className="button secondary">
          Open Trace Diff
          <ArrowRight size={14} />
        </Link>
      </header>
      <nav className="story-nav" aria-label="Story sections">
        {scenes.map((id, index) => (
          <button
            key={id}
            onClick={() => goTo(index)}
            className={index === active ? "active" : ""}
            aria-label={`Scene ${index + 1}: ${labels[index]}`}
            aria-current={active === index ? "step" : undefined}
          >
            <span />
            {labels[index]}
          </button>
        ))}
      </nav>
      <button
        className="story-play button secondary"
        onClick={() => {
          if (active === 4) goTo(0);
          setPlaying(!playing);
        }}
        disabled={!!reduced}
        aria-label={playing && !reduced ? "Pause autoplay" : "Play story"}
      >
        {playing && !reduced ? <Pause size={13} /> : <Play size={13} />}
        {reduced
          ? "Reduced motion"
          : playing
            ? "Pause · 4s / scene"
            : "Play · 20s story"}
      </button>
      <main className="story-main">
        {scenes.map((id, index) => (
          <motion.section
            key={id}
            id={id}
            className={`story-scene story-${id}`}
            onViewportEnter={() => {
              activeRef.current = index;
              setActive(index);
            }}
            viewport={{ amount: 0.55 }}
            aria-labelledby={`${id}-title`}
          >
            <div className="scene-count">
              0{index + 1} <span>/ 05</span>
            </div>
            {id === "hero" && (
              <motion.div
                className="story-hero-content"
                style={{ y: reduced ? 0 : heroY }}
              >
                <motion.div {...reveal} className="story-kicker">
                  <span className="domain-badge">◆</span>OBSERVABILITY &amp; EVALS
                  FOR LLM AGENTS
                </motion.div>
                <h1 id="hero-title">
                  {"A score is not a root cause.".split(" ").map((word, i) => (
                    <motion.span
                      key={word}
                      initial={reduced ? false : { opacity: 0, y: 35 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration, delay: reduced ? 0 : 0.12 * i }}
                      style={{ marginRight: "0.24em" }}
                    >
                      {word}
                    </motion.span>
                  ))}
                </h1>
                <motion.p
                  {...reveal}
                  transition={{
                    ...reveal.transition,
                    delay: reduced ? 0 : 0.4,
                  }}
                >
                  Teams swap a model, edit a prompt or bump a tool. Their
                  eval scores drop.
                  <br className="desktop-break" /> Then someone opens two
                  trace trees side by side and hunts for the break by eye.
                </motion.p>
                <motion.div {...reveal} className="domain-proof">
                  <div>
                    <Layers size={20} />
                    <strong>
                      <AnimatedMetric to={16} />
                    </strong>
                    <span>spans to compare by eye, per pair</span>
                  </div>
                  <div>
                    <ShieldCheck size={20} />
                    <strong>
                      <AnimatedMetric to={3} />
                    </strong>
                    <span>everyday changes: model, prompt, tool</span>
                  </div>
                </motion.div>
                <p className="story-source">
                  Demo data: a seeded credit-score advisor agent, 8 spans per
                  run
                </p>
                <button className="story-next" onClick={() => goTo(1)}>
                  One missing piece
                  <ArrowDown size={17} />
                </button>
              </motion.div>
            )}
            {id === "pain" && (
              <div className="scene-inner">
                <motion.div {...reveal}>
                  <span className="story-kicker">01 / THE BLIND SPOT</span>
                  <h2 id="pain-title">
                    The score dropped.
                    <br />
                    <span>Where did the run break?</span>
                  </h2>
                  <p className="story-lede">
                    A model swap made answers worse. Which of the 8 spans changed?
                  </p>
                </motion.div>
                <div className="pain-traces">
                  {[0, 1].map((side) => (
                    <motion.div
                      key={side}
                      className="mini-trace"
                      initial={
                        reduced ? false : { opacity: 0, x: side ? 65 : -65 }
                      }
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: reduced ? 0 : 0.8 }}
                    >
                      <header>
                        <span
                          className={`trace-dot ${side ? "candidate" : "baseline"}`}
                        />
                        {side ? "AFTER THE MODEL SWAP" : "THE RUN YOU TRUST"}
                        <strong>{side ? "0.42" : "0.91"}</strong>
                      </header>
                      {miniSpans.map((name, i) => (
                        <div
                          key={`${name}-${i}`}
                          className={side && i === 4 ? "subtle-error" : ""}
                        >
                          <span className="mono">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <Wrench size={10} />
                          <code>{name}</code>
                          <span>{side ? "?" : "✓"}</span>
                        </div>
                      ))}
                    </motion.div>
                  ))}
                  <motion.div
                    className="searching-cursor"
                    aria-hidden="true"
                    initial={reduced ? false : { x: -100, y: -50 }}
                    whileInView={
                      reduced
                        ? { x: 0, y: 0 }
                        : {
                            x: [-100, 100, -70, 120, 0],
                            y: [-50, 15, 80, -15, 0],
                          }
                    }
                    transition={{
                      duration: 3,
                      repeat: reduced ? 0 : Infinity,
                      repeatDelay: 1,
                    }}
                  >
                    <MousePointer2 size={24} />
                    <span>Which span?</span>
                  </motion.div>
                </div>
                <motion.blockquote {...reveal}>
                  “Every agent metric scores one run against a fixed
                  expectation. None of them compare two real execution traces
                  against each other.”
                  <a href="#decision">
                    Users of popular open-source eval tools, in a public feature
                    request
                    <ArrowRight size={13} />
                  </a>
                </motion.blockquote>
              </div>
            )}
            {id === "decision" && (
              <div className="scene-inner">
                <motion.div {...reveal}>
                  <span className="story-kicker">02 / THE DECISION</span>
                  <h2 id="decision-title">Build the missing comparison.</h2>
                  <p className="story-lede">
                    Eval scores tell you a run got worse. Trace Diff tells you
                    which span went wrong first.
                  </p>
                </motion.div>
                <div className="decision-options">
                  <motion.div
                    className="decision-card rejected"
                    initial={reduced ? false : { opacity: 1 }}
                    whileInView={{ opacity: 0.45 }}
                    viewport={{ once: true }}
                    transition={{ delay: reduced ? 0 : 0.8, duration }}
                  >
                    <ShieldCheck size={26} />
                    <span>THE ALTERNATIVE</span>
                    <h3>Trace fidelity linter</h3>
                    <p>Find missing fields across tracing integrations.</p>
                    <div>Useful, but spread thin across many tracing SDKs.</div>
                  </motion.div>
                  <motion.div
                    className="decision-card chosen"
                    initial={reduced ? false : { scale: 0.97 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: reduced ? 0 : 0.4, duration }}
                  >
                    <GitCompareArrows size={26} />
                    <span>THE CHOICE</span>
                    <h3>Trace Diff</h3>
                    <p>Find the exact span where two real runs diverge.</p>
                    <div>
                      <CheckCheck size={16} />A clear answer. A testable core. A
                      lasting eval.
                    </div>
                  </motion.div>
                </div>
                <div className="reason-chips">
                  {[
                    "Asked for in public by users",
                    "Complements score-based evals",
                    "Deterministic and testable",
                  ].map((reason, i) => (
                    <motion.span
                      key={reason}
                      initial={reduced ? false : { opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{
                        delay: reduced ? 0 : 1 + i * 0.2,
                        duration,
                      }}
                    >
                      <Check size={14} />
                      {reason}
                    </motion.span>
                  ))}
                </div>
              </div>
            )}
            {id === "diagram" && (
              <div className="scene-inner diagram-scene">
                <motion.div {...reveal}>
                  <span className="story-kicker">
                    03 / FROM TWO TREES TO ONE ANSWER
                  </span>
                  <h2 id="diagram-title">
                    Align. Find the fork. Save the test.
                  </h2>
                  <p className="story-lede">
                    Ignore harmless reordering. Highlight the first sustained
                    divergence.
                  </p>
                </motion.div>
                <BeforeAfterDiagram />
                <div className="reason-chips">
                  {pipeline.map((stepLabel, i) => (
                    <span key={stepLabel}>
                      <span className="mono">{i + 1}</span>
                      {stepLabel}
                    </span>
                  ))}
                </div>
                <p className="diagram-caption">
                  <GitFork size={13} />
                  Illustrative workflow · the comparison itself is deterministic
                </p>
              </div>
            )}
            {id === "impact" && (
              <div className="scene-inner impact-scene">
                <motion.div {...reveal}>
                  <span className="story-kicker">
                    04 / A SHORTER PATH TO THE FIX
                  </span>
                  <h2 id="impact-title">
                    Less hunting.
                    <br />
                    <span>More evidence.</span>
                  </h2>
                </motion.div>
                <motion.div {...reveal} className="impact-metric">
                  <span className="metric-before">
                    16<small>spans</small>
                  </span>
                  <ArrowRight size={42} />
                  <strong>
                    <AnimatedMetric from={16} to={1} suffix=" row" duration={2} />
                  </strong>
                </motion.div>
                <p className="impact-caption">
                  What you read to find the break{" "}
                  <span>
                    Measured on the seeded model-swap pair: step 5 flagged,
                    3 downstream spans marked
                  </span>
                </p>
                <div className="impact-secondary">
                  <div>
                    <strong>
                      <AnimatedMetric to={3} />/3
                    </strong>
                    <span>seeded regressions pinned to the exact step</span>
                  </div>
                  <div>
                    <strong>
                      <AnimatedMetric to={0} /> false alarms
                    </strong>
                    <span>on the reordered all-match control</span>
                  </div>
                  <div>
                    <strong>&lt;1 ms</strong>
                    <span>to diff a pair · 1 click to save the eval</span>
                  </div>
                </div>
                <motion.div {...reveal} className="story-end">
                  <Link href="/" className="button primary">
                    Explore Trace Diff
                    <ArrowRight size={16} />
                  </Link>
                  <p>
                    <Sparkles size={13} />
                    Trace Diff · an independent project · Built with Codex, verified by Claude Code
                  </p>
                  <span>
                    <Terminal size={12} />
                    Next.js · React · TypeScript · Vitest
                  </span>
                </motion.div>
              </div>
            )}
          </motion.section>
        ))}
      </main>
    </div>
  );
}
