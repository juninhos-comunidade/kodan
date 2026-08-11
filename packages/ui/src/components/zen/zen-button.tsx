"use client";

import { HankoMarkSvg } from "@kodan/ui/assets/zen/sumi-strokes";
import { cn } from "@kodan/ui/lib/utils";
import type { HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { ZenMotionProvider } from "./motion/runtime";
import { m } from "./motion/primitives";

type ZenButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  children: ReactNode;
  variant?: "ink" | "washi" | "moss" | "hanko";
};

export function ZenButton({
  className,
  children,
  variant = "ink",
  type = "button",
  ...props
}: ZenButtonProps) {
  const hoverMotion = {
    ink: { x: 1, y: -1 },
    washi: { y: -2, rotate: -0.35 },
    moss: { x: 1, y: -1 },
    hanko: { scale: 1.035, rotate: -1.25 },
  }[variant];

  return (
    <ZenMotionProvider>
      <m.button
        type={type}
        whileHover={hoverMotion}
        whileTap={variant === "hanko" ? { scale: 0.94, rotate: -2 } : { scale: 0.985 }}
        transition={{ duration: variant === "hanko" ? 0.12 : 0.2, ease: "easeOut" }}
        className={cn(
          "zen-focus group/zen-button relative inline-flex min-h-9 shrink-0 items-center justify-center gap-2 overflow-hidden whitespace-nowrap border text-xs font-semibold tracking-normal transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 dark:shadow-none dark:hover:shadow-none dark:data-[hover-preview=true]:shadow-none dark:before:hidden dark:after:hidden",
          variant === "ink" &&
            "rounded-[1px] border-[color:var(--zen-button-ink)] bg-[color:var(--zen-button-ink)] px-4 py-2 text-[color:var(--zen-button-ink-text)] shadow-[inset_0_-4px_0_color-mix(in_oklch,var(--zen-washi)_10%,transparent)] before:absolute before:inset-y-0 before:left-0 before:w-4 before:bg-[linear-gradient(90deg,color-mix(in_oklch,var(--zen-washi)_18%,transparent),transparent)] after:absolute after:inset-x-2 after:bottom-1 after:h-px after:origin-left after:scale-x-75 after:bg-[color:color-mix(in_oklch,var(--zen-washi)_32%,transparent)] hover:border-[color:var(--zen-button-moss)] hover:bg-[color:var(--zen-button-moss)] hover:shadow-[inset_0_-4px_0_color-mix(in_oklch,var(--zen-ink)_24%,transparent),0_9px_22px_color-mix(in_oklch,var(--zen-button-moss)_35%,transparent)] hover:after:scale-x-100 data-[hover-preview=true]:border-[color:var(--zen-button-moss)] data-[hover-preview=true]:bg-[color:var(--zen-button-moss)] data-[hover-preview=true]:shadow-[inset_0_-4px_0_color-mix(in_oklch,var(--zen-ink)_24%,transparent),0_9px_22px_color-mix(in_oklch,var(--zen-button-moss)_35%,transparent)] data-[hover-preview=true]:after:scale-x-100",
          variant === "washi" &&
            "zen-washi !bg-[color:var(--zen-button-washi)] border-[color:var(--zen-border)] px-3.5 py-2 text-[color:var(--zen-button-washi-text)] shadow-[inset_3px_0_0_color-mix(in_oklch,var(--zen-ink)_8%,transparent),inset_0_-2px_0_color-mix(in_oklch,var(--zen-ink)_10%,transparent)] before:absolute before:right-0 before:top-0 before:size-3 before:border-b before:border-l before:border-[color:var(--zen-border)] before:bg-[color:color-mix(in_oklch,var(--zen-ink)_4%,transparent)] hover:border-[color:var(--zen-button-hanko)] hover:text-[color:var(--zen-button-hanko)] hover:shadow-[inset_3px_0_0_color-mix(in_oklch,var(--zen-button-hanko)_45%,transparent),inset_0_-3px_0_color-mix(in_oklch,var(--zen-button-hanko)_34%,transparent),0_8px_20px_color-mix(in_oklch,var(--zen-ink)_12%,transparent)] data-[hover-preview=true]:border-[color:var(--zen-button-hanko)] data-[hover-preview=true]:text-[color:var(--zen-button-hanko)] data-[hover-preview=true]:shadow-[inset_3px_0_0_color-mix(in_oklch,var(--zen-button-hanko)_45%,transparent),inset_0_-3px_0_color-mix(in_oklch,var(--zen-button-hanko)_34%,transparent),0_8px_20px_color-mix(in_oklch,var(--zen-ink)_12%,transparent)]",
          variant === "moss" &&
            "rounded-[1px] border-[color:var(--zen-button-moss)] bg-[color:var(--zen-button-moss)] px-4 py-2 text-[color:var(--zen-button-moss-text)] shadow-[inset_0_-4px_0_color-mix(in_oklch,var(--zen-ink)_22%,transparent)] hover:bg-[color:color-mix(in_oklch,var(--zen-button-moss)_78%,var(--zen-ink))] hover:shadow-[inset_0_-4px_0_color-mix(in_oklch,var(--zen-ink)_35%,transparent),0_9px_22px_color-mix(in_oklch,var(--zen-button-moss)_35%,transparent)] data-[hover-preview=true]:bg-[color:color-mix(in_oklch,var(--zen-button-moss)_78%,var(--zen-ink))] data-[hover-preview=true]:shadow-[inset_0_-4px_0_color-mix(in_oklch,var(--zen-ink)_35%,transparent),0_9px_22px_color-mix(in_oklch,var(--zen-button-moss)_35%,transparent)]",
          variant === "hanko" &&
            "min-h-10 border-[color:var(--zen-button-hanko)] bg-[color:var(--zen-button-hanko)] px-3 py-2 text-[color:var(--zen-button-hanko-text)] shadow-[inset_0_0_0_2px_color-mix(in_oklch,white_16%,transparent),inset_0_-3px_0_color-mix(in_oklch,black_20%,transparent)] before:absolute before:inset-1 before:border before:border-[color:color-mix(in_oklch,white_22%,transparent)] hover:bg-[color:color-mix(in_oklch,var(--zen-button-hanko)_82%,black)] hover:shadow-[inset_0_0_0_2px_color-mix(in_oklch,white_28%,transparent),0_8px_22px_color-mix(in_oklch,var(--zen-button-hanko)_35%,transparent)] data-[hover-preview=true]:bg-[color:color-mix(in_oklch,var(--zen-button-hanko)_82%,black)] data-[hover-preview=true]:shadow-[inset_0_0_0_2px_color-mix(in_oklch,white_28%,transparent),0_8px_22px_color-mix(in_oklch,var(--zen-button-hanko)_35%,transparent)]",
          variant === "ink" &&
            "hover:border-[color:var(--zen-button-ink-hover)] hover:bg-[color:var(--zen-button-ink-hover)] hover:text-[color:var(--zen-button-ink-hover-text)] hover:shadow-[0_9px_22px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)] data-[hover-preview=true]:border-[color:var(--zen-button-ink-hover)] data-[hover-preview=true]:bg-[color:var(--zen-button-ink-hover)] data-[hover-preview=true]:text-[color:var(--zen-button-ink-hover-text)] data-[hover-preview=true]:shadow-[0_9px_22px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)]",
          variant === "washi" &&
            "hover:!bg-[color:var(--zen-button-washi-hover)] hover:border-[color:var(--zen-button-washi-hover-text)] hover:text-[color:var(--zen-button-washi-hover-text)] hover:shadow-[0_8px_20px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)] data-[hover-preview=true]:!bg-[color:var(--zen-button-washi-hover)] data-[hover-preview=true]:border-[color:var(--zen-button-washi-hover-text)] data-[hover-preview=true]:text-[color:var(--zen-button-washi-hover-text)] data-[hover-preview=true]:shadow-[0_8px_20px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)]",
          variant === "moss" &&
            "hover:border-[color:var(--zen-button-moss-hover)] hover:bg-[color:var(--zen-button-moss-hover)] hover:text-[color:var(--zen-button-moss-hover-text)] hover:shadow-[0_9px_22px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)] data-[hover-preview=true]:border-[color:var(--zen-button-moss-hover)] data-[hover-preview=true]:bg-[color:var(--zen-button-moss-hover)] data-[hover-preview=true]:text-[color:var(--zen-button-moss-hover-text)] data-[hover-preview=true]:shadow-[0_9px_22px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)]",
          variant === "hanko" &&
            "hover:border-[color:var(--zen-button-hanko-hover)] hover:bg-[color:var(--zen-button-hanko-hover)] hover:text-[color:var(--zen-button-hanko-hover-text)] hover:shadow-[0_8px_22px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)] data-[hover-preview=true]:border-[color:var(--zen-button-hanko-hover)] data-[hover-preview=true]:bg-[color:var(--zen-button-hanko-hover)] data-[hover-preview=true]:text-[color:var(--zen-button-hanko-hover-text)] data-[hover-preview=true]:shadow-[0_8px_22px_color-mix(in_oklch,var(--zen-button-hover-shadow-color)_var(--zen-button-hover-shadow-opacity),transparent)]",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "pointer-events-none absolute inset-x-1 top-1 h-px origin-left scale-x-75 bg-current opacity-20 transition-[opacity,transform] duration-200 group-hover/zen-button:scale-x-100 group-hover/zen-button:opacity-45 group-[[data-hover-preview=true]]/zen-button:scale-x-100 group-[[data-hover-preview=true]]/zen-button:opacity-45",
            variant === "ink" && "hidden",
            variant === "moss" && "hidden",
            variant === "washi" && "text-[color:var(--zen-hanko)]",
            variant === "hanko" && "hidden",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "pointer-events-none absolute inset-y-1 left-1 w-0.5 origin-bottom scale-y-0 bg-current opacity-60 transition-transform duration-200 group-hover/zen-button:scale-y-100 group-[[data-hover-preview=true]]/zen-button:scale-y-100",
            variant === "ink" && "left-auto right-1",
            variant === "washi" && "text-[color:var(--zen-hanko)]",
            variant === "moss" && "hidden",
            variant === "hanko" && "hidden",
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            "pointer-events-none absolute bottom-1 right-1 size-2 rotate-45 border border-current opacity-0 transition-opacity duration-200 group-hover/zen-button:opacity-55 group-[[data-hover-preview=true]]/zen-button:opacity-55",
            variant === "washi" && "text-[color:var(--zen-hanko)]",
            variant === "moss" && "hidden",
            variant === "hanko" && "hidden",
          )}
          aria-hidden="true"
        />
        {variant === "hanko" || variant === "moss" ? <HankoMarkSvg className="relative z-10 size-4" /> : null}
        <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      </m.button>
    </ZenMotionProvider>
  );
}
