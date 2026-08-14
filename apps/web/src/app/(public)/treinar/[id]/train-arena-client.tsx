"use client";

import {
  useReducer,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  FileCode,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  LockKeyhole,
  PanelRightOpen,
  SendHorizontal,
  X,
} from "lucide-react";

import { Button } from "@kodan/ui/components/button";
import { ZenToast } from "@kodan/ui/components/zen";
import { cn } from "@kodan/ui/lib/utils";
import { ProductEventBeacon } from "@/components/product-event-beacon";
import { ChallengeEditorialReview } from "@/components/challenge-editorial-review";
import { getLoginHref } from "@/lib/auth-navigation";
import {
  ACTIVATION_DAY_STORAGE_KEY,
  sendProductEvent,
  toUtcDateKey,
} from "@/lib/product-event-client";
import {
  MAX_TRAINING_ANSWER_LENGTH,
  validateTrainingAnswer,
} from "@/lib/training-input-guard";
import {
  recordFeedbackViewed,
  revealSolution,
  submitAttempt,
} from "../../../actions";
import {
  attemptSessionReducer,
  initialAttemptSessionState,
  type ArenaFeedback,
  type ArenaAttemptResult,
  type AttemptSessionState,
} from "./attempt-session-state";
import type { SessionAgeBucket } from "@/server/training/training-adapter";
import { FirstFeedbackCelebration } from "./first-feedback-celebration";

interface AttemptSummary {
  id: string;
  score: number;
  eloChange: number;
  createdAt: Date | string;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  recommendedElo: number;
  code: string | null;
  codeFileName?: string | null;
  scenario?: string | null;
  topic?: string;
  presentation?: "code" | "code-terminal" | "terminal" | "concept";
  intent?: "diagnose" | "compare" | "validate";
  terminal?: {
    command: string;
    blocks: Array<{
      label: string;
      content: string;
      tone: "neutral" | "success" | "warning" | "error";
    }>;
  } | null;
  question: string;
  evaluationAvailable: boolean;
  tags: string;
  attempts?: AttemptSummary[];
}

const DRAFT_STORAGE_PREFIX = "kodan:train-diagnosis:";
const TRAINING_SESSION_STARTED_AT_KEY = "kodan:training-session-started-at";
const FIRST_FEEDBACK_VIEWED_STORAGE_KEY = "kodan:first-feedback-viewed";

function getSessionAgeBucket(startedAt: number, now: number): SessionAgeBucket {
  const ageMinutes = Math.max(0, now - startedAt) / 60_000;
  if (ageMinutes < 10) return "UNDER_10_MIN";
  if (ageMinutes <= 30) return "MIN_10_TO_30";
  return "OVER_30_MIN";
}

type ZenToastTone = "success" | "error" | "warning" | "info";
type ZenToastState = {
  open: boolean;
  tone: ZenToastTone;
  title: string;
  message: string;
};

function zenToastReducer(
  state: ZenToastState,
  action:
    | { type: "show"; tone: ZenToastTone; title: string; message: string }
    | { type: "hide" },
): ZenToastState {
  if (action.type === "hide") {
    return { ...state, open: false };
  }

  return {
    open: true,
    tone: action.tone,
    title: action.title,
    message: action.message,
  };
}

function highlightCode(code: string) {
  const lines = code.split("\n");
  const lineOccurrence = new Map<string, number>();

  return lines.map((line) => {
    const seen = lineOccurrence.get(line) ?? 0;
    lineOccurrence.set(line, seen + 1);
    const lineKey = `${line}::${seen}`;

    if (line.trim().startsWith("//")) {
      return (
        <span
          key={lineKey}
          className="whitespace-pre italic text-[var(--challengers-faint)]"
        >
          {line}
        </span>
      );
    }

    const tokenRegex =
      /(\/\/.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:const|let|var|function|export|default|import|from|return|if|else|try|catch|finally|type|interface|as|switch|case|break|async|await|new)\b)|(\b(?:useState|useEffect|useMemo|useCallback|useRef|useReducer)\b)|(\b(?:true|false|null|undefined)\b)|(\b\d+\b)|(<[^>]+>)|([a-zA-Z_$][a-zA-Z0-9_$]*)|([^\s\w]+)/g;

    let match;
    const elements: ReactNode[] = [];
    let lastIndex = 0;

    tokenRegex.lastIndex = 0;

    while ((match = tokenRegex.exec(line)) !== null) {
      const matchIndex = match.index;

      if (matchIndex > lastIndex) {
        elements.push(line.substring(lastIndex, matchIndex));
      }

      const [
        full,
        comment,
        string,
        keyword,
        hook,
        booleanNull,
        number,
        jsx,
        _identifier,
        punctuation,
      ] = match;

      const key = `${lineKey}-${matchIndex}`;

      if (comment) {
        elements.push(
          <span key={key} className="italic text-[var(--challengers-faint)]">
            {comment}
          </span>,
        );
      } else if (string) {
        elements.push(
          <span
            key={key}
            className="font-medium text-[oklch(46%_0.13_154)] dark:text-[oklch(78%_0.11_154)]"
          >
            {string}
          </span>,
        );
      } else if (keyword) {
        elements.push(
          <span key={key} className="font-semibold text-[var(--challengers-blue)]">
            {keyword}
          </span>,
        );
      } else if (hook) {
        elements.push(
          <span
            key={key}
            className="font-semibold text-[oklch(45%_0.11_286)] dark:text-[oklch(76%_0.1_286)]"
          >
            {hook}
          </span>,
        );
      } else if (booleanNull || number) {
        elements.push(
          <span key={key} className="text-[var(--challengers-warning)]">
            {full}
          </span>,
        );
      } else if (jsx) {
        elements.push(
          <span key={key} className="text-[var(--challengers-blue-strong)]">
            {jsx}
          </span>,
        );
      } else if (punctuation) {
        elements.push(
          <span key={key} className="text-[var(--challengers-muted)]">
            {punctuation}
          </span>,
        );
      } else {
        elements.push(full);
      }

      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      elements.push(line.substring(lastIndex));
    }

    return (
      <div key={lineKey} className="min-h-[1.45rem] whitespace-pre">
        {elements.length > 0 ? elements : " "}
      </div>
    );
  });
}

