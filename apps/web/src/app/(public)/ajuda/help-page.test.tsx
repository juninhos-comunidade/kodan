import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import HelpPage from "./page";

test("não apresenta a central de conteúdo como canal de suporte", () => {
  const markup = renderToStaticMarkup(<HelpPage />);

  expect(markup).toContain("Central de ajuda");
  expect(markup).not.toContain(">Suporte<");
});
