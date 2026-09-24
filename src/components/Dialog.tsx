import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

export function Dialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
  onCancel,
  busy = false,
}: {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#0d1b2e]/60 p-3 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
        >
          <motion.div
            className="sheet w-full max-w-md p-6 shadow-[0_24px_60px_-20px_rgb(13_27_46/0.5)]"
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 8, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <h3 id="dialog-title" className="display text-2xl text-ink">
              {title}
            </h3>
            {children && <div className="mt-2 text-[15px] leading-relaxed text-ink2">{children}</div>}
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button ref={cancelRef} className="btn btn-secondary" onClick={onCancel} disabled={busy}>
                {cancelLabel}
              </button>
              <button className={`btn ${tone === "danger" ? "btn-accent" : "btn-primary"}`} onClick={onConfirm} disabled={busy}>
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
