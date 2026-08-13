import type { ComponentProps, ElementType, ReactNode } from "react";

import { Input } from "@kodan/ui/components/input";
import { cn } from "@kodan/ui/lib/utils";

type AuthInputProps = ComponentProps<typeof Input> & {
  icon: ElementType;
  endAdornment?: ReactNode;
};

export function AuthInput({
  className,
  icon: Icon,
  endAdornment,
  ...props
}: AuthInputProps) {
  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-[#f5f0e6]/15 bg-[#f5f0e6]/5 px-3.5 transition-colors duration-200 focus-within:border-[#c4432b]">
      <Icon
        aria-hidden="true"
        className="size-4 shrink-0 text-[#f5f0e6]/40 transition-colors duration-200 group-focus-within:text-[#c4432b]"
      />
      <Input
        className={cn(
          "h-12 border-0 bg-transparent px-0 py-0 font-mono text-[0.8125rem] text-[#f5f0e6] shadow-none outline-none placeholder:text-[#f5f0e6]/40 focus-visible:border-0 focus-visible:ring-0",
          className,
        )}
        {...props}
      />
      {endAdornment}
    </div>
  );
}
