import { describe, expect, mock, test } from "bun:test";

import { createOpenRouterEvaluator } from "./openrouter-evaluator";

describe("createOpenRouterEvaluator", () => {
  test("retorna falha de configuração sem chamar a rede quando a chave está ausente", async () => {
    const fetchImplementation = mock(async () => new Response());
    const evaluator = createOpenRouterEvaluator({
      apiKey: undefined,
      model: "modelo-fixo",
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "Uma explicação tecnicamente válida.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor não é alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(result).toEqual({
      ok: false,
      reason: "MISSING_CONFIGURATION",
      retryable: false,
    });
    expect(fetchImplementation).not.toHaveBeenCalled();
  });

  test("retorna a avaliação estruturada recebida do provider", async () => {
    const evaluation = {
      status: "VALID" as const,
      centralCorrectness: 80,
      technicalReasoning: 70,
      technicalPrecision: 90,
      conceptAssessments: [
        {
          conceptId: "constant-value",
          state: "MATCHED" as const,
          evidence: "Explicou que o valor não muda.",
        },
      ],
      misconceptionIds: [],
      decisionRationale: "A resposta cobre o comportamento central.",
    };
    const fetchImplementation = mock(async () =>
      Response.json({
        id: "generation-1",
        choices: [{ message: { content: JSON.stringify(evaluation) } }],
      })
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      promptVersion: "1.0.0",
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor é constante e não sofre alterações.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor não é alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(result).toMatchObject({
      ok: true,
      evaluation,
      metadata: {
        mechanism: "OPENROUTER",
        model: "modelo-fixo",
        promptVersion: "1.0.0",
        rubricVersion: "1.0.0",
        requestId: "generation-1",
      },
    });
  });

  test("normaliza somente um bloco markdown que contenha JSON estruturalmente valido", async () => {
    const evaluation = {
      status: "VALID" as const,
      centralCorrectness: 90,
      technicalReasoning: 85,
      technicalPrecision: 85,
      conceptAssessments: [{
        conceptId: "constant-value",
        state: "MATCHED" as const,
        evidence: "Explicou que o valor não muda.",
      }],
      misconceptionIds: [],
      decisionRationale: "Cobriu o conceito.",
    };
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      fetchImplementation: async () => Response.json({
        choices: [{ message: { content: `\`\`\`json\n${JSON.stringify(evaluation)}\n\`\`\`` } }],
      }),
    });

    const result = await evaluator.evaluate({
      challenge: { id: "challenge-1", title: "Desafio", question: "Explique.", code: "const value = 1;" },
      userAnswer: "O valor não muda.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [{
          id: "constant-value",
          importance: "critical",
          internalDescription: "O valor não é alterado.",
          publicLabel: "A estabilidade do valor.",
        }],
      },
    });

    expect(result).toMatchObject({ ok: true, evaluation });
  });

  test("recupera uma unica resposta estrutural invalida antes de desistir", async () => {
    const telemetryEvents: Array<Record<string, unknown>> = [];
    const evaluation = {
      status: "VALID" as const,
      centralCorrectness: 90,
      technicalReasoning: 85,
      technicalPrecision: 85,
      conceptAssessments: [{
        conceptId: "constant-value",
        state: "MATCHED" as const,
        evidence: "Explicou que o valor nao muda.",
      }],
      misconceptionIds: [],
      decisionRationale: "Cobriu o conceito.",
    };
    const responses = [
      Response.json({
        choices: [{
          message: {
            content: JSON.stringify({
              ...evaluation,
              additionalProperties: false,
            }),
          },
        }],
      }),
      Response.json({
        id: "generation-repaired",
        choices: [{ message: { content: JSON.stringify(evaluation) } }],
      }),
    ];
    const fetchImplementation = mock(async () => responses.shift() ?? new Response());
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      telemetry: (event: Record<string, unknown>) => telemetryEvents.push(event),
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique.",
        code: "const value = 1;",
      },
      userAnswer: "O valor nao muda.",
      attemptNumber: 2,
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [{
          id: "constant-value",
          importance: "critical",
          internalDescription: "O valor nao e alterado.",
          publicLabel: "A estabilidade do valor.",
        }],
      },
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({
      ok: true,
      evaluation,
      metadata: { requestId: "generation-repaired" },
    });
    expect(telemetryEvents).toMatchObject([
      {
        name: "attempt_evaluation_schema_rejected",
        challengeId: "challenge-1",
        attemptNumber: 2,
        model: "modelo-fixo",
        rubricVersion: "1.0.0",
        failureReason: "INVALID_EVALUATION",
      },
      {
        name: "attempt_evaluation_retried",
        challengeId: "challenge-1",
        attemptNumber: 2,
        failureReason: "INVALID_EVALUATION",
      },
    ]);
    expect(JSON.stringify(telemetryEvents)).not.toContain("O valor nao muda.");
  });

  test("rejeita avaliação que tenta fornecer a nota final", async () => {
    const fetchImplementation = mock(
      async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: "VALID",
                centralCorrectness: 100,
                technicalReasoning: 100,
                technicalPrecision: 100,
                conceptAssessments: [
                  {
                    conceptId: "constant-value",
                    state: "MATCHED",
                    evidence: "Reconheceu o valor constante.",
                  },
                ],
                misconceptionIds: [],
                decisionRationale: "Resposta correta.",
                score: 10,
              }),
            },
          },
        ],
      }),
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor é constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor não é alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(result).toEqual({
      ok: false,
      reason: "INVALID_EVALUATION",
      retryable: false,
    });
  });

  test("exige saída estruturada de um endpoint compatível", async () => {
    const fetchImplementation = mock(
      async (_input: RequestInfo | URL, _init?: RequestInit) => Response.json({
        choices: [
          {
            message: {
              content: JSON.stringify({
                status: "VALID",
                centralCorrectness: 80,
                technicalReasoning: 70,
                technicalPrecision: 90,
                conceptAssessments: [
                  {
                    conceptId: "constant-value",
                    state: "MATCHED",
                    evidence: "Reconheceu o valor constante.",
                  },
                ],
                misconceptionIds: [],
                decisionRationale: "Resposta correta.",
              }),
            },
          },
        ],
      }),
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      fetchImplementation,
    });

    await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor é constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor não é alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    const request = fetchImplementation.mock.calls[0]?.[1];
    const body = JSON.parse(String(request?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      temperature: 0,
      stream: false,
      max_tokens: 2400,
      reasoning: { effort: "low", exclude: true },
      provider: { require_parameters: true },
      response_format: {
        type: "json_schema",
        json_schema: {
          strict: true,
        },
      },
    });
  });

  test("classifica ausencia de rota compativel como modelo indisponivel", async () => {
    const fetchImplementation = mock(async () =>
      new Response(null, { status: 404 }),
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      maxRetries: 0,
      fetchImplementation,
    });

    expect(await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor permanece constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [{
          id: "constant-value",
          importance: "critical",
          internalDescription: "O valor não é alterado.",
          publicLabel: "A estabilidade do valor.",
        }],
      },
    })).toEqual({
      ok: false,
      reason: "MODEL_UNAVAILABLE",
      retryable: false,
    });
  });

  test("repete uma vez uma falha transitoria e classifica o provider indisponivel", async () => {
    const fetchImplementation = mock(async () =>
      new Response(null, { status: 503 }),
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor e constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor nao e alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      ok: false,
      reason: "MODEL_UNAVAILABLE",
      retryable: true,
    });
  });

  test("respeita Retry-After dentro do limite antes da unica repeticao", async () => {
    const sleepImplementation = mock(async (_milliseconds: number) => undefined);
    const telemetryEvents: Array<Record<string, unknown>> = [];
    const fetchImplementation = mock(async () =>
      new Response(null, {
        status: 429,
        headers: { "Retry-After": "0.01" },
      }),
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      maxRetryDelayMs: 100,
      sleepImplementation,
      telemetry: (event: Record<string, unknown>) => telemetryEvents.push(event),
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor e constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor nao e alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(sleepImplementation).toHaveBeenCalledTimes(1);
    expect(sleepImplementation).toHaveBeenCalledWith(10);
    expect(result).toEqual({
      ok: false,
      reason: "RATE_LIMIT",
      retryable: true,
    });
    expect(telemetryEvents).toMatchObject([{
      name: "attempt_evaluation_retried",
      challengeId: "challenge-1",
      attemptNumber: 1,
      failureReason: "RATE_LIMIT",
      retryable: true,
    }]);
  });

  test("nao repete falha de autenticacao", async () => {
    const fetchImplementation = mock(async () =>
      new Response(null, { status: 401 }),
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor e constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor nao e alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(fetchImplementation).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: false,
      reason: "AUTHENTICATION",
      retryable: false,
    });
  });

  test("cancela a chamada no timeout e permite nova tentativa do usuario", async () => {
    const fetchImplementation = mock(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("aborted", "AbortError"));
          });
        }),
    );
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      timeoutMs: 5,
      maxRetries: 0,
      fetchImplementation,
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor e constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor nao e alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(result).toEqual({
      ok: false,
      reason: "TIMEOUT",
      retryable: true,
    });
  });

  test("trata corpo nao JSON como resposta invalida sem lancar excecao", async () => {
    const evaluator = createOpenRouterEvaluator({
      apiKey: "test-key",
      model: "modelo-fixo",
      fetchImplementation: mock(async () =>
        new Response("pagina de erro", {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        }),
      ),
    });

    const result = await evaluator.evaluate({
      challenge: {
        id: "challenge-1",
        title: "Desafio",
        question: "Explique o comportamento.",
        code: "const value = 1;",
      },
      userAnswer: "O valor e constante.",
      rubric: {
        version: "1.0.0",
        questionKind: "explain-code",
        centralAnswer: "O valor permanece constante.",
        concepts: [
          {
            id: "constant-value",
            importance: "critical",
            internalDescription: "O valor nao e alterado.",
            publicLabel: "A estabilidade do valor.",
          },
        ],
      },
    });

    expect(result).toEqual({
      ok: false,
      reason: "INVALID_PROVIDER_RESPONSE",
      retryable: false,
    });
  });
});