function parseQuestion(questionText: string) {
  const splitKeywords = [
    "Na sua resposta, cubra:",
    "Na sua resposta cubra:",
    "Na resposta, cubra:",
    "Na resposta cubra:",
    "Para responder, cubra:",
    "Pontos a cobrir:",
  ];

  let splitIndex = -1;

  for (const keyword of splitKeywords) {
    const index = questionText.indexOf(keyword);
    if (index !== -1) {
      splitIndex = index;
      break;
    }
  }

  if (splitIndex !== -1) {
    const mainPrompt = questionText.substring(0, splitIndex).trim();
    const hintText = questionText.substring(splitIndex).trim();

    return {
      mainPrompt:
        mainPrompt ||
        "Este componente apresenta comportamento incorreto em produção. Diagnose o bug e explique a correção.",
      hintText,
    };
  }

  const listIndex = questionText.search(/\b1\)/);
  if (listIndex !== -1) {
    const mainPrompt = questionText.substring(0, listIndex).trim();
    const hintText =
      "Na sua resposta, cubra:\n" + questionText.substring(listIndex).trim();

    return {
      mainPrompt:
        mainPrompt ||
        "Este componente apresenta comportamento incorreto em produção. Diagnose o bug e explique a correção.",
      hintText,
    };
  }

  return {
    mainPrompt:
      "Este componente apresenta comportamento incorreto em produção. Diagnose o bug e explique a correção.",
    hintText: questionText,
  };
}

function getDifficultyLabel(difficulty: string) {
  switch (difficulty) {
    case "EASY":
      return "EASY";
    case "MEDIUM":
      return "MEDIUM";
    case "HARD":
      return "HARD";
    default:
      return difficulty;
  }
}

function getDifficultyClassName(difficulty: string) {
  switch (difficulty) {
    case "EASY":
      return "challengers-difficulty-easy";
    case "MEDIUM":
      return "challengers-difficulty-medium";
    case "HARD":
      return "challengers-difficulty-hard";
    default:
      return "challengers-badge";
  }
}

function getChallengeNumber(challenge: Challenge) {
  const matches = `${challenge.id} ${challenge.title}`.match(/\d+/g);
  if (matches && matches.length > 0) {
    return matches[matches.length - 1].padStart(3, "0").slice(-3);
  }

  const hash =
    Array.from(challenge.id).reduce(
      (total, char) => (total + char.charCodeAt(0)) % 997,
      0,
    ) + 1;

  return String(hash).padStart(3, "0");
}

interface TrainArenaClientProps {
  id: string;
  initialChallenge: Challenge | null;
  isAuthenticated: boolean;
  initialSession?: AttemptSessionState;
  initialUserAnswer?: string;
  nextChallenge?: { id: string; title: string } | null;
}

