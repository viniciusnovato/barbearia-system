"use client";

import { motion } from "motion/react";

interface Props {
  children: React.ReactNode[];
  className?: string;
  /** Delay entre items em ms */
  stagger?: number;
  /** Duração total */
  duration?: number;
  /** "x" ou "y" — direção do offset inicial */
  axis?: "x" | "y";
}

export function StaggerList({ children, className, stagger = 30, duration = 0.3, axis = "y" }: Props) {
  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger / 1000 } },
      }}
      className={className}
    >
      {children.map((child, i) => (
        <motion.li
          key={i}
          variants={{
            hidden: { opacity: 0, [axis]: 8 },
            visible: { opacity: 1, [axis]: 0 },
          }}
          transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
        >
          {child}
        </motion.li>
      ))}
    </motion.ul>
  );
}
