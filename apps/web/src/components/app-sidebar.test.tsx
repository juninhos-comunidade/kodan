import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

mock.module("@/hooks/use-session", () => ({
  useSession: () => null,
}));

const { AppSidebar } = await import("./app-sidebar");

test("usa a marca oficial do Kodan em vez do portão torii", () => {
  const markup = renderToStaticMarkup(
    <AppSidebar
      collapsed={false}
      mobileOpen={false}
      pathname="/inicio"
      user={null}
      onCloseMobile={() => undefined}
      onToggle={() => undefined}
    />,
  );

  expect(markup).toContain('data-kodan-logo="true"');
  expect(markup).not.toContain("⛩");
});
