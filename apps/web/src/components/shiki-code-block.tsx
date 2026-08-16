import type { CSSProperties } from "react";

import type {
  HighlightedCode,
  HighlightedCodeToken,
} from "@/lib/code-highlighting";

function getTokenStyle(token: HighlightedCodeToken): CSSProperties | undefined {
  if (!token.color && !token.fontStyle) return undefined;

  return {
    color: token.color,
    fontStyle: token.fontStyle && (token.fontStyle & 1) ? "italic" : undefined,
    fontWeight: token.fontStyle && (token.fontStyle & 2) ? 700 : undefined,
    textDecoration: token.fontStyle && (token.fontStyle & 4) ? "underline" : undefined,
  };
}

export function ShikiCodeBlock({
  code,
  highlightedCode,
}: {
  code: string;
  highlightedCode?: HighlightedCode | null;
}) {
  const lines = highlightedCode?.lines ?? code.split("\n").map((content) => [{ content }]);

  return (
    <code className="block min-w-0">
      {lines.map((tokens, lineIndex) => (
        <span
          key={`line-${lineIndex}`}
          className="grid min-w-0 grid-cols-[2rem_minmax(0,1fr)]"
        >
          <span className="select-none pr-3 text-right text-[#5c6370]">
            {lineIndex + 1}
          </span>
          <span className="min-w-0 whitespace-pre-wrap break-words">
            {tokens.map((token, tokenIndex) => (
              <span
                key={`token-${lineIndex}-${tokenIndex}`}
                style={getTokenStyle(token)}
              >
                {token.content || " "}
              </span>
            ))}
          </span>
        </span>
      ))}
    </code>
  );
}
