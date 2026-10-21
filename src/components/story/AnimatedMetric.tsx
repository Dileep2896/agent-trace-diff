"use client";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import { useEffect, useRef } from "react";
export function AnimatedMetric({
  to,
  from = 0,
  suffix = "",
  duration = 1.5,
}: {
  to: number;
  from?: number;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduced = useReducedMotion();
  const value = useMotionValue(from);
  const display = useTransform(
    value,
    (n) => `${Math.round(n).toLocaleString("en-US")}${suffix}`,
  );
  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(value, to, { duration, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [inView, reduced, to, duration, value]);
  return (
    <span ref={ref} aria-label={`${to}${suffix}`}>
      <motion.span aria-hidden="true">
        {reduced ? `${to.toLocaleString("en-US")}${suffix}` : display}
      </motion.span>
    </span>
  );
}