// react-doctor-disable-next-line react-doctor/prefer-useReducer
// react-doctor-disable-next-line react-doctor/no-giant-component
export default function TrainArenaClient({
  id,
  initialChallenge,
  isAuthenticated,
  initialSession = initialAttemptSessionState,
  initialUserAnswer = "",
  nextChallenge = null,
}: TrainArenaClientProps) {
  const [userAnswer, setUserAnswer] = useState(initialUserAnswer);
  const [notes, setNotes] = useState("");
  const [supportTab, setSupportTab] = useState<"statement" | "notes">(
    "statement",
  );
  const [attemptSession, dispatchAttemptSession] = useReducer(
    attemptSessionReducer,
    initialSession,
  );
  const [showAuthenticationDialog, setShowAuthenticationDialog] = useState(false);
  const [zenToast, dispatchZenToast] = useReducer(zenToastReducer, {
    open: false,
    tone: "info",
    title: "Aviso",
    message: "",
  });

  const usedHintRef = useRef(false);
  const recordedFeedbackRef = useRef<string | null>(null);
  const trainingSessionStartedAtRef = useRef(0);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const [hintRevealed, setHintRevealed] = useState(false);
  const [firstFeedbackCelebrated, setFirstFeedbackCelebrated] = useState(false);

  const draftStorageKey = `${DRAFT_STORAGE_PREFIX}${id}`;

  useEffect(() => {
    if (initialUserAnswer) return;

    try {
      const savedDraft = window.sessionStorage.getItem(draftStorageKey);
      if (savedDraft) setUserAnswer(savedDraft);
    } catch {
      // O diagnóstico continua disponível na sessão atual se o storage não estiver acessível.
    }
  }, [draftStorageKey, initialUserAnswer]);

  useEffect(() => {
    const now = Date.now();
    trainingSessionStartedAtRef.current = now;

    try {
      const stored = Number(
        window.sessionStorage.getItem(TRAINING_SESSION_STARTED_AT_KEY),
      );
      const startedAt = Number.isFinite(stored) && stored > 0 && stored <= now
        ? stored
        : now;
      trainingSessionStartedAtRef.current = startedAt;
      window.sessionStorage.setItem(
        TRAINING_SESSION_STARTED_AT_KEY,
        String(startedAt),
      );
    } catch {
      // O bucket continua sendo calculado a partir desta montagem sem storage.
    }
  }, []);

  useEffect(() => {
    const attemptNumber = attemptSession.result?.attemptNumber;
    if (
      !isAuthenticated ||
      attemptSession.phase !== "feedback" ||
      attemptNumber === undefined
    ) {
      return;
    }

    const eventKey = `${id}:${attemptNumber}`;
    if (recordedFeedbackRef.current === eventKey) return;
    try {
      if (window.localStorage.getItem(FIRST_FEEDBACK_VIEWED_STORAGE_KEY) === "true") {
        recordedFeedbackRef.current = eventKey;
        return;
      }
    } catch {
      // A deduplicação persistente é opcional; o banco guarda somente agregados.
    }
    const sessionAgeBucket = getSessionAgeBucket(
      trainingSessionStartedAtRef.current,
      Date.now(),
    );

    let cancelled = false;
    let retryTimer: number | undefined;
    const persistFeedbackView = async (attempt = 1) => {
      try {
        const response = await recordFeedbackViewed(
          id,
          attemptNumber,
          sessionAgeBucket,
        );
        if (!cancelled && response.success) {
          recordedFeedbackRef.current = eventKey;
          if (response.recorded) setFirstFeedbackCelebrated(true);
          try {
            window.localStorage.setItem(FIRST_FEEDBACK_VIEWED_STORAGE_KEY, "true");
            if (!window.localStorage.getItem(ACTIVATION_DAY_STORAGE_KEY)) {
              window.localStorage.setItem(
                ACTIVATION_DAY_STORAGE_KEY,
                toUtcDateKey(new Date()),
              );
            }
          } catch {
            // O ref ainda evita duplicação durante a montagem atual.
          }
          return;
        }
      } catch {
        // Telemetria de produto é best effort e não deve interromper o feedback.
      }

      if (!cancelled && attempt < 3) {
        retryTimer = window.setTimeout(
          () => void persistFeedbackView(attempt + 1),
          attempt * 2_000,
        );
      }
    };
    void persistFeedbackView();

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [attemptSession.phase, attemptSession.result?.attemptNumber, id, isAuthenticated]);

  const saveDraftBeforeAuthentication = () => {
    try {
      window.sessionStorage.setItem(draftStorageKey, userAnswer);
    } catch {
      // Não interrompe o redirecionamento para autenticação se o storage estiver indisponível.
    }
  };

  const showZenToast = (tone: ZenToastTone, title: string, message: string) => {
    dispatchZenToast({ type: "hide" });
    window.setTimeout(
      () => dispatchZenToast({ type: "show", tone, title, message }),
      20,
    );
    window.setTimeout(() => dispatchZenToast({ type: "hide" }), 3200);
  };

  if (!initialChallenge) {
    return (
      <main
        data-challengers-screen="true"
        className="min-h-svh bg-[var(--challengers-page)] text-[var(--challengers-ink)]"
      >
        <div className="flex min-h-svh min-w-0 flex-col">
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="challengers-panel max-w-md rounded-[10px] border px-8 py-9 text-center">
              <h1 className="font-serif text-xl font-bold text-[var(--challengers-ink)]">
                Desafio não encontrado
              </h1>
              <p className="mt-3 text-sm leading-6 text-[var(--challengers-muted)]">
                O item solicitado não está disponível no catálogo atual.
              </p>
              <Link href="/desafios" className="mt-6 inline-flex">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[8px] border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] text-[var(--challengers-ink)] hover:bg-[var(--challengers-panel)]"
                >
                  <ChevronLeft className="size-3.5" />
                  Voltar aos desafios
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!initialChallenge.evaluationAvailable) {
    return (
      <main
        data-challengers-screen="true"
        className="min-h-svh bg-[var(--challengers-page)] px-4 py-16 text-[var(--challengers-ink)]"
      >
        <ChallengeEditorialReview showCatalogAction />
      </main>
    );
  }

  const challenge = initialChallenge;
  const { result, showComparison } = attemptSession;
  const submitting =
    attemptSession.phase === "submitting" ||
    attemptSession.phase === "revealing";
  const answerLocked = attemptSession.phase !== "answering";
  const parsedQuestion = parseQuestion(challenge.question);
  const lines = (challenge.code ?? "").split("\n");
  const answerLength = userAnswer.trim().length;
  const answerValidation = validateTrainingAnswer(userAnswer);
  const wordCount =
    userAnswer.trim().length === 0
      ? 0
      : userAnswer.trim().split(/\s+/).length;
  // Visitantes também podem acionar o botão: nesse caso exibimos o convite de login.
  const canSubmit =
    challenge.evaluationAvailable &&
    !submitting &&
    !answerLocked &&
    (!isAuthenticated || answerValidation.valid);
  const hasStartedAnalysis =
    answerLength > 0 || notes.trim().length > 0 || hintRevealed || submitting;

  const handleSubmit = async (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    if (!challenge.evaluationAvailable || submitting || answerLocked) {
      return;
    }

    if (!isAuthenticated) {
      setShowAuthenticationDialog(true);
      return;
    }

    if (!answerValidation.valid) {
      showZenToast(
        "warning",
        "Revise sua resposta",
        answerValidation.error,
      );
      return;
    }

    dispatchAttemptSession({ type: "submit_started" });

    try {
      const response = await submitAttempt(id, userAnswer, usedHintRef.current);
      if (response.success && response.data) {
        try {
          window.sessionStorage.removeItem(draftStorageKey);
        } catch {
          // O resultado foi salvo no servidor; uma falha ao limpar o rascunho não o invalida.
        }
        dispatchAttemptSession({
          type: "submit_succeeded",
          result: response.data as ArenaAttemptResult,
        });
        showZenToast(
          "success",
          "Diagnóstico avaliado",
          "Sua resposta foi processada com sucesso.",
        );
        return;
      }

      dispatchAttemptSession({ type: "submit_failed" });
      showZenToast(
        "error",
        "Falha na avaliação",
        response.error || "Erro ao avaliar resposta",
      );
    } catch {
      dispatchAttemptSession({ type: "submit_failed" });
      showZenToast(
        "error",
        "Erro de envio",
        "Erro ao enviar resposta para correção",
      );
    }
  };

  const handleRevealSolution = async () => {
    if (!result?.canRevealSolution || submitting) return;

    dispatchAttemptSession({ type: "reveal_started" });
    try {
      const response = await revealSolution(id);
      if (response.success && response.data) {
        dispatchAttemptSession({
          type: "reveal_succeeded",
          result: response.data as ArenaAttemptResult,
        });
        showZenToast(
          "info",
          "Solução liberada",
          "A sessão foi encerrada e a comparação completa está disponível.",
        );
        return;
      }

      dispatchAttemptSession({ type: "reveal_failed" });
      showZenToast(
        "error",
        "Não foi possível revelar",
        response.error || "Tente novamente em instantes.",
      );
    } catch {
      dispatchAttemptSession({ type: "reveal_failed" });
      showZenToast(
        "error",
        "Não foi possível revelar",
        "Tente novamente em instantes.",
      );
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void handleSubmit();
    }
  };

  const handleCopyCode = async () => {
    try {
      if (!challenge.code) return;
      await navigator.clipboard.writeText(challenge.code);
      showZenToast("info", "Código copiado", "O snippet foi enviado para a área de transferência.");
    } catch {
      showZenToast("error", "Falha ao copiar", "Não foi possível copiar o código agora.");
    }
  };

  return (
    <main
      data-challengers-screen="true"
      className="h-svh overflow-hidden bg-[var(--challengers-page)] text-[var(--challengers-ink)]"
    >
      <ProductEventBeacon
        event={{ name: "challenge_viewed", challengeId: id }}
        dedupeKey={`challenge_viewed:${id}`}
      />
      {answerLength > 0 ? (
        <ProductEventBeacon
          event={{ name: "diagnosis_started", challengeId: id }}
          dedupeKey={`diagnosis_started:${id}`}
        />
      ) : null}
      {showAuthenticationDialog ? (
        <ProductEventBeacon
          event={{ name: "auth_gate_viewed", challengeId: id }}
          dedupeKey={`auth_gate_viewed:${id}`}
        />
      ) : null}
      <div className="flex h-full min-w-0 flex-col">
        <ChallengeHeader
          challenge={challenge}
          challengeNumber={getChallengeNumber(challenge)}
        />

        <div className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto flex min-h-full max-w-[1500px] flex-col px-4 lg:px-5 xl:px-6">
              <ChallengeSteps
                className="h-9 shrink-0"
                hasStartedAnalysis={hasStartedAnalysis}
                hasResult={Boolean(result)}
              />

              <div className="grid flex-1 gap-4 py-3 xl:min-h-[640px] xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]">
                <CodePanel
                  code={challenge.code ?? ""}
                  lineCount={lines.length}
                  difficulty={challenge.difficulty}
                  onCopyCode={handleCopyCode}
                />

                <div className="grid min-h-[680px] gap-4 xl:min-h-0 xl:grid-rows-[minmax(280px,0.9fr)_minmax(300px,1.1fr)]">
                  <StatementPanel
                    activeTab={supportTab}
                    notes={notes}
                    parsedQuestion={parsedQuestion}
                    hintRevealed={hintRevealed}
                    showHintConfirm={showHintConfirm}
                    onTabChange={setSupportTab}
                    onNotesChange={setNotes}
                    onAskHint={() => setShowHintConfirm(true)}
                    onCancelHint={() => setShowHintConfirm(false)}
                    onRevealHint={() => {
                      usedHintRef.current = true;
                      setHintRevealed(true);
                      setShowHintConfirm(false);
                    }}
                  />

                  {submitting && !result ? (
                    <AnalysisLoadingPanel />
                  ) : !result ? (
                    <DiagnosisPanel
                      answer={userAnswer}
                      answerLength={answerLength}
                      wordCount={wordCount}
                      canSubmit={canSubmit}
                      evaluationAvailable={challenge.evaluationAvailable}
                      submitting={submitting}
                      answerLocked={answerLocked}
                      onAnswerChange={setUserAnswer}
                      onClear={() => setUserAnswer("")}
                      onKeyDown={handleKeyDown}
                      onSubmit={handleSubmit}
                    />
                  ) : (
                    <FeedbackPanel
                      result={result}
                      userAnswer={userAnswer}
                      showComparison={showComparison}
                      onToggleComparison={() =>
                        dispatchAttemptSession({ type: "comparison_toggled" })
                      }
                      onRetry={() => {
                        dispatchAttemptSession({ type: "retry_requested" });
                        setUserAnswer("");
                      }}
                      onReveal={() => void handleRevealSolution()}
                      revealing={attemptSession.phase === "revealing"}
                      nextChallenge={nextChallenge}
                      firstFeedbackCelebrated={firstFeedbackCelebrated}
                    />
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>

      <AuthenticationRequiredDialog
        open={showAuthenticationDialog}
        callbackURL={`/treinar/${id}`}
        onClose={() => setShowAuthenticationDialog(false)}
        onAuthenticate={saveDraftBeforeAuthentication}
      />

      <div className="fixed bottom-4 right-4 z-[80]">
        <ZenToast open={zenToast.open} tone={zenToast.tone} title={zenToast.title}>
          {zenToast.message}
        </ZenToast>
      </div>
    </main>
  );
}

function ChallengeHeader({
  challenge,
  challengeNumber,
}: {
  challenge: Challenge;
  challengeNumber: string;
}) {
  return (
    <header className="flex h-[76px] shrink-0 items-center gap-4 bg-[var(--challengers-surface)] px-5 lg:px-8 xl:px-9">
      <Link
        href="/desafios"
        aria-label="Voltar ao catálogo de desafios"
        className="inline-flex size-8 shrink-0 items-center justify-center text-[var(--challengers-muted)] hover:text-[var(--challengers-ink)]"
      >
        <ArrowLeft className="size-5" />
      </Link>

      <div className="flex min-w-0 items-center gap-3">
        <h1 className="truncate font-sans text-lg font-semibold tracking-tight text-[var(--challengers-ink)] sm:text-xl">
          {challengeNumber} - {challenge.title}
        </h1>
        <span className={cn("challengers-header-difficulty hidden rounded-sm border px-1.5 py-0.5 font-mono text-xs font-semibold uppercase tracking-[0.06em] sm:inline-flex", getDifficultyClassName(challenge.difficulty))}>
          {getDifficultyLabel(challenge.difficulty)}
        </span>
      </div>

      <button type="button" aria-label="Notificações" className="ml-auto inline-flex size-9 shrink-0 items-center justify-center text-[var(--challengers-muted)] hover:text-[var(--challengers-ink)]">
        <Bell className="size-[18px]" />
      </button>
    </header>
  );
}

function AuthenticationRequiredDialog({
  open,
  callbackURL,
  onClose,
  onAuthenticate,
}: {
  open: boolean;
  callbackURL: string;
  onClose: () => void;
  onAuthenticate: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const primaryActionRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
      primaryActionRef.current?.focus();
      return;
    }

    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="authentication-required-title"
      aria-describedby="authentication-required-description"
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] p-6 text-[var(--challengers-ink)] shadow-2xl backdrop:bg-black/60 sm:p-8"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
        <button
          type="button"
          aria-label="Fechar"
          className="challengers-icon-button absolute right-4 top-4 grid size-11 place-items-center rounded-lg border"
          onClick={onClose}
        >
          <X className="size-4" aria-hidden="true" />
        </button>

        <span className="grid size-12 place-items-center rounded-full bg-[var(--challengers-blue-soft)] text-[var(--challengers-blue)]">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <h2 id="authentication-required-title" className="mt-5 mb-6 pr-10 font-serif text-2xl font-bold text-[var(--challengers-ink)]">
          É necessário fazer login para enviar seu diagnóstico
        </h2>
        <p id="authentication-required-description" className="mt-3 text-sm leading-6 text-[var(--challengers-muted)]">
          Você pode ler e escrever seu diagnóstico livremente. Para enviá-lo, receber a avaliação e salvar seu progresso, entre ou crie sua conta no Kodan.
        </p>

        <div className="mt-7">
          <Link
            ref={primaryActionRef}
            href={getLoginHref(callbackURL)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--challengers-blue)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            onClick={onAuthenticate}
          >
            Entrar ou criar conta
          </Link>
          <button
            type="button"
            className="mt-3 w-full text-sm font-medium text-[var(--challengers-muted)] underline-offset-4 hover:text-[var(--challengers-ink)] hover:underline"
            onClick={onClose}
          >
            Agora não, vou entrar depois
          </button>
        </div>
    </dialog>
  );
}

function ChallengeSteps({
  className,
  hasStartedAnalysis,
  hasResult,
}: {
  className?: string;
  hasStartedAnalysis: boolean;
  hasResult: boolean;
}) {
  const steps = [
    {
      label: "Leitura do código",
      state: "done",
    },
    {
      label: "Análise das dependências",
      state: hasResult ? "done" : hasStartedAnalysis ? "active" : "idle",
    },
    {
      label: "Correção e solução",
      state: hasResult ? "active" : "idle",
    },
  ] as const;

  return (
    <nav
      aria-label="Progresso do desafio"
      className={cn(
        "flex items-center gap-x-3 overflow-x-auto px-0.5 text-[0.7rem] text-[var(--challengers-muted)]",
        className,
      )}
    >
      {steps.map((step, index) => (
        <div key={step.label} className="flex shrink-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex size-4 items-center justify-center rounded-full border",
              step.state === "done" &&
                "border-[color:var(--challengers-blue)] bg-[var(--challengers-blue)] text-[oklch(99%_0.003_248)]",
              step.state === "active" &&
                "border-[color:var(--challengers-blue)] bg-[var(--challengers-blue-soft)] text-[var(--challengers-blue)]",
              step.state === "idle" &&
                "border-[color:var(--challengers-border-strong)] bg-[var(--challengers-surface)] text-[var(--challengers-muted)]",
            )}
          >
            {step.state === "done" ? (
              <CheckCircle2 className="size-3" />
            ) : step.state === "active" ? (
              <span className="size-2 rounded-full bg-current" />
            ) : null}
          </span>
          <span
            className={cn(
              "whitespace-nowrap",
              step.state !== "idle" && "text-[var(--challengers-ink)]",
            )}
          >
            {step.label}
          </span>
          {index < steps.length - 1 ? (
            <span className="hidden h-px w-12 bg-[var(--challengers-border-strong)] sm:block" />
          ) : null}
        </div>
      ))}
    </nav>
  );
}

