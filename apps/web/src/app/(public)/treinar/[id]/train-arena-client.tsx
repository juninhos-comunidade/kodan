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
  ChevronLeft,
  Eye,
  HelpCircle,
  Info,
  Lightbulb,
  Loader2,
  PanelRightOpen,
  SendHorizontal,
} from "lucide-react";

import {
  ZenButton,
  ZenConfirmationModal,
  ZenFeedbackModal,
  ZenToast,
  type ZenFeedbackData,
} from "@kodan/ui/components/zen";
import { cn } from "@kodan/ui/lib/utils";
import { ProductEventBeacon } from "@/components/product-event-beacon";
import { ChallengeEditorialReview } from "@/components/challenge-editorial-review";
import type { HighlightedCode } from "@/lib/code-highlighting";
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
import { ChallengeEvidencePanel } from "./challenge-evidence-panel";

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
  language?: "react" | "typescript" | "python" | "java" | "go";
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
        "Analise as evidências e justifique sua conclusão.",
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
        "Analise as evidências e justifique sua conclusão.",
      hintText,
    };
  }

  return {
    mainPrompt: questionText || "Analise as evidências e justifique sua conclusão.",
    hintText: "Separe o que as evidências comprovam das hipóteses que ainda precisariam ser verificadas.",
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

function toZenFeedbackData(result: ArenaAttemptResult): ZenFeedbackData {
  const points = result.feedback.points?.map((point) => ({
    title: point.kind === "HIDDEN" ? "Ponto ainda não identificado" : point.label,
    description: point.kind === "MATCHED"
      ? "Este sinal apareceu no seu diagnóstico."
      : point.kind === "REVEALED"
        ? "Este ponto deveria ter aparecido no seu diagnóstico, mas não foi identificado."
      : point.kind === "COMPLEMENT"
        ? "Este detalhe complementa a causa principal."
        : point.kind === "HIDDEN"
          ? "A solução de referência mostra este ponto."
          : undefined,
    status: point.kind === "MATCHED"
      ? "correct" as const
      : point.kind === "HIDDEN"
        ? "missing" as const
        : "wrong" as const,
  })) ?? [
    ...result.feedback.strengths.map((title) => ({
      title,
      status: "correct" as const,
    })),
    ...result.feedback.blindspots.map((title) => ({
      title,
      status: "wrong" as const,
    })),
    ...(result.feedback.corrections ?? []).map((title) => ({
      title,
      status: "missing" as const,
    })),
  ];

  return {
    score: result.score,
    maxScore: 10,
    eloVariation: result.eloChange,
    points,
    techLeadFeedback: result.feedback.summary,
  };
}

interface TrainArenaClientProps {
  id: string;
  initialChallenge: Challenge | null;
  initialCodeHighlight?: HighlightedCode | null;
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
  initialCodeHighlight = null,
  isAuthenticated,
  initialSession = initialAttemptSessionState,
  initialUserAnswer = "",
  nextChallenge = null,
}: TrainArenaClientProps) {
  const [userAnswer, setUserAnswer] = useState(() => {
    if (initialUserAnswer || typeof window === "undefined") return initialUserAnswer;

    try {
      return window.sessionStorage.getItem(`${DRAFT_STORAGE_PREFIX}${id}`) ?? "";
    } catch {
      return "";
    }
  });
  const [notes, setNotes] = useState("");
  const [supportTab, setSupportTab] = useState<"statement" | "notes">(
    "statement",
  );
  const [attemptSession, dispatchAttemptSession] = useReducer(
    attemptSessionReducer,
    initialSession,
  );
  const [showAuthenticationDialog, setShowAuthenticationDialog] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
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

    const controller = new AbortController();
    let retryTimer: number | undefined;
    const scheduleRetry = (attempt: number) => {
      if (!controller.signal.aborted && attempt < 3) {
        retryTimer = window.setTimeout(
          () => persistFeedbackView(attempt + 1),
          attempt * 2_000,
        );
      }
    };
    const persistFeedbackView = (attempt = 1) => {
      void recordFeedbackViewed(id, attemptNumber, sessionAgeBucket)
        .then((response) => {
          if (controller.signal.aborted) return;

          if (response.success) {
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

          scheduleRetry(attempt);
        })
        .catch(() => {
          // Telemetria de produto é best effort e não deve interromper o feedback.
          scheduleRetry(attempt);
        });
    };
    void persistFeedbackView();

    return () => {
      controller.abort();
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
                <ZenButton variant="washi">
                  <ChevronLeft className="size-3.5" />
                  Voltar aos desafios
                </ZenButton>
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
  const answerGuidance = challenge.intent === "compare"
    ? "Compare os conceitos, explicando seus contratos, diferenças e usos adequados."
    : challenge.intent === "validate"
      ? "Diga se o comportamento atende ao objetivo e sustente a conclusão com as evidências disponíveis."
      : "Explique a causa provável e mostre como as evidências sustentam sua conclusão.";

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
        setShowFeedbackModal(true);
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
        setShowFeedbackModal(true);
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
                presentation={challenge.presentation ?? "code"}
                hasStartedAnalysis={hasStartedAnalysis}
                hasResult={Boolean(result)}
              />

              <div className="grid flex-1 gap-4 py-3 xl:min-h-[640px] xl:grid-cols-[minmax(0,1.08fr)_minmax(390px,0.92fr)]">
                <ChallengeEvidencePanel
                  challenge={challenge}
                  difficulty={challenge.difficulty}
                  onCopyCode={handleCopyCode}
                  highlightedCode={initialCodeHighlight}
                />

                <div className="grid min-h-[680px] gap-4 xl:min-h-0 xl:grid-rows-[minmax(280px,0.9fr)_minmax(300px,1.1fr)]">
                  <StatementPanel
                    activeTab={supportTab}
                    notes={notes}
                    parsedQuestion={parsedQuestion}
                    conceptMode={challenge.presentation === "concept"}
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
                      guidance={answerGuidance}
                      onAnswerChange={setUserAnswer}
                      onClear={() => setUserAnswer("")}
                      onKeyDown={handleKeyDown}
                      onSubmit={handleSubmit}
                    />
                  ) : (
                    <FeedbackPanel
                      result={result}
                      onRetry={() => {
                        dispatchAttemptSession({ type: "retry_requested" });
                        setUserAnswer("");
                      }}
                      onReveal={() => void handleRevealSolution()}
                      revealing={attemptSession.phase === "revealing"}
                      nextChallenge={nextChallenge}
                      firstFeedbackCelebrated={firstFeedbackCelebrated}
                      onOpenFeedback={() => setShowFeedbackModal(true)}
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

      {result ? (
        <ZenFeedbackModal
          open={showFeedbackModal}
          taskName={`${getChallengeNumber(challenge)} - ${challenge.title}`}
          userAnswer={userAnswer}
          feedback={toZenFeedbackData(result)}
          referenceAnswer={result.feedback.seniorSolution || undefined}
          canViewAnswer={result.canRevealSolution}
          answerAlreadyRevealed={showComparison}
          onClose={() => setShowFeedbackModal(false)}
          onTryAgain={() => {
            setShowFeedbackModal(false);
            dispatchAttemptSession({ type: "retry_requested" });
            setUserAnswer("");
          }}
          onViewAnswer={() => void handleRevealSolution()}
          onNextChallenge={nextChallenge
            ? () => {
                void sendProductEvent({
                  name: "next_challenge_started",
                  challengeId: nextChallenge.id,
                });
                window.location.assign(`/treinar/${nextChallenge.id}`);
              }
            : undefined}
        />
      ) : null}

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
  return (
    <ZenConfirmationModal
      open={open}
      title="É necessário fazer login"
      confirmLabel="Entrar ou criar conta"
      cancelLabel="Agora não"
      onCancel={onClose}
      onConfirm={() => {
        onAuthenticate();
        window.location.assign(getLoginHref(callbackURL));
      }}
    >
      Você pode ler e escrever seu diagnóstico livremente. Para enviá-lo, receber a avaliação e salvar seu progresso, entre ou crie sua conta no Kodan.
    </ZenConfirmationModal>
  );
}

function ChallengeSteps({
  className,
  presentation,
  hasStartedAnalysis,
  hasResult,
}: {
  className?: string;
  presentation: "code" | "code-terminal" | "terminal" | "concept";
  hasStartedAnalysis: boolean;
  hasResult: boolean;
}) {
  const steps = [
    {
      label: presentation === "concept"
        ? "Leitura do enunciado"
        : presentation === "terminal"
          ? "Leitura da saída"
          : "Leitura das evidências",
      state: "done",
    },
    {
      label: presentation === "concept" ? "Análise conceitual" : "Análise técnica",
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

function StatementPanel({
  activeTab,
  notes,
  parsedQuestion,
  conceptMode,
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
  conceptMode: boolean;
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
            {conceptMode ? "Apoio" : "Enunciado"}
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
            {conceptMode ? (
              <div>
                <div className="mb-3 flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-blue)]">
                  <HelpCircle className="size-4" aria-hidden="true" />
                  Como responder
                </div>
                <h2 className="font-serif text-xl font-bold leading-tight text-[var(--challengers-ink)]">
                  Compare os conceitos pelos seus contratos
                </h2>
                <p className="mt-3 text-sm leading-7 text-[var(--challengers-muted)]">
                  Explique o propósito de cada estrutura, onde elas se aproximam e em quais situações produzem decisões diferentes.
                </p>
              </div>
            ) : (
            <div>
              <div className="mb-3 flex items-center gap-2 text-[0.76rem] font-semibold uppercase tracking-[0.12em] text-[var(--challengers-blue)]">
                <HelpCircle className="size-4" />
                Diagnóstico
              </div>
              <h2 className="font-serif text-xl font-bold leading-tight text-[var(--challengers-ink)]">
                O que as evidências indicam?
              </h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--challengers-ink)]">
                {parsedQuestion.mainPrompt}
              </p>
            </div>
            )}

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
            <ZenButton
              variant="moss"
              type="button"
              onClick={onRevealHint}
            >
              Revelar dica
            </ZenButton>
            <ZenButton
              variant="washi"
              type="button"
              onClick={onCancelHint}
            >
              Cancelar
            </ZenButton>
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-[var(--challengers-ink)]">
          Comece separando o comportamento observado, a causa provável e as
          evidências que sustentam sua conclusão.
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
  guidance,
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
  guidance: string;
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
            {guidance}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-[0.78rem] text-[var(--challengers-muted)]">
          <span className="hidden sm:inline">Markdown suportado</span>
          <Info className="hidden size-3.5 sm:inline" />
          <ZenButton
            variant="washi"
            type="button"
            disabled={answerLocked || submitting || answer.length === 0}
            onClick={onClear}
          >
            Limpar
          </ZenButton>
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
        <ZenButton
          variant="moss"
          type="submit"
          disabled={!canSubmit}
          className="h-11 w-full"
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
        </ZenButton>
      </div>
    </form>
  );
}

function AnalysisLoadingPanel() {
  return (
    <section className="challengers-panel flex min-h-0 flex-col items-center justify-center rounded-[10px] border px-6 py-8 text-center">
      <Loader2 className="size-7 animate-spin text-[var(--challengers-blue)]" />
      <h2 className="mt-4 font-serif text-lg font-bold text-[var(--challengers-ink)]">
        Estamos analisando seu diagnóstico
      </h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--challengers-muted)]">
        Beba água enquanto verificamos...
      </p>
    </section>
  );
}

function FeedbackPanel({
  result,
  onOpenFeedback,
  onRetry,
  onReveal,
  revealing,
  nextChallenge,
  firstFeedbackCelebrated,
}: {
  result: ArenaAttemptResult;
  onOpenFeedback: () => void;
  onRetry: () => void;
  onReveal: () => void;
  revealing: boolean;
  nextChallenge: { id: string; title: string } | null;
  firstFeedbackCelebrated: boolean;
}) {
  return (
    <section className="challengers-panel flex min-h-0 flex-col overflow-hidden rounded-[10px] border">
      <div className="min-h-0 flex-1 overflow-auto px-6 py-5">
        {firstFeedbackCelebrated ? (
          <FirstFeedbackCelebration hasNextChallenge={Boolean(nextChallenge)} />
        ) : null}
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
            <ZenButton variant="washi" className="mt-3 w-full" onClick={onOpenFeedback}>
              <Eye className="size-4" />
              Abrir resposta completa
            </ZenButton>
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

        </div>
      </div>

      <div className="flex shrink-0 gap-2 border-t border-[color:var(--challengers-border)] px-6 py-4">
        {result.canRetry ? (
          <ZenButton
            variant="washi"
            type="button"
            className="h-10 flex-1"
            onClick={onRetry}
          >
            {result.status === "SOLVED"
              ? "Tentar melhorar a nota"
              : "Continuar investigando"}
          </ZenButton>
        ) : null}
        {result.canRevealSolution ? (
          <ZenButton
            variant="moss"
            type="button"
            className="h-10 flex-1 rounded-[8px] border-[color:var(--challengers-border)] bg-[var(--challengers-surface)] text-[var(--challengers-ink)] hover:bg-[var(--challengers-panel)]"
            disabled={revealing}
            onClick={onReveal}
          >
            {revealing ? <Loader2 className="size-4 animate-spin" /> : <Eye className="size-4" />}
            Revelar solução e encerrar
          </ZenButton>
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
            <ZenButton variant="ink" className="h-10 w-full">
              {nextChallenge.title}
            </ZenButton>
          </Link>
        ) : (
          <Link href="/desafios" className="flex-1">
            <ZenButton variant="ink" className="h-10 w-full">
              Explorar catálogo
            </ZenButton>
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
          Pontos de atenção
        </h3>
        <ul className="mt-2 space-y-2">
          {primaryPoints.map((point) => (
            <li
              key={point.kind === "HIDDEN" ? point.slot : point.conceptId}
              className="flex gap-2 text-sm leading-6 text-[var(--challengers-ink)]"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "w-4 shrink-0 font-semibold",
                  point.kind === "MATCHED" && "text-[var(--challengers-success)]",
                  point.kind === "REVEALED" && "text-[var(--challengers-danger)]",
                  point.kind === "HIDDEN" && "text-[var(--challengers-muted)]",
                )}
              >
                {point.kind === "MATCHED" ? "✓" : point.kind === "REVEALED" ? "×" : "?"}
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
