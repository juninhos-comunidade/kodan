import Image from "next/image";

import { cn } from "@kodan/ui/lib/utils";

const logoLight = "/brand/kodan_icone_claro.svg";
const logoDark = "/brand/kodan_icone_escuro.svg";

const MARK_SIZE = {
  sm: "size-8",
  md: "size-10",
  lg: "size-14",
} as const;

const IMAGE_SIZE = {
  sm: 32,
  md: 40,
  lg: 56,
} as const;

export function KodanLogo({
  size = "md",
  compact = false,
  markOnly = false,
  className,
  wordmarkClassName,
}: {
  size?: keyof typeof MARK_SIZE;
  compact?: boolean;
  markOnly?: boolean;
  className?: string;
  wordmarkClassName?: string;
}) {
  const pixels = IMAGE_SIZE[size];

  return (
    <span
      data-kodan-logo="true"
      className={cn(
        "inline-flex items-center",
        compact || markOnly ? "justify-center" : "gap-3",
        className,
      )}
    >
      <span
        className={cn(
          "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-lg",
          MARK_SIZE[size],
        )}
        aria-hidden="true"
      >
        <Image
          src={logoLight}
          alt=""
          width={pixels}
          height={pixels}
          className="size-full object-contain dark:hidden"
        />
        <Image
          src={logoDark}
          alt=""
          width={pixels}
          height={pixels}
          className="hidden size-full object-contain dark:block"
        />
      </span>
      {!markOnly ? (
        <span
          className={cn(
            "font-serif font-semibold tracking-widest",
            size === "sm" ? "text-sm" : "text-xl",
            compact && "sr-only",
            wordmarkClassName,
          )}
        >
          KODAN
        </span>
      ) : null}
    </span>
  );
}