function CodePanel({
  code,
  lineCount,
  difficulty,
  onCopyCode,
}: {
  code: string;
  lineCount: number;
  difficulty: string;
  onCopyCode: () => void;
}) {
  return (
    <section className="challengers-panel flex min-h-[560px] flex-col overflow-hidden rounded-[10px] border xl:min-h-0">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[color:var(--challengers-border)] bg-[var(--challengers-panel)]">
        <div className="flex h-full items-center">
          <div className="relative flex h-full items-center gap-2 border-r border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-4 text-sm font-medium text-[var(--challengers-blue)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--challengers-blue)]">
            <FileCode className="size-4" />
            <span>App.tsx</span>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3">
          <span className="hidden rounded-[7px] border border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] px-2.5 py-1 text-[0.72rem] font-medium text-[var(--challengers-blue)] sm:inline-flex">
            React + TypeScript
            <ChevronDown className="ml-1.5 size-3.5" />
          </span>
          <button
            type="button"
            aria-label="Copiar código"
            className="challengers-icon-button inline-flex size-8 items-center justify-center rounded-[8px] border"
            onClick={onCopyCode}
          >
            <Copy className="size-4" />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[var(--challengers-surface)] font-mono text-[0.82rem] leading-6">
        <div className="flex min-w-max">
          <div className="select-none border-r border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-3 py-4 text-right text-[0.72rem] font-medium leading-6 text-[var(--challengers-faint)]">
            {Array.from({ length: lineCount }, (_, index) => (
              <div key={index} className="h-[1.45rem] min-w-5 tabular-nums">
                {index + 1}
              </div>
            ))}
          </div>
          <pre className="flex-1 overflow-visible px-4 py-4 text-[var(--challengers-ink)]">
            {highlightCode(code)}
          </pre>
        </div>
      </div>

      <div className="flex h-9 shrink-0 items-center justify-between border-t border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 text-[0.72rem] text-[var(--challengers-muted)]">
        <span>{lineCount} linhas</span>
        <span>{getDifficultyLabel(difficulty)}</span>
      </div>
    </section>
  );
}

