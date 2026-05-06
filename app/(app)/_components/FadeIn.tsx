"use client";

import { motion } from "motion/react";

interface Props {
  children: React.ReactNode;
  /** Index para stagger automático (delay = index * 30ms). */
  index?: number;
  /** Delay manual em ms (sobrescreve index). */
  delay?: number;
  className?: string;
  axis?: "x" | "y";
  /** Distância do offset inicial em px */
  offset?: number;
}

export function FadeIn({ children, index = 0, delay, className, axis = "y", offset = 6 }: Props) {
  const d = delay ?? index * 30;
  return (
    <motion.div
      initial={{ opacity: 0, [axis]: offset }}
      animate={{ opacity: 1, [axis]: 0 }}
      transition={{ duration: 0.25, delay: d / 1000, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
