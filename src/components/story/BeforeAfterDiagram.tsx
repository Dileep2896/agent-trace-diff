"use client";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRight, CheckCheck, Database, Plus } from "lucide-react";
const names = [
  "advisor_orchestrator",
  "credit_analyst_agent",
  "load_credit_context",
  "credit_policy_search",
  "bureau_score_lookup",
  "generate_advice",
];
export function BeforeAfterDiagram() {
  const reduced = useReducedMotion();
  return (
    <div className="before-after">
      <svg
        viewBox="0 0 980 360"
        role="img"
        aria-label="Two separate trace trees align. Steps one through four match; step five diverges because region changes from us-east to eu-west."
      >
        <motion.g
          initial={reduced ? false : { opacity: 1 }}
          whileInView={{ opacity: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: reduced ? 0 : 0.55,
            duration: reduced ? 0 : 0.4,
          }}
          style={reduced ? { display: "none" } : undefined}
        >
          <path
            d="M 290 35 Q 490 -5 690 35 M 690 330 Q 490 375 290 330"
            className="manual-loop"
          />
          <text x="490" y="22" textAnchor="middle" className="svg-muted">
            manual compare ↔
          </text>
        </motion.g>
        {[0, 1].map((side) => (
          <motion.g
            key={side}
            initial={{ x: reduced ? (side ? 430 : 120) : side ? 660 : 40 }}
            whileInView={{ x: side ? 430 : 120 }}
            viewport={{ once: true }}
            transition={{
              delay: reduced ? 0 : 0.6,
              duration: reduced ? 0 : 0.8,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <text x="13" y="35" className="svg-label">
              {side ? "CANDIDATE" : "BASELINE"}
            </text>
            <path d="M 21 75 V 312" className="svg-branch" />
            {names.map((name, i) => (
              <g key={name} transform={`translate(0 ${55 + i * 46})`}>
                <motion.rect
                  x="0"
                  y="0"
                  width="260"
                  height="35"
                  rx="5"
                  className={i === 4 ? "diagram-row diverged" : "diagram-row"}
                  initial={false}
                  whileInView={{ opacity: i === 4 && !reduced ? [1, 0.4, 1] : 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: reduced ? 0 : 1.9, duration: reduced ? 0 : 0.7 }}
                />
                <text x="13" y="22" className="svg-index">
                  0{i + 1}
                </text>
                <text x="39" y="22" className="svg-name">
                  {name}
                </text>
              </g>
            ))}
          </motion.g>
        ))}
        {names.map((name, i) => (
          <motion.g
            key={`status-${name}`}
            initial={reduced ? false : { opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              delay: reduced ? 0 : 1.25 + i * 0.16,
              duration: reduced ? 0 : 0.2,
            }}
          >
            <path
              d={`M380 ${72 + i * 46} H430`}
              className={
                i < 4 ? "svg-connector match" : "svg-connector changed"
              }
            />
            <circle
              cx="405"
              cy={72 + i * 46}
              r="11"
              className={i < 4 ? "svg-dot match" : "svg-dot changed"}
            />
            <text
              x="405"
              y={76 + i * 46}
              textAnchor="middle"
              className="svg-status"
            >
              {i < 4 ? "✓" : "!"}
            </text>
          </motion.g>
        ))}
        <motion.g
          initial={reduced ? false : { opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: reduced ? 0 : 2.05,
            duration: reduced ? 0 : 0.35,
          }}
        >
          <path d="M695 256 H720" className="svg-callout-line" />
          <rect
            x="720"
            y="232"
            width="232"
            height="72"
            rx="6"
            className="svg-callout"
          />
          <text x="736" y="254" className="svg-callout-heading">
            Diverged here · step 5
          </text>
          <text x="736" y="275" className="svg-callout-body">
            region: us-east → eu-west
          </text>
          <text x="736" y="291" className="svg-muted small">
            3 downstream spans affected
          </text>
        </motion.g>
      </svg>
      <div className="diagram-save">
        <motion.div
          initial={reduced ? false : { opacity: 0 }}
          whileInView={{ opacity: 1, scale: reduced ? 1 : [1, 1.035, 1] }}
          viewport={{ once: true }}
          transition={{
            delay: reduced ? 0 : 2.4,
            duration: reduced ? 0 : 0.65,
          }}
        >
          <Link href="/" className="button primary">
            <Plus size={16} />
            Turn into regression test
            <ArrowRight size={15} />
          </Link>
        </motion.div>
        <motion.div
          className="diagram-dataset"
          initial={reduced ? false : { opacity: 0, y: -18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{
            delay: reduced ? 0 : 3.05,
            duration: reduced ? 0 : 0.45,
          }}
        >
          <Database size={17} />
          <span>
            Regression dataset<code>TC-DEMO · expected_tools saved</code>
          </span>
          <CheckCheck size={18} />
        </motion.div>
      </div>
    </div>
  );
}