function StatementPanel({
  activeTab,
  notes,
  parsedQuestion,
  hintRevealed,
  showHintConfirm,
  onTabChange,
  onNotesChange,
  onAskHint,
  onCancelHint,
  onRevealHint,
}: {
  activeTab: "statement" | "notes";
  notes: string;
  parsedQuestion: { mainPrompt: string; hintText: string };
  hintRevealed: boolean;
  showHintConfirm: boolean;
  onTabChange: (tab: "statement" | "notes") => void;
  onNotesChange: (notes: string) => void;
  onAskHint: () => void;
  onCancelHint: () => void;
  onRevealHint: () => void;
}) {
  return (
    <section className="challengers-panel flex min-h-0 flex-col overflow-hidden rounded-[10px] border">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-[color:var(--challengers-border)] px-4">
        <div className="flex h-full items-center gap-6">
          <TabButton
            active={activeTab === "statement"}
            onClick={() => onTabChange("statement")}
          >
            Enunciado
          </TabButton>
          <TabButton
            active={activeTab === "notes"}
            onClick={() => onTabChange("notes")}
          >
            Minhas Anotações
          </TabButton>
        </div>
        <div className="hidden items-center gap-3 text-[0.72rem] text-[var(--challengers-muted)] sm:flex">
          <span>Markdown</span>
          <Info className="size-3.5" />
          <PanelRightOpen className="size-3.5" />
        </div>
      </div>

      {activeTab === "statement" ? (
        <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
          <div className="max-w-[70ch] space-y-5">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-blue)]">
                <HelpCircle className="size-4" />
                Diagnóstico
              </div>
              <h2 className="font-serif text-xl font-bold leading-tight text-[var(--challengers-ink)]">
                O que está errado neste componente?
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--challengers-ink)]">
                {parsedQuestion.mainPrompt}
              </p>
            </div>

            <HintCallout
              hintText={parsedQuestion.hintText}
              revealed={hintRevealed}
              confirming={showHintConfirm}
              onAskHint={onAskHint}
              onCancelHint={onCancelHint}
              onRevealHint={onRevealHint}
            />
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 p-4">
          <textarea
            value={notes}
            aria-label="Anotações do desafio"
            placeholder="Registre hipóteses, dependências suspeitas e pontos para validar..."
            className="challengers-control h-full min-h-[220px] w-full resize-none rounded-[9px] border px-4 py-3 text-sm leading-6 outline-none placeholder:text-[var(--challengers-faint)]"
            onChange={(event) => onNotesChange(event.target.value)}
          />
        </div>
      )}
    </section>
  );
}

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "relative h-full text-sm font-medium transition-colors",
        active
          ? "text-[var(--challengers-blue)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[var(--challengers-blue)]"
          : "text-[var(--challengers-muted)] hover:text-[var(--challengers-ink)]",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function HintCallout({
  hintText,
  revealed,
  confirming,
  onAskHint,
  onCancelHint,
  onRevealHint,
}: {
  hintText: string;
  revealed: boolean;
  confirming: boolean;
  onAskHint: () => void;
  onCancelHint: () => void;
  onRevealHint: () => void;
}) {
  return (
    <div className="rounded-[9px] border border-[color:var(--challengers-blue-border)] bg-[var(--challengers-blue-soft)] px-4 py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2 font-semibold text-[var(--challengers-blue)]">
          <Lightbulb className="size-4 shrink-0" />
          <span>Dica</span>
        </div>
        {!revealed && !confirming ? (
          <button
            type="button"
            className="text-[0.78rem] font-medium text-[var(--challengers-blue)] hover:text-[var(--challengers-blue-strong)]"
            onClick={onAskHint}
          >
            Revelar
          </button>
        ) : null}
      </div>

      {revealed ? (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--challengers-ink)]">
          {hintText}
        </p>
      ) : confirming ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-6 text-[var(--challengers-ink)]">
            Revelar uma dica limita o ganho máximo deste desafio para +7 ELO.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              className="rounded-[8px] border-[color:var(--challengers-blue)] bg-[var(--challengers-blue)] text-[oklch(99%_0.003_248)] hover:bg-[var(--challengers-blue-strong)]"
              onClick={onRevealHint}
            >
              Revelar dica
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-[8px] border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] text-[var(--challengers-ink)] hover:bg-[var(--challengers-panel)]"
              onClick={onCancelHint}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--challengers-ink)]">
          Use se estiver travado na relação entre dependências, ciclo de vida e
          ordem das respostas.
        </p>
      )}
    </div>
  );
}

