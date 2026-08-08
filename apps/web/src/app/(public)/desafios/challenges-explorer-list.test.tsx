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
