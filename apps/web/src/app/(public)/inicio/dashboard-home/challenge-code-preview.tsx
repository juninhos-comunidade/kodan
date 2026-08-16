import { Code2 } from "lucide-react";

import { ShikiCodeBlock } from "@/components/shiki-code-block";
import type { HighlightedCode } from "@/lib/code-highlighting";

export function ChallengeCodePreview({
  code,
  highlightedCode,
}: {
  code: string;
  highlightedCode?: HighlightedCode | null;
}) {
  return (
    <div className="min-h-[32rem] overflow-hidden rounded-xl border border-[color:var(--dojo-border)] bg-transparent">
      <div className="flex h-12 items-center justify-between gap-3 border-b border-[color:var(--dojo-border)] px-4 text-xs text-[var(--dojo-muted)]">
        <div className="flex items-center gap-3">
          <Code2 className="size-4" aria-hidden="true" />
          <span className="truncate">Counter.tsx</span>
        </div>
        <span className="whitespace-nowrap rounded-full border border-[color:var(--dojo-border-strong)] px-2 py-1 text-xs uppercase tracking-wide">read-only</span>
      </div>
      <pre className="min-h-[26rem] max-h-[26rem] overflow-x-hidden overflow-y-auto bg-[#282c34] px-4 py-5 text-xs leading-6 text-[#abb2bf] sm:px-6">
        <ShikiCodeBlock code={code} highlightedCode={highlightedCode} />
      </pre>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--dojo-border)] px-4 py-3 text-xs text-[var(--dojo-muted)]">
        <span>Linguagem <strong className="ml-1 text-[var(--dojo-accent)]">React</strong></span>
        <span>Complexidade <strong className="ml-1 text-[var(--dojo-ink)]">O(n)</strong></span>
      </div>
    </div>
  );
}
