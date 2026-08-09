"use client";

import { useState, type ReactNode } from "react";
import {
    ArrowUpRight,
    Check,
    Eye,
    EyeOff,
    Lightbulb,
    RotateCcw,
    Scale,
    Trophy,
    X,
} from "lucide-react";

export type FeedbackPointStatus =
    | "correct"
    | "wrong"
    | "missing";

export interface FeedbackPoint {
    title: string;
    description?: string;
    status: FeedbackPointStatus;
}

export interface FeedbackData {
  score: number;
  maxScore?: number;

  eloVariation: number;

  points: FeedbackPoint[];

  techLeadFeedback?: string;

  userAnswer?: string;

  seniorSolution?: string;

  seniorExplanation?: string;
}

export interface FeedbackModalProps {
    open?: boolean;

    title?: string;
    taskName: string;

    difficulty?: "EASY" | "MEDIUM" | "HARD";

    feedback: FeedbackData;

    onClose: () => void;

    onTryAgain: () => void;

    onViewAnswer: () => void;

    onNextChallenge?: () => void;
}


export default function FeedbackModal({
    open = false,
    title = "Resultado da Atividade",
    taskName,
    difficulty = "EASY",
    feedback,
    onClose,
    onTryAgain,
    onViewAnswer,
    onNextChallenge,
}: FeedbackModalProps) {
    const [showSeniorSolution, setShowSeniorSolution] = useState(false);
    const [answerRevealed, setAnswerRevealed] = useState(false);

    if (!open) {
        return null;
    }

    const maxScore = feedback.maxScore ?? 10;

    const scorePercentage = Math.min(
        Math.max((feedback.score / maxScore) * 100, 0),
        100,
    );

    const isPerfectScore = feedback.score >= maxScore;

    const isBelowCutoff = feedback.score < 7;

    const isPartialScore =
        feedback.score >= 7 && feedback.score < maxScore;

    const eloVariation = Math.max(0, feedback.eloVariation);

    const shouldShowDetailedPoints =
        isPerfectScore || answerRevealed;

    function handleViewAnswer() {
        setAnswerRevealed(true);
        setShowSeniorSolution(true);

        onViewAnswer();
    }

    function handleTryAgain() {
        setAnswerRevealed(false);
        setShowSeniorSolution(false);

        onTryAgain();
    }

    return (
        <div
            className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-slate-950/50
        p-4
        backdrop-blur-sm
      "
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-modal-title"
        >
            <div
                className="
          relative flex
          max-h-[92vh]
          w-full
          max-w-5xl
          flex-col
          overflow-hidden
          rounded-2xl
          border border-slate-200
          bg-white
          shadow-2xl
        "
            >
                <header
                    className="
            flex shrink-0
            items-start justify-between
            border-b border-slate-100
            px-7 py-5
          "
                >
                    <div className="flex items-center gap-4">
                        <div
                            className="
                flex h-12 w-12
                items-center justify-center
                rounded-full
                bg-blue-50
              "
                        >
                            <Trophy className="h-6 w-6 text-blue-600" />
                        </div>

                        <div>
                            <h2
                                id="feedback-modal-title"
                                className="
                  text-xl font-bold
                  tracking-tight
                  text-slate-900
                "
                            >
                                {title}
                            </h2>

                            <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-sm text-slate-500">
                                    {taskName}
                                </span>

                                <DifficultyBadge difficulty={difficulty} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
              rounded-lg p-2
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-700
            "
                        aria-label="Fechar"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </header>


                <div
                    className="
            min-h-0
            flex-1
            overflow-y-auto
            px-7 py-6
          "
                >
                    <div className="space-y-4">

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <ScoreCard
                                score={feedback.score}
                                maxScore={maxScore}
                                percentage={scorePercentage}
                            />

                            <EloCard variation={eloVariation} />
                        </div>

                        {isBelowCutoff && (
                            <CutoffMessage />
                        )}

                        {isPartialScore && !answerRevealed && (
                            <>
                                <PartialFeedbackMessage />

                                <PointsSection
                                    points={feedback.points}
                                    detailed={false}
                                />
                            </>
                        )}

                        {(isPerfectScore || answerRevealed) && (
                            <>
                                <PointsSection
                                    points={feedback.points}
                                    detailed
                                />

                                <FeedbackSection
                                    icon={
                                        <Scale className="h-5 w-5 text-blue-600" />
                                    }
                                    title="Comparação com Solução Sênior"
                                    action={
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowSeniorSolution(
                                                    (current) => !current,
                                                )
                                            }
                                            className="
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-lg
                        border
                        border-slate-200
                        px-3 py-2
                        text-sm
                        font-medium
                        text-slate-600
                        transition
                        hover:bg-slate-50
                      "
                                        >
                                            {showSeniorSolution ? (
                                                <EyeOff className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}

                                            {showSeniorSolution
                                                ? "Ocultar solução sênior"
                                                : "Mostrar solução sênior"}
                                        </button>
                                    }
                                >
                                    {showSeniorSolution && (
                                        <div className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                                <CodeCard
                                                    title="Sua resposta"
                                                    icon={
                                                        <X className="h-4 w-4" />
                                                    }
                                                    code={feedback.userAnswer ?? ""}
                                                />

                                                <CodeCard
                                                    title="Solução de referência"
                                                    icon={
                                                        <Trophy className="h-4 w-4" />
                                                    }
                                                    code={feedback.seniorSolution ?? ""}
                                                    senior
                                                />
                                            </div>

                                            <div
                                                className="
                          rounded-lg
                          border border-blue-200
                          bg-blue-50
                          px-5 py-4
                        "
                                            >
                                                <div className="flex gap-3">
                                                    <Lightbulb
                                                        className="
                              mt-0.5
                              h-5 w-5
                              shrink-0
                              text-blue-600
                            "
                                                    />

                                                    <div>
                                                        <h4
                                                            className="
                                font-semibold
                                text-blue-700
                              "
                                                        >
                                                            Por que essa solução é melhor?
                                                        </h4>

                                                        <p
                                                            className="
                                mt-1
                                text-sm
                                leading-6
                                text-slate-600
                              "
                                                        >
                                                            {feedback.seniorExplanation}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </FeedbackSection>
                            </>
                        )}
                    </div>
                </div>

                <footer
                    className="
            grid
            shrink-0
            grid-cols-1
            gap-3
            border-t border-slate-100
            bg-white
            px-7 py-5
            sm:grid-cols-2
          "
                >

                    {isBelowCutoff && (
                        <button
                            type="button"
                            onClick={handleTryAgain}
                            className="
                col-span-full
                inline-flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
                        >
                            <RotateCcw className="h-5 w-5" />

                            Tentar Novamente
                        </button>
                    )}

                    {isPartialScore && !answerRevealed && (
                        <>
                            <button
                                type="button"
                                onClick={handleTryAgain}
                                className="
                  inline-flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-5
                  text-sm
                  font-semibold
                  text-blue-600
                  transition
                  hover:bg-slate-50
                "
                            >
                                <RotateCcw className="h-5 w-5" />

                                Tentar Novamente
                            </button>

                            <button
                                type="button"
                                onClick={handleViewAnswer}
                                className="
                  inline-flex
                  h-12
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  bg-blue-600
                  px-5
                  text-sm
                  font-semibold
                  text-white
                  shadow-sm
                  transition
                  hover:bg-blue-700
                "
                            >
                                <Eye className="h-5 w-5" />

                                Ver Resposta
                            </button>
                        </>
                    )}

                    {answerRevealed && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="
                col-span-full
                inline-flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
                        >
                            Continuar
                        </button>
                    )}

                    {isPerfectScore && (
                        <button
                            type="button"
                            onClick={
                                onNextChallenge
                                    ? onNextChallenge
                                    : onClose
                            }
                            className="
                col-span-full
                inline-flex
                h-12
                items-center
                justify-center
                gap-2
                rounded-lg
                bg-blue-600
                px-5
                text-sm
                font-semibold
                text-white
                shadow-sm
                transition
                hover:bg-blue-700
              "
                        >
                            Ir para o próximo desafio
                        </button>
                    )}
                </footer>
            </div>
        </div>
    );
}

interface ScoreCardProps {
    score: number;
    maxScore: number;
    percentage: number;
}

function ScoreCard({
    score,
    maxScore,
    percentage,
}: ScoreCardProps) {
    return (
        <section
            className="
        rounded-xl
        border border-slate-200
        bg-white
        p-5
      "
        >
            <p
                className="
          text-xs
          font-semibold
          uppercase
          tracking-[0.12em]
          text-slate-500
        "
            >
                Avaliação Final
            </p>

            <div className="mt-2">
                <span className="text-3xl font-bold text-slate-900">
                    {score.toFixed(1)}

                    <span className="text-lg font-medium text-slate-400">
                        /{maxScore}
                    </span>
                </span>
            </div>

            <div
                className="
          mt-4
          h-2
          overflow-hidden
          rounded-full
          bg-slate-100
        "
            >
                <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                        width: `${percentage}%`,
                    }}
                />
            </div>

            <p className="mt-2 text-sm text-slate-500">
                {getScoreMessage(score, maxScore)}
            </p>
        </section>
    );
}

