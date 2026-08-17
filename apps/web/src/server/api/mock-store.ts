import {
  evaluateAttempt,
  revealAttemptSolution,
  type AttemptSessionStatus,
} from "@/server/training/attempt-execution";
import { finalizeEvaluation } from "@/server/training/evaluation/evaluation-service";
import { parseChallengeEvaluationRubric } from "@/server/training/evaluation/schemas";
import {
  parseStoredPublicFeedback,
  revealStoredFeedback,
  serializeStoredEvaluation,
} from "@/server/training/evaluation/stored-feedback";
import type {
  ChallengeEvaluationRubric,
  ModelEvaluation,
} from "@/server/training/evaluation/types";

type MockChallenge = {
  id: string;
  title: string;
  language: "react" | "typescript" | "python" | "java" | "go";
  difficulty: "EASY" | "MEDIUM" | "HARD";
  recommendedElo: number;
  tags: string;
  code: string;
  question: string;
  solution: string;
  evaluationRubricJson?: string;
  createdAt: Date;
  updatedAt: Date;
};

type MockAttempt = {
  id: string;
  userId: string;
  challengeId: string;
  userAnswer: string;
  feedbackJson: string;
  score: number;
  eloChange: number;
  sessionStatus: AttemptSessionStatus;
  attemptNumber: number;
  createdAt: Date;
  challenge: MockChallenge;
};

type MockTrainingStoreOptions = {
  modelEvaluationForAnswer?: (
    answer: string,
    rubric: ChallengeEvaluationRubric,
  ) => ModelEvaluation;
};

const MOCK_USER_ID = "mock-user";
const mockChallenges: MockChallenge[] = [
  {
    id: "mock-effect-dependencies",
    title: "Filtro de Produtos com Busca Travada",
    language: "react",
    difficulty: "EASY",
    recommendedElo: 1100,
    tags: "react, hooks, useEffect, dependencies",
    code: `const [rows, setRows] = useState<Product[]>([]);
const [filtered, setFiltered] = useState<Product[]>([]);

useEffect(() => {
  setFiltered(rows.filter((row) => row.name.includes(searchTerm)));
}, []);`,
    question:
      "Por que a busca deixa de refletir os produtos e o termo digitado? Explique a causa e proponha uma correção.",
    solution:
      "O efeito usa rows e searchTerm, mas ambos ficaram fora das dependências. Inclua as dependências ou derive filtered durante a renderização com useMemo.",
    evaluationRubricJson: JSON.stringify({
      version: "1.0.0",
      questionKind: "debugging",
      centralAnswer: "O efeito captura rows e searchTerm iniciais porque a lista de dependências está vazia.",
      concepts: [
        {
          id: "missing-dependencies",
          importance: "critical",
          internalDescription: "rows e searchTerm são lidos pelo efeito, mas não aparecem nas dependências.",
          publicLabel: "A ausência das dependências usadas pelo efeito.",
          reflectionPrompt: "Observe quais valores externos são lidos dentro do efeito.",
        },
        {
          id: "stale-filter",
          importance: "essential",
          internalDescription: "O filtro permanece baseado nos valores capturados na primeira execução.",
          publicLabel: "O uso de valores desatualizados no filtro.",
        },
      ],
    }),
    createdAt: new Date("2026-01-10T12:00:00.000Z"),
    updatedAt: new Date("2026-01-10T12:00:00.000Z"),
  },
  {
    id: "mock-stale-closure",
    title: "Timeline de Eventos com Lista Desatualizada",
    language: "react",
    difficulty: "EASY",
    recommendedElo: 1120,
    tags: "react, hooks, closure, state",
    code: `useEffect(() => {
  const timer = setInterval(() => setCount(count + 1), 1000);
  return () => clearInterval(timer);
}, []);`,
    question:
      "Identifique por que o contador não continua avançando e mostre uma forma segura de atualizá-lo.",
    solution:
      "count foi capturado pelo closure inicial. Use a atualização funcional setCount((current) => current + 1) para sempre ler o estado recente.",
    evaluationRubricJson: JSON.stringify({
      version: "1.0.0",
      questionKind: "debugging",
      centralAnswer: "O callback do intervalo captura o valor inicial de count.",
      concepts: [
        {
          id: "stale-closure",
          importance: "critical",
          internalDescription: "O closure do callback preserva o count da renderizacao inicial.",
          publicLabel: "O valor de estado capturado pelo callback.",
        },
        {
          id: "functional-update",
          importance: "essential",
          internalDescription: "A atualizacao funcional le o estado mais recente.",
          publicLabel: "A atualizacao funcional do estado.",
        },
      ],
    }),
    createdAt: new Date("2026-01-11T12:00:00.000Z"),
    updatedAt: new Date("2026-01-11T12:00:00.000Z"),
  },
  {
    id: "mock-cleanup",
    title: "Listener Duplicado ao Abrir o Painel",
    language: "react",
    difficulty: "MEDIUM",
    recommendedElo: 1250,
    tags: "react, cleanup, event-listener, useEffect",
    code: `useEffect(() => {
  window.addEventListener("resize", onResize);
}, [onResize]);`,
    question:
      "Explique o vazamento presente no componente e como impedir que listeners antigos continuem ativos.",
    solution:
      "Cada alteração em onResize registra um novo listener. Retorne uma função de cleanup que execute removeEventListener com a mesma referência.",
    evaluationRubricJson: JSON.stringify({
      version: "1.0.0",
      questionKind: "debugging",
      centralAnswer: "O efeito nao remove o listener anterior.",
      concepts: [
        {
          id: "missing-cleanup",
          importance: "critical",
          internalDescription: "O efeito precisa retornar uma funcao de cleanup.",
          publicLabel: "A remocao do listener anterior.",
        },
        {
          id: "same-reference",
          importance: "essential",
          internalDescription: "removeEventListener deve receber a mesma referencia.",
          publicLabel: "A referencia usada para remover o listener.",
        },
      ],
    }),
    createdAt: new Date("2026-01-12T12:00:00.000Z"),
    updatedAt: new Date("2026-01-12T12:00:00.000Z"),
  },
];

