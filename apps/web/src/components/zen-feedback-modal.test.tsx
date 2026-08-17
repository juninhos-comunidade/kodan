import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const source = readFileSync(
  new URL(
    "../../../../packages/ui/src/components/zen/feedback/ZenFeedbackModal.tsx",
    import.meta.url,
  ),
  "utf8",
);

test("usa o fundo do tema no overlay sem criar uma camada branca", () => {
  expect(source).toContain(
    "color-mix(in_oklch,var(--zen-washi)_66%,transparent)",
  );
  expect(source).toContain("backdrop-blur-[2px]");
  expect(source).not.toContain("var(--zen-ink)_66%");
});
