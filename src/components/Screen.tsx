import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}