interface EloCardProps {
    variation: number;
}

function EloCard({ variation }: EloCardProps) {
    const safeVariation = Math.max(0, variation);

    return (
        <section
            className="
        rounded-xl
        border border-slate-200
        bg-white
        p-5
      "
        >
            <p
                className="
          text-xs
          font-semibold
          uppercase
          tracking-[0.12em]
          text-slate-500
        "
            >
                Variação Elo
            </p>

            <div
                className="
          mt-3
          flex
          items-center
          gap-2
          text-emerald-600
        "
            >
                <ArrowUpRight className="h-7 w-7" />

                <span className="text-2xl font-bold">
                    +{safeVariation} ELO
                </span>
            </div>

            <p className="mt-3 text-sm text-slate-500">
                {safeVariation > 0
                    ? "Você ganhou pontos de elo."
                    : "Sua variação de elo foi 0."}
            </p>
        </section>
    );
}

function CutoffMessage() {
    return (
        <section
            className="
        rounded-xl
        border border-amber-200
        bg-amber-50
        p-5
      "
        >
            <h3 className="font-semibold text-amber-800">
                Você ainda não atingiu a nota de corte
            </h3>

            <p
                className="
          mt-2
          text-sm
          leading-6
          text-amber-700
        "
            >
                Sua avaliação ficou abaixo de 7 pontos.
                Revise seu diagnóstico e tente novamente
                para melhorar sua resposta.
            </p>
        </section>
    );
}

