import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

let session: { user: { id: string } } | null = { user: { id: "praticante" } };

mock.module("@/hooks/use-session", () => ({
  useSession: () => session,
}));

mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));

import { DashboardHomeHeader } from "./dashboard-home-header";

test("mantém o cabeçalho do Início sem repetir rank, ELO ou streak", () => {
  session = { user: { id: "praticante" } };
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

test("apresenta um começo honesto para visitantes", () => {
  session = null;

  const markup = renderToStaticMarkup(
    <DashboardHomeHeader userName="Kodan" userImage={null} />,
  );

  expect(markup).toContain("Comece seu primeiro diagnóstico");
  expect(markup).not.toContain("Bem-vindo ao Dojo, Kodan!");
  expect(markup).not.toContain('aria-label="Abrir perfil"');
});
