import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { SessionProvider } from "@/providers/session-provider";

mock.module("@/components/product-event-beacon", () => ({
  ProductEventBeacon: ({ event }: { event: { name: string } }) => (
    <i data-product-event={event.name} />
  ),
}));
mock.module("next/navigation", () => ({
  useRouter: () => ({ push: () => undefined }),
}));
mock.module("./dashboard-home/use-dashboard-theme-assets", () => ({
  useDashboardThemeAssets: () => ({
    initiation: "/initiation.png",
    review: "/review.png",
    simulation: "/simulation.png",
    training: "/training.png",
  }),
}));

const { default: DashboardHome } = await import("./dashboard-home");

test("registra a visualização agregada da home no cliente", () => {
  const markup = renderToStaticMarkup(
    <SessionProvider session={null}>
      <DashboardHome
        challenge={{
          id: "challenge-1",
          title: "Desafio",
          difficulty: "EASY",
          tags: ["react"],
          code: "const value = 1;",
          question: "Explique.",
        }}
        challengeCount={50}
        recommendationReason="POPULAR_BEGINNER"
        userName="Kodan"
        userImage={null}
        authenticated={false}
      />
    </SessionProvider>,
  );

  expect(markup).toContain('data-product-event="home_viewed"');
});
