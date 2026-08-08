import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("@/hooks/use-session", () => ({
  useSession: () => ({ user: { id: "praticante" } }),
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

import { DashboardHomeHeader } from "./dashboard-home-header";

test("mantém o cabeçalho do Início sem repetir rank, ELO ou streak", () => {
  const markup = renderToStaticMarkup(
    <DashboardHomeHeader
      userName="Gabriel"
      userImage={null}
    />,
  );

  expect(markup).toContain("Bem-vindo ao Dojo, Gabriel!");
  expect(markup).toContain('aria-label="Abrir perfil"');
  expect(markup).not.toContain("Abrir tabela de níveis");
  expect(markup).not.toContain("ELO");
  expect(markup).not.toContain("streak");
});
