"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

import type { DifficultyFilter } from "./challenges-list-state";
import { ChallengesNavigationTree } from "./challenges-navigation-tree";
import {
  buildChallengeTopicSections,
  type ChallengeTopicFilter,
} from "./challenges-taxonomy";
import type { Challenge } from "./ema-challenge-card-helpers";

export function ChallengesNavigationDrawer({
  open,
  languageLabel,
  challenges,
  topicFilter,
  filterDifficulty,
  onClose,
  onTopicChange,
  onDifficultyChange,
}: {
  open: boolean;
  languageLabel: string;
  challenges: Challenge[];
  topicFilter: ChallengeTopicFilter;
  filterDifficulty: DifficultyFilter;
  onClose: () => void;
  onTopicChange: (topic: ChallengeTopicFilter) => void;
  onDifficultyChange: (difficulty: DifficultyFilter) => void;
}) {
  const sections = buildChallengeTopicSections(challenges);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeAndRestoreFocus = () => {
    onClose();
    window.requestAnimationFrame(() => document.getElementById("challenge-filter-trigger")?.focus());
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const mobileViewport = window.matchMedia("(max-width: 1023px)");
    const syncDialog = () => {
      if (open && mobileViewport.matches && !dialog.open) {
        dialog.showModal();
        window.requestAnimationFrame(() => {
          dialog
            .querySelector<HTMLElement>('nav[aria-label="Árvore de desafios"] button')
            ?.focus();
        });
      }
      if ((!open || !mobileViewport.matches) && dialog.open) dialog.close();
    };

    syncDialog();
    mobileViewport.addEventListener("change", syncDialog);

    return () => {
      mobileViewport.removeEventListener("change", syncDialog);
      if (dialog.open) dialog.close();
    };
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      id="challenge-filters-panel"
      aria-labelledby="challenge-filters-title"
      className="challengers-filter-dialog fixed inset-0 m-0 h-svh max-h-none w-screen max-w-none bg-transparent p-0 text-[var(--challengers-ink)] lg:hidden"
      onCancel={(event) => {
        event.preventDefault();
        closeAndRestoreFocus();
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          closeAndRestoreFocus();
        }
      }}
    >
      <button type="button" tabIndex={-1} aria-label="Fechar filtros ao tocar fora" className="absolute inset-0" onClick={closeAndRestoreFocus} />
      <section className="challengers-panel absolute bottom-0 left-3 right-3 max-h-[82svh] overflow-auto rounded-t-[18px] border px-4 pb-5 pt-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <h2 id="challenge-filters-title" className="text-xs font-semibold uppercase tracking-widest text-[var(--challengers-muted)]">
            Filtros de desafios
          </h2>
          <button
            type="button"
            className="challengers-icon-button inline-flex size-11 items-center justify-center rounded-lg border"
            aria-label="Fechar filtros"
            onClick={closeAndRestoreFocus}
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </header>
        <ChallengesNavigationTree
          languageLabel={languageLabel}
          sections={sections}
          topicFilter={topicFilter}
          filterDifficulty={filterDifficulty}
          density="drawer"
          onTopicChange={(topic) => {
            onTopicChange(topic);
            closeAndRestoreFocus();
          }}
          onDifficultyChange={onDifficultyChange}
        />
      </section>
    </dialog>
  );
}
