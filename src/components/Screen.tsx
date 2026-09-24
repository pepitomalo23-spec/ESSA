import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Transición suave entre pantallas (misma curva que la app original).
export function Screen({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`space-y-5 ${className}`}
    >
      {children}
    </motion.section>
  );
}
