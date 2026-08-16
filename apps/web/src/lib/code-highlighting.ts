import "server-only";

import { codeToTokens } from "shiki";

export type SupportedCodeLanguage =
  | "react"
  | "typescript"
  | "python"
  | "java"
  | "go";

export type HighlightedCodeToken = {
  content: string;
  color?: string;
  fontStyle?: number;
};

export type HighlightedCode = {
  lines: HighlightedCodeToken[][];
};

const shikiLanguageByChallengeLanguage = {
  react: "tsx",
  typescript: "typescript",
  python: "python",
  java: "java",
  go: "go",
} as const;

export function normalizeSupportedCodeLanguage(
  language: string | null | undefined,
): SupportedCodeLanguage {
  if (
    language === "react" ||
    language === "typescript" ||
    language === "python" ||
    language === "java" ||
    language === "go"
  ) {
    return language;
  }

  return "react";
}

export async function highlightCode(
  code: string,
  language: SupportedCodeLanguage = "react",
): Promise<HighlightedCode> {
  const result = await codeToTokens(code, {
    lang: shikiLanguageByChallengeLanguage[language],
    theme: "one-dark-pro",
  });

  return {
    lines: result.tokens.map((line) =>
      line.map((token) => ({
        content: token.content,
        color: token.color,
        fontStyle: token.fontStyle,
      })),
    ),
  };
}
