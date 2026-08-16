"use client";

import { EnsoCircle } from "@kodan/ui/assets/zen/vector/EnsoCircle";
import { HankoMarkSvg, SumiDividerSvg } from "@kodan/ui/assets/zen/sumi-strokes";
import { cn } from "@kodan/ui/lib/utils";
import * as AlertDialogPrimitive from "@radix-ui/react-alert-dialog";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";
import { paperSlide, sealImpact, zenEase } from "../motion/presets";
import { ZenMotionProvider } from "../motion/runtime";
import { AnimatePresence, m } from "../motion/primitives";
import { ZenButton } from "../zen-button";

type ZenTone = "success" | "warning" | "error" | "info";

const toneClass: Record<ZenTone, string> = {
  success: "[--zen-state:var(--zen-moss)]",
  warning: "[--zen-state:oklch(58%_0.12_76)]",
  error: "[--zen-state:var(--zen-hanko)]",
  info: "[--zen-state:var(--zen-sumi)]",
};

type ZenToastProps = {
  open?: boolean;
  tone?: ZenTone;
  title: ReactNode;
  children?: ReactNode;
  className?: string;
};

export function ZenToast({ open = true, tone = "info", title, children, className }: ZenToastProps) {
  return (
    <ZenMotionProvider>
      <AnimatePresence>
        {open ? (
          <m.output
            aria-live="polite"
            initial={{ opacity: 0, y: 10, rotate: -1 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            exit={{ opacity: 0, y: -6, rotate: 1 }}
            transition={{ duration: 0.24, ease: zenEase }}
            className={cn(
              "zen-paper zen-ink-edge flex max-w-sm items-start gap-3 border border-[color:var(--zen-border)] p-3 text-[color:var(--zen-ink)]",
              toneClass[tone],
              className,
            )}
          >
            <span className="mt-0.5 grid size-7 place-items-center border border-[color:var(--zen-state)] text-[color:var(--zen-state)]">
              <HankoMarkSvg className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{title}</span>
              {children ? <span className="block text-xs/relaxed text-[color:var(--zen-muted)]">{children}</span> : null}
            </span>
          </m.output>
        ) : null}
      </AnimatePresence>
    </ZenMotionProvider>
  );
}

export function ZenLoading({ label = "Carregando", className }: { label?: string; className?: string }) {
  return (
    <output
      aria-live="polite"
      className={cn("inline-flex items-center gap-3 text-[color:var(--zen-ink)]", className)}
    >
      <EnsoCircle className="size-10 text-[color:var(--zen-ink)]" duration={1.05} />
      <span className="text-xs text-[color:var(--zen-muted)]">{label}</span>
    </output>
  );
}

export function ZenSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("relative h-3 overflow-hidden bg-[color:color-mix(in_oklch,var(--zen-ink)_8%,transparent)]", className)}
    >
      <ZenMotionProvider>
        <m.span
          className="absolute inset-y-0 left-[-35%] w-1/2 bg-[color:color-mix(in_oklch,var(--zen-ink)_24%,transparent)]"
          animate={{ x: ["0%", "270%"] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      </ZenMotionProvider>
    </div>
  );
}

export function ZenEmptyState({
  title = "Pergaminho vazio",
  children,
  className,
}: {
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("zen-paper border border-[color:var(--zen-border)] p-5 text-center text-[color:var(--zen-ink)]", className)}>
      <SumiDividerSvg className="mx-auto mb-4 h-5 w-40 text-[color:var(--zen-muted)]" />
      <h3 className="text-sm font-semibold">{title}</h3>
      {children ? <p className="mx-auto mt-2 max-w-sm text-xs/relaxed text-[color:var(--zen-muted)]">{children}</p> : null}
    </div>
  );
}

export function ZenSuccessState({ title = "Concluído", className }: { title?: ReactNode; className?: string }) {
  return (
    <ZenMotionProvider>
      <m.output
        initial="hidden"
        animate="visible"
        variants={sealImpact}
        className={cn("inline-flex items-center gap-2 text-[color:var(--zen-hanko)]", className)}
        aria-live="polite"
      >
        <span className="grid size-10 rotate-[-5deg] place-items-center border border-current">
          <HankoMarkSvg className="size-7" />
        </span>
        <span className="text-sm font-semibold text-[color:var(--zen-ink)]">{title}</span>
      </m.output>
    </ZenMotionProvider>
  );
}

export function ZenErrorState({ title = "Falha no traço", className }: { title?: ReactNode; className?: string }) {
  return (
    <ZenMotionProvider>
      <div className={cn("relative border border-[color:var(--zen-hanko)] p-4 text-[color:var(--zen-ink)]", className)} role="alert">
        <svg viewBox="0 0 220 42" className="mb-3 h-8 w-full text-[color:var(--zen-hanko)]" fill="none" aria-hidden="true">
          <m.path
            d="M4 20C32 12 52 31 78 18C101 7 119 32 146 19C169 8 188 18 216 14"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            initial={{ strokeDashoffset: 1, opacity: 0 }}
            animate={{ strokeDashoffset: 0, opacity: 0.9 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          />
        </svg>
        <span className="text-sm font-semibold">{title}</span>
      </div>
    </ZenMotionProvider>
  );
}

export function ZenTooltip({
  content,
  children,
  className,
}: {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={180}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            sideOffset={8}
            className={cn(
              "zen-paper z-50 max-w-56 border border-[color:var(--zen-border)] px-3 py-2 text-xs/relaxed text-[color:var(--zen-ink)] shadow-[0_10px_24px_color-mix(in_oklch,var(--zen-ink)_14%,transparent)]",
              className,
            )}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-[color:var(--zen-washi)]" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}

export function ZenConfirmationModal({
  open,
  title,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AlertDialogPrimitive.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[2px]" />
        <ZenMotionProvider>
          <AlertDialogPrimitive.Content asChild>
            <m.div
              className="zen-paper zen-ink-edge fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 border border-[color:var(--zen-border)] p-5 text-[color:var(--zen-ink)]"
              variants={paperSlide}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <AlertDialogPrimitive.Title asChild>
                <div>
                  <ZenSuccessState title={title} />
                </div>
              </AlertDialogPrimitive.Title>
              {children ? (
                <AlertDialogPrimitive.Description className="mt-4 text-xs/relaxed text-[color:var(--zen-muted)]">
                  {children}
                </AlertDialogPrimitive.Description>
              ) : null}
              <div className="mt-5 flex justify-end gap-2">
                <AlertDialogPrimitive.Cancel asChild>
                  <ZenButton variant="washi">{cancelLabel}</ZenButton>
                </AlertDialogPrimitive.Cancel>
                <AlertDialogPrimitive.Action asChild>
                  <ZenButton variant="hanko" onClick={onConfirm}>{confirmLabel}</ZenButton>
                </AlertDialogPrimitive.Action>
              </div>
            </m.div>
          </AlertDialogPrimitive.Content>
        </ZenMotionProvider>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  );
}

export { ZenFeedbackModal } from "./ZenFeedbackModal";
export type { ZenFeedbackData, ZenFeedbackModalProps, ZenFeedbackPoint, ZenFeedbackPointStatus } from "./ZenFeedbackModal";
export type { ZenTone };