function PartialFeedbackMessage() {
    return (
        <section
            className="
        rounded-xl
        border border-blue-100
        bg-blue-50/50
        p-5
      "
        >
            <p
                className="
          text-sm
          font-semibold
          text-blue-700
        "
            >
                Bom trabalho! 👏
            </p>

            <p
                className="
          mt-1
          text-sm
          leading-6
          text-slate-600
        "
            >
                Você identificou parte dos problemas,
                mas ainda faltam alguns pontos.
                Tente novamente ou veja a resposta
                de referência.
            </p>
        </section>
    );
}

interface PointsSectionProps {
    points: FeedbackPoint[];
    detailed: boolean;
}

function PointsSection({
    points,
    detailed,
}: PointsSectionProps) {
    return (
        <FeedbackSection
            icon={<Check className="h-5 w-5 text-emerald-600" />}
            title="Pontos Identificados"
        >
            <div className="space-y-2">
                {points.map((point, index) => {
                    if (!detailed && point.status === "missing") {
                        return (
                            <div
                                key={`${point.title}-${index}`}
                                className="
                  flex
                  items-center
                  gap-3
                  rounded-lg
                  border border-slate-200
                  bg-white
                  px-4 py-3
                "
                            >
                                <span
                                    className="
                    flex h-7 w-7
                    shrink-0
                    items-center justify-center
                    rounded-full
                    bg-slate-100
                    text-sm
                    font-bold
                    text-slate-400
                  "
                                >
                                    ?
                                </span>

                                <span className="text-sm text-slate-400">
                                    ----
                                </span>
                            </div>
                        );
                    }

                    return (
                        <PointItem
                            key={`${point.title}-${index}`}
                            point={point}
                            detailed={detailed}
                        />
                    );
                })}
            </div>
        </FeedbackSection>
    );
}

interface PointItemProps {
    point: FeedbackPoint;
    detailed: boolean;
}