function DiagnosisPanel({
  answer,
  answerLength,
  wordCount,
  canSubmit,
  evaluationAvailable,
  submitting,
  answerLocked,
  onAnswerChange,
  onClear,
  onKeyDown,
  onSubmit,
}: {
  answer: string;
  answerLength: number;
  wordCount: number;
  canSubmit: boolean;
  evaluationAvailable: boolean;
  submitting: boolean;
  answerLocked: boolean;
  onAnswerChange: (answer: string) => void;
  onClear: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onSubmit: (event?: FormEvent) => void;
}) {
  return (
    <form
      className="challengers-panel flex min-h-0 flex-col overflow-hidden rounded-[10px] border"
      onSubmit={onSubmit}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 px-6 py-5">
        <div className="min-w-0">
          <h2 className="font-serif text-lg font-bold leading-tight text-[var(--challengers-ink)]">
            Seu diagnóstico
          </h2>
          <p className="mt-2 text-sm text-[var(--challengers-muted)]">
            Explique o problema e mostre como corrigir o código.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[0.78rem] text-[var(--challengers-muted)]">
          <span className="hidden sm:inline">Markdown suportado</span>
          <Info className="hidden size-3.5 sm:inline" />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={answerLocked || submitting || answer.length === 0}
            className="rounded-[8px] border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] text-[var(--challengers-ink)] hover:bg-[var(--challengers-panel)]"
            onClick={onClear}
          >
            Limpar
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-6">
        <textarea
          value={answer}
          maxLength={MAX_TRAINING_ANSWER_LENGTH}
          aria-label="Resposta do diagnóstico técnico"
          placeholder="Escreva seu diagnóstico aqui..."
          readOnly={answerLocked}
          disabled={submitting}
          className="challengers-control h-full min-h-[150px] w-full resize-none rounded-[9px] border px-4 py-4 text-sm leading-7 outline-none placeholder:text-[var(--challengers-faint)]"
          onChange={(event) => onAnswerChange(event.target.value)}
          onKeyDown={onKeyDown}
        />
      </div>

      <div className="mx-6 flex h-11 shrink-0 items-center justify-between border-x border-b border-[color:var(--challengers-border)] px-4 text-[0.76rem] text-[var(--challengers-muted)]">
        <span>{wordCount} palavras</span>
        <span className={answerLength >= MAX_TRAINING_ANSWER_LENGTH ? "text-[var(--challengers-warning)]" : undefined}>
          {answerLength}/{MAX_TRAINING_ANSWER_LENGTH} caracteres
        </span>
        <span className="hidden sm:inline">Ctrl + Enter para enviar</span>
      </div>

      <div className="shrink-0 px-6 pb-6 pt-4">
        {!evaluationAvailable ? (
          <p className="mb-3 rounded-[8px] border border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-3 py-2 text-sm leading-6 text-[var(--challengers-muted)]">
            A avaliação deste desafio está em revisão editorial. Você pode preparar seu diagnóstico, mas o envio será liberado após a rubrica ser validada.
          </p>
        ) : null}
        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full rounded-[9px] border-[color:var(--challengers-blue)] bg-[var(--challengers-blue)] text-sm font-semibold text-[oklch(99%_0.003_248)] hover:bg-[var(--challengers-blue-strong)]"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analisando resposta
            </>
          ) : (
            <>
              <SendHorizontal className="size-4" />
              Enviar Diagnóstico
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

function AnalysisLoadingPanel() {
  return (
    <section className="challengers-panel flex min-h-0 flex-col items-center justify-center rounded-[10px] border px-6 py-8 text-center">
      <Loader2 className="size-7 animate-spin text-[var(--challengers-blue)]" />
      <h2 className="mt-4 font-serif text-lg font-bold text-[var(--challengers-ink)]">
        Analisando sua resposta
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--challengers-muted)]">
        O Tech Lead está cruzando seu diagnóstico com a solução de referência.
      </p>
    </section>
  );
}

