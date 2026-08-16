import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

import { ChallengesExplorerPanel } from "./challenges-explorer-list";

test("mantém a paginação acessível em telas pequenas", () => {
  const markup = renderToStaticMarkup(
    <ChallengesExplorerPanel
      languageLabel="React"
      topicLabel="Todos"
      topicDescription="Catálogo"
      topicFilter="ALL"
      challenges={[]}
      activeChallengeId={null}
      visibleCount={50}
      page={1}
      pageSize={15}
      filterDifficulty="ALL"
      statusFilter="ALL"
      typeFilter="ALL"
      onlyUnsolved={false}
      sortBy="RECENT"
      hasActiveFilters={false}
      loadingMore={false}
      onFocusChallenge={() => undefined}
      onOpenChallenge={() => undefined}
      onFilterChange={() => undefined}
      onStatusChange={() => undefined}
      onTypeChange={() => undefined}
      onOnlyUnsolvedChange={() => undefined}
      onSortChange={() => undefined}
      onClearFilters={() => undefined}
      onPageChange={() => undefined}
    />,
  );

  expect(markup).toContain('aria-label="Próxima página"');
  expect(markup).not.toContain("mt-7 hidden");
});

test("mantém desafios sem rubrica visíveis e sem link para a arena", () => {
  const markup = renderToStaticMarkup(
    <ChallengesExplorerPanel
      languageLabel="React"
      topicLabel="Todos"
      topicDescription="Catálogo"
      topicFilter="ALL"
      challenges={[{
        id: "react-em-revisao",
        title: "Desafio em revisão",
        language: "react",
        topic: "state-rendering",
        presentation: "code",
        intent: "diagnose",
        difficulty: "EASY",
        recommendedElo: 1100,
        tags: "react,state",
        evaluationAvailable: false,
        availability: "EDITORIAL_REVIEW",
        attempts: [],
      }]}
      activeChallengeId={null}
      visibleCount={1}
      page={1}
      pageSize={15}
      filterDifficulty="ALL"
      statusFilter="ALL"
      typeFilter="ALL"
      onlyUnsolved={false}
      sortBy="RECENT"
      hasActiveFilters={false}
      loadingMore={false}
      onFocusChallenge={() => undefined}
      onOpenChallenge={() => undefined}
      onFilterChange={() => undefined}
      onStatusChange={() => undefined}
      onTypeChange={() => undefined}
      onOnlyUnsolvedChange={() => undefined}
      onSortChange={() => undefined}
      onClearFilters={() => undefined}
      onPageChange={() => undefined}
    />,
  );

  expect(markup).toContain("Em revisão");
  expect(markup).toContain("Abrir informações sobre a revisão");
  expect(markup).not.toContain("/treinar/react-em-revisao");
});
