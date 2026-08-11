import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import trainingIcon from "@/assets/training_icon.png";
import reviewIcon from "@/assets/review_icon.png";
import simulationIcon from "@/assets/simulation_icon.png";
import { DashboardNavigation } from "./dashboard-navigation";

test("não promove rotas de roadmap como funcionalidades disponíveis", () => {
  const markup = renderToStaticMarkup(
    <DashboardNavigation
      challengeCount={50}
      icons={{
        initiation: trainingIcon,
        training: trainingIcon,
        review: reviewIcon,
        simulation: simulationIcon,
      }}
    />,
  );

  expect(markup).toContain("Em breve");
  expect(markup).not.toContain('href="/revisoes"');
  expect(markup).not.toContain('href="/simulados"');
});