function FeedbackPanel({
  result,
  userAnswer,
  showComparison,
  onToggleComparison,
  onRetry,
  onReveal,
  revealing,
  nextChallenge,
  firstFeedbackCelebrated,
}: {
  result: ArenaAttemptResult;
  userAnswer: string;
  showComparison: boolean;
  onToggleComparison: () => void;
  onRetry: () => void;
  onReveal: () => void;
  revealing: boolean;
  nextChallenge: { id: string; title: string } | null;
  firstFeedbackCelebrated: boolean;
}) {
  return (
    <section className="challengers-panel flex min-h-0 flex-col overflow-hidden rounded-[10px] border">
      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {firstFeedbackCelebrated ? <FirstFeedbackCelebration /> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <FeedbackMetric
            label="Avaliação final"
            value={`${result.score.toFixed(1)}/10`}
          />
          <FeedbackMetric
            label="Variação ELO"
            value={
              result.eloChange > 0
                ? `+${result.eloChange} ELO`
                : result.eloChange < 0
                  ? `${result.eloChange} ELO`
                  : "Sem alteração"
            }
            tone={
              result.eloChange > 0
                ? "positive"
                : result.eloChange < 0
                  ? "negative"
                  : "neutral"
            }
          />
        </div>

        <div className="mt-5 space-y-5">
          <section>
            <h3 className="flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-muted)]">
              <CheckCircle2 className="size-4 text-[var(--challengers-success)]" />
              Feedback do Tech Lead
            </h3>
            <p className="mt-3 rounded-[9px] border border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 py-3 text-sm italic leading-7 text-[var(--challengers-ink)]">
              "{result.feedback.summary}"
            </p>
          </section>

          {result.feedback.points ? (
            <FeedbackPoints points={result.feedback.points} />
          ) : (
            <>
              <FeedbackList
                title="Pontos fortes"
                items={result.feedback.strengths}
                tone="positive"
              />
              <FeedbackList
                title="Pontos cegos"
                items={result.feedback.blindspots}
                tone="negative"
              />
            </>
          )}

          {result.feedback.corrections?.length ? (
            <FeedbackList
              title="Correções importantes"
              items={result.feedback.corrections}
              tone="negative"
            />
          ) : null}

          {result.feedback.reflectionPrompt ? (
            <section className="rounded-[9px] border border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 py-3">
              <h3 className="text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-muted)]">
                Para pensar
              </h3>
              <p className="mt-2 text-sm leading-6 text-[var(--challengers-ink)]">
                {result.feedback.reflectionPrompt}
              </p>
            </section>
          ) : null}

          {result.feedback.seniorSolution ? (
            <section className="border-t border-[color:var(--challengers-border)] pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex h-9 w-full justify-between rounded-[8px] border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] text-[var(--challengers-ink)] hover:bg-[var(--challengers-panel)]"
                onClick={onToggleComparison}
              >
                <span>
                  {showComparison
                    ? "Ocultar solução sênior"
                    : "Comparar com solução sênior"}
                </span>
                {showComparison ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>

              {showComparison ? (
                <div className="mt-3 max-h-56 overflow-y-auto rounded-[9px] border border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] p-4 text-sm leading-6">
                  <p className="font-semibold text-[var(--challengers-muted)]">
                    Sua resposta
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[var(--challengers-muted)]">
                    {userAnswer}
                  </p>
                  <div className="my-4 h-px bg-[var(--challengers-border)]" />
                  <p className="font-semibold text-[var(--challengers-blue)]">
                    Solução de referência
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[var(--challengers-ink)]">
                    {result.feedback.seniorSolution}
                  </p>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-[color:var(--challengers-border)] px-6 py-4">
        {result.canRetry ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-[8px] border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] text-[var(--challengers-ink)] hover:bg-[var(--challengers-panel)]"
            onClick={onRetry}
          >
            {result.status === "SOLVED"
              ? "Tentar melhorar a nota"
              : "Continuar investigando"}
          </Button>
        ) : null}
        {result.canRevealSolution ? (
          <Button
            type="button"
            variant="outline"
            className="h-10 flex-1 rounded-[8px] border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] text-[var(--challengers-ink)] hover:bg-[var(--challengers-panel)]"
            disabled={revealing}
            onClick={onReveal}
          >
            {revealing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            Revelar solução e encerrar
          </Button>
        ) : nextChallenge ? (
          <Link
            href={`/treinar/${nextChallenge.id}`}
            className="flex-1"
            onClick={() => {
              void sendProductEvent({
                name: "next_challenge_started",
                challengeId: nextChallenge.id,
              });
            }}
          >
            <Button className="h-10 w-full rounded-[8px] border-[color:var(--challengers-blue)] bg-[var(--challengers-blue)] text-[oklch(99%_0.003_248)] hover:bg-[var(--challengers-blue-strong)]">
              {nextChallenge.title}
            </Button>
          </Link>
        ) : (
          <Link href="/desafios" className="flex-1">
            <Button className="h-10 w-full rounded-[8px] border-[color:var(--challengers-blue)] bg-[var(--challengers-blue)] text-[oklch(99%_0.003_248)] hover:bg-[var(--challengers-blue-strong)]">
              Escolher próximo desafio
            </Button>
          </Link>
        )}
      </div>
    </section>
  );
}

function FeedbackMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative" | "neutral";
}) {
  return (
    <div className="rounded-[9px] border border-[color:var(--challengers-border)] bg-[var(--challengers-panel)] px-4 py-3">
      <p className="text-[0.72rem] uppercase tracking-[0.12em] text-[var(--challengers-muted)]">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 flex items-center gap-1.5 text-lg font-semibold",
          tone === "positive" && "text-[var(--challengers-success)]",
          tone === "negative" && "text-[var(--challengers-danger)]",
          tone === "neutral" && "text-[var(--challengers-ink)]",
        )}
      >
        {tone === "positive" ? <ArrowUpRight className="size-4" /> : null}
        {tone === "negative" ? <ArrowDownRight className="size-4" /> : null}
        {value}
      </p>
    </div>
  );
}

function FeedbackList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  return (
    <section>
      <h3 className="text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-muted)]">
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-[var(--challengers-ink)]">
            <span
              className={cn(
                "mt-2 size-1.5 shrink-0 rounded-full",
                tone === "positive"
                  ? "bg-[var(--challengers-success)]"
                  : "bg-[var(--challengers-danger)]",
              )}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function FeedbackPoints({
  points,
}: {
  points: NonNullable<ArenaFeedback["points"]>;
}) {
  const primaryPoints = points.filter((point) => point.kind !== "COMPLEMENT");
  const complements = points.filter((point) => point.kind === "COMPLEMENT");

  return (
    <>
      <section>
        <h3 className="text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-muted)]">
          Você identificou
        </h3>
        <ul className="mt-2 space-y-2">
          {primaryPoints.map((point) => (
            <li
              key={point.kind === "HIDDEN" ? point.slot : point.conceptId}
              className="flex gap-2 text-sm leading-6 text-[var(--challengers-ink)]"
            >
              <span aria-hidden="true" className="w-4 shrink-0 font-semibold">
                {point.kind === "MATCHED" ? "✓" : point.kind === "HIDDEN" ? "?" : "•"}
              </span>
              <span>{point.label}</span>
            </li>
          ))}
        </ul>
      </section>
      {complements.length ? (
        <section>
          <h3 className="text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-muted)]">
            Complementos
          </h3>
          <ul className="mt-2 space-y-2">
            {complements.map((point) => (
              <li key={point.conceptId} className="flex gap-2 text-sm leading-6 text-[var(--challengers-ink)]">
                <span aria-hidden="true" className="w-4 shrink-0">○</span>
                <span>{point.label}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