function cloneChallenge(challenge: MockChallenge, attempts: MockAttempt[]) {
  return {
    ...challenge,
    attempts: attempts
      .filter((attempt) => attempt.challengeId === challenge.id)
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .map(({ id, score, eloChange, attemptNumber, sessionStatus, createdAt, userAnswer, feedbackJson }) => ({
        id,
        score,
        eloChange,
        attemptNumber,
        sessionStatus,
        createdAt,
        userAnswer,
        feedbackJson,
      })),
  };
}

export function createMockTrainingStore(options: MockTrainingStoreOptions = {}) {
  let user = {
    id: MOCK_USER_ID,
    name: "Treinador local",
    bio: "Modo mock: dados locais para desenvolver telas sem PostgreSQL.",
    image: null as string | null,
    email: "mock@kodan.local",
    emailVerified: true,
    elo: 1200,
    createdAt: new Date("2026-01-01T12:00:00.000Z"),
    updatedAt: new Date("2026-01-01T12:00:00.000Z"),
  };
  let attempts: MockAttempt[] = [];

  return {
    getCurrentUser: () => ({ ...user }),
    updateUser: (input: { name: string; bio?: string; image?: string | null }) => {
      user = { ...user, name: input.name, ...(input.bio !== undefined ? { bio: input.bio } : {}), ...(input.image !== undefined ? { image: input.image } : {}), updatedAt: new Date() };
      return { ...user };
    },
    listChallenges: ({ limit, offset }: { limit: number; offset: number }) => ({
      items: mockChallenges.slice(offset, offset + limit).map((challenge) => cloneChallenge(challenge, attempts)),
      total: mockChallenges.length,
    }),
    getChallengeById: (id: string) => {
      const challenge = mockChallenges.find((item) => item.id === id);
      return challenge ? cloneChallenge(challenge, attempts) : null;
    },
    listAttempts: () => attempts.map((attempt) => ({ ...attempt, challenge: { ...attempt.challenge } })),
    submitAttempt: (challengeId: string, input: { userAnswer: string; usedHint?: boolean }) => {
      const challenge = mockChallenges.find((item) => item.id === challengeId);
      if (!challenge) throw new Error("Desafio não encontrado");
      const challengeAttempts = attempts.filter((attempt) => attempt.challengeId === challengeId);
      const latestAttempt = challengeAttempts[0];
      if (
        latestAttempt &&
        latestAttempt.sessionStatus !== "RETRY_AVAILABLE" &&
        latestAttempt.sessionStatus !== "SOLVED"
      ) {
        throw new Error("Tentativa encerrada");
      }
      if (
        challengeAttempts.some(
          (attempt) =>
            attempt.sessionStatus === "SOLVED" && attempt.score === 10,
        )
      ) {
        throw new Error("Tentativa encerrada");
      }

      const rubric = parseChallengeEvaluationRubric(challenge.evaluationRubricJson);
      if (!rubric) throw new Error("Rubrica de avaliação inválida");
      const modelEvaluation = options.modelEvaluationForAnswer?.(
        input.userAnswer,
        rubric,
      ) ?? buildDeterministicMockEvaluation(input.userAnswer, rubric);
      const evaluatedAnswer = finalizeEvaluation(
        {
          challenge: {
            id: challenge.id,
            title: challenge.title,
            question: challenge.question,
            code: challenge.code,
          },
          userAnswer: input.userAnswer,
          rubric,
        },
        {
          ok: true,
          evaluation: modelEvaluation,
          metadata: {
            mechanism: "DETERMINISTIC_MOCK",
            model: "kodan-local-deterministic",
            promptVersion: "1.0.0",
            rubricVersion: rubric.version,
            latencyMs: 0,
          },
        },
      );
      if (!evaluatedAnswer.ok) throw new Error("Avaliação mock inválida");

      const evaluation = evaluateAttempt({
        currentElo: user.elo,
        previousAttempts: challengeAttempts.map((attempt) => ({
          score: attempt.score,
          eloChange: attempt.eloChange,
          sessionStatus: attempt.sessionStatus,
        })),
        usedHint: Boolean(input.usedHint),
        solution: challenge.solution,
        feedback: evaluatedAnswer.publicFeedback,
      });
      user = { ...user, elo: evaluation.newElo, updatedAt: new Date() };
      attempts = [{
        id: `mock-attempt-${attempts.length + 1}`,
        userId: user.id,
        challengeId,
        userAnswer: input.userAnswer,
        feedbackJson: serializeStoredEvaluation({
          ...evaluatedAnswer.storedEvaluation,
          publicFeedback: evaluation.feedback,
        }),
        score: evaluation.score,
        eloChange: evaluation.eloChange,
        sessionStatus: evaluation.status,
        attemptNumber: evaluation.attemptNumber,
        createdAt: new Date(),
        challenge,
      }, ...attempts];

      return evaluation;
    },
    revealSolution: (challengeId: string) => {
      const challenge = mockChallenges.find((item) => item.id === challengeId);
      if (!challenge) throw new Error("Desafio não encontrado");
      const latestAttempt = attempts.find((attempt) => attempt.challengeId === challengeId);
      if (
        !latestAttempt ||
        latestAttempt.sessionStatus === "REVEALED"
      ) {
        throw new Error("Tentativa encerrada");
      }

      const publicFeedback = parseStoredPublicFeedback(latestAttempt.feedbackJson);
      if (!publicFeedback) throw new Error("Feedback persistido inválido");
      const revealedFeedbackJson = revealStoredFeedback(
        latestAttempt.feedbackJson,
        challenge.solution,
      );
      const revealedFeedback = parseStoredPublicFeedback(revealedFeedbackJson);
      if (!revealedFeedback) throw new Error("Feedback revelado inválido");
      const revealed = revealAttemptSolution({
        currentElo: user.elo,
        attemptNumber: latestAttempt.attemptNumber,
        solution: challenge.solution,
        feedback: revealedFeedback,
      });
      attempts = attempts.map((attempt) =>
        attempt.id === latestAttempt.id
          ? {
              ...attempt,
              feedbackJson: revealedFeedbackJson,
              sessionStatus: revealed.status,
            }
          : attempt
      );
      return revealed;
    },
  };
}

export const mockTrainingStore = createMockTrainingStore();

function buildDeterministicMockEvaluation(
  answer: string,
  rubric: ChallengeEvaluationRubric,
): ModelEvaluation {
  const isDetailed = answer.trim().length >= 80;
  return {
    status: answer.trim().length > 0 ? "VALID" : "NONSENSE",
    centralCorrectness: isDetailed ? 85 : 30,
    technicalReasoning: isDetailed ? 80 : 30,
    technicalPrecision: isDetailed ? 80 : 35,
    conceptAssessments: rubric.concepts.map((concept) => ({
      conceptId: concept.id,
      state: isDetailed ? "MATCHED" : "MISSING",
      evidence: isDetailed
        ? "A resposta local possui detalhamento suficiente para o cenario mock."
        : "A resposta local ainda e curta para o cenario mock.",
    })),
    misconceptionIds: [],
    decisionRationale: "Avaliacao deterministica usada apenas no modo mock.",
  };
}