function PointItem({
    point,
    detailed,
}: PointItemProps) {
    const config = {
        correct: {
            icon: Check,
            iconClass: "text-emerald-600",
            bgClass: "bg-emerald-50",
            borderClass: "border-emerald-100",
        },

        wrong: {
            icon: X,
            iconClass: "text-red-500",
            bgClass: "bg-red-50",
            borderClass: "border-red-100",
        },

        missing: {
            icon: () => (
                <span className="font-bold text-slate-400">
                    ?
                </span>
            ),
            iconClass: "text-slate-400",
            bgClass: "bg-slate-50",
            borderClass: "border-slate-200",
        },
    };

    const current = config[point.status];

    const Icon = current.icon;

    return (
        <div
            className={`
        flex
        gap-3
        rounded-lg
        border
        px-4 py-3
        ${current.bgClass}
        ${current.borderClass}
      `}
        >
            <div
                className={`
          flex
          h-7 w-7
          shrink-0
          items-center
          justify-center
          rounded-full
          bg-white
          ${current.iconClass}
        `}
            >
                <Icon className="h-4 w-4" />
            </div>

            <div className="min-w-0">
                <p
                    className={`
            text-sm
            font-semibold
            ${point.status === "wrong"
                            ? "text-red-700"
                            : point.status === "correct"
                                ? "text-emerald-700"
                                : "text-slate-600"
                        }
          `}
                >
                    {point.title}
                </p>

                {detailed && point.description && (
                    <p
                        className="
              mt-1
              text-sm
              leading-6
              text-slate-600
            "
                    >
                        {point.description}
                    </p>
                )}
            </div>
        </div>
    );
}

interface FeedbackSectionProps {
    title: string;
    icon: ReactNode;
    action?: ReactNode;
    children: ReactNode;
}

function FeedbackSection({
    title,
    icon,
    action,
    children,
}: FeedbackSectionProps) {
    return (
        <section
            className="
        rounded-xl
        border border-slate-200
        bg-white
        p-5
      "
        >
            <div
                className="
          mb-4
          flex
          flex-col
          gap-3
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
            >
                <div className="flex items-center gap-2">
                    {icon}

                    <h3
                        className="
              text-sm
              font-bold
              uppercase
              tracking-[0.1em]
              text-slate-600
            "
                    >
                        {title}
                    </h3>
                </div>

                {action}
            </div>

            {children}
        </section>
    );
}

interface CodeCardProps {
    title: string;
    icon: ReactNode;
    code: string;
    senior?: boolean;
}

function CodeCard({
    title,
    icon,
    code,
    senior = false,
}: CodeCardProps) {
    return (
        <div
            className="
        overflow-hidden
        rounded-lg
        border border-slate-200
      "
        >
            <div
                className="
          flex
          items-center
          gap-2
          border-b border-slate-200
          bg-slate-50
          px-4 py-3
        "
            >
                <span
                    className={
                        senior
                            ? "text-amber-500"
                            : "text-slate-500"
                    }
                >
                    {icon}
                </span>

                <span
                    className="
            text-xs
            font-bold
            uppercase
            tracking-[0.08em]
            text-slate-500
          "
                >
                    {title}
                </span>
            </div>

            <div
                className="
          max-h-72
          overflow-auto
          bg-white
          p-4
        "
            >
                <pre
                    className="
            font-mono
            text-xs
            leading-6
            text-slate-700
          "
                >
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}

interface DifficultyBadgeProps {
    difficulty: "EASY" | "MEDIUM" | "HARD";
}

function DifficultyBadge({
    difficulty,
}: DifficultyBadgeProps) {
    const styles = {
        EASY:
            "border-emerald-200 bg-emerald-50 text-emerald-700",

        MEDIUM:
            "border-amber-200 bg-amber-50 text-amber-700",

        HARD:
            "border-red-200 bg-red-50 text-red-700",
    };

    return (
        <span
            className={`
        rounded
        border
        px-2 py-0.5
        text-[10px]
        font-bold
        uppercase
        tracking-wide
        ${styles[difficulty]}
      `}
        >
            {difficulty}
        </span>
    );
}

function getScoreMessage(
    score: number,
    maxScore: number,
): string {
    const percentage =
        (score / maxScore) * 100;

    if (percentage >= 100) {
        return "Excelente! Você identificou todos os pontos.";
    }

    if (percentage >= 70) {
        return "Bom trabalho! Você identificou boa parte dos problemas.";
    }

    return "Continue praticando e evoluindo.";
}