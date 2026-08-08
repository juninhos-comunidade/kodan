import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  extendZodWithOpenApi,
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

const {
  apiErrorSchema,
  attemptSchema,
  attemptsResponseSchema,
  challengeResponseSchema,
  challengesResponseSchema,
  currentUserResponseSchema,
  listChallengesQuerySchema,
  productEventSchema,
  submitAttemptResponseSchema,
  submitAttemptSchema,
  updateCurrentUserSchema,
} = await import("../apps/web/src/server/api/schemas");

const outputPath = path.resolve("apps/docs/static/openapi.json");

const registry = new OpenAPIRegistry();

const ApiError = registry.register("ApiError", apiErrorSchema);
const CurrentUserResponse = registry.register(
  "CurrentUserResponse",
  currentUserResponseSchema,
);
const ChallengesResponse = registry.register(
  "ChallengesResponse",
  challengesResponseSchema,
);
const ChallengeResponse = registry.register(
  "ChallengeResponse",
  challengeResponseSchema,
);
const SubmitAttemptResponse = registry.register(
  "SubmitAttemptResponse",
  submitAttemptResponseSchema,
);
const AttemptsResponse = registry.register(
  "AttemptsResponse",
  attemptsResponseSchema,
);
const UpdateCurrentUserInput = registry.register(
  "UpdateCurrentUserInput",
  updateCurrentUserSchema,
);
const SubmitAttemptInput = registry.register(
  "SubmitAttemptInput",
  submitAttemptSchema,
);
const ProductEventInput = registry.register(
  "ProductEventInput",
  productEventSchema,
);
const ChallengePathParams = registry.register(
  "ChallengePathParams",
  z.object({
    id: z.string().min(1),
  }),
);
registry.register("Attempt", attemptSchema);

const jsonContent = (schema: unknown) => ({
  "application/json": {
    schema,
  },
});

const errorResponses = {
  400: {
    description: "Payload ou parâmetros inválidos.",
    content: jsonContent(ApiError),
  },
  500: {
    description: "Erro interno ao processar a requisição.",
    content: jsonContent(ApiError),
  },
};

registry.registerPath({
  method: "post",
  path: "/api/product-events",
  tags: ["Product events"],
  summary: "Registrar evento agregado da jornada pública",
  description:
    "Aceita somente eventos de baixa cardinalidade e não recebe identificadores de praticante nem conteúdo de respostas.",
  request: {
    body: {
      content: jsonContent(ProductEventInput),
    },
  },
  responses: {
    204: { description: "Evento agregado registrado." },
    400: errorResponses[400],
    500: errorResponses[500],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/me",
  tags: ["Me"],
  summary: "Obter usuário atual",
  description:
    "Retorna o usuário autenticado ou o usuário local padrão usado no MVP.",
  responses: {
    200: {
      description: "Usuário atual.",
      content: jsonContent(CurrentUserResponse),
    },
    500: errorResponses[500],
  },
});

registry.registerPath({
  method: "patch",
  path: "/api/me",
  tags: ["Me"],
  summary: "Atualizar perfil do usuário atual",
  request: {
    body: {
      content: jsonContent(UpdateCurrentUserInput),
    },
  },
  responses: {
    200: {
      description: "Perfil atualizado.",
      content: jsonContent(CurrentUserResponse),
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/me/attempts",
  tags: ["Attempts"],
  summary: "Listar tentativas do usuário atual",
  responses: {
    200: {
      description: "Histórico de tentativas do usuário atual.",
      content: jsonContent(AttemptsResponse),
    },
    500: errorResponses[500],
  },
});

registry.registerPath({
  method: "get",
  path: "/api/challenges",
  tags: ["Challenges"],
  summary: "Listar desafios",
  request: {
    query: listChallengesQuerySchema,
  },
  responses: {
    200: {
      description: "Página de desafios com progresso do usuário atual.",
      content: jsonContent(ChallengesResponse),
    },
    ...errorResponses,
  },
});

registry.registerPath({
  method: "get",
  path: "/api/challenges/{id}",
  tags: ["Challenges"],
  summary: "Obter desafio por ID",
  request: {
    params: ChallengePathParams,
  },
  responses: {
    200: {
      description: "Detalhe do desafio.",
      content: jsonContent(ChallengeResponse),
    },
    404: {
      description: "Desafio não encontrado.",
      content: jsonContent(ApiError),
    },
    500: errorResponses[500],
  },
});

registry.registerPath({
  method: "post",
  path: "/api/challenges/{id}/attempts",
  tags: ["Attempts"],
  summary: "Submeter tentativa de desafio",
  request: {
    params: ChallengePathParams,
    body: {
      content: jsonContent(SubmitAttemptInput),
    },
  },
  responses: {
    201: {
      description: "Tentativa registrada e avaliada.",
      content: jsonContent(SubmitAttemptResponse),
    },
    400: errorResponses[400],
    404: {
      description: "Desafio não encontrado.",
      content: jsonContent(ApiError),
    },
    500: errorResponses[500],
  },
});

const generator = new OpenApiGeneratorV3(registry.definitions, {
  sortComponents: "alphabetically",
});

const productDocument = generator.generateDocument({
  openapi: "3.0.3",
  info: {
    title: "Kodan API",
    version: "0.1.0",
    description:
      "API HTTP documentável do Kodan, gerada a partir dos schemas Zod usados pelos Route Handlers.",
  },
  servers: [
    {
      url: "http://localhost:3001",
      description: "Next.js local",
    },
  ],
  tags: [
    { name: "Auth", description: "Endpoints gerados pelo Better Auth." },
    { name: "Me", description: "Usuário atual e perfil local." },
    { name: "Challenges", description: "Catálogo e detalhe dos desafios." },
    { name: "Attempts", description: "Submissões e histórico de tentativas." },
    { name: "Product events", description: "Métricas agregadas da jornada pública." },
  ],
});

const authDocument = await generateBetterAuthDocument();
const document = authDocument
  ? mergeOpenApiDocuments(productDocument, authDocument)
  : productDocument;

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`);

console.log(`OpenAPI spec generated at ${outputPath}`);

async function generateBetterAuthDocument() {
  process.env.DATABASE_URL ??= "postgresql://kodan:kodan@localhost:5432/kodan";
  process.env.BETTER_AUTH_SECRET ??=
    "kodan-local-openapi-placeholder-secret";
  process.env.BETTER_AUTH_URL ??= "http://localhost:3001";
  process.env.CORS_ORIGIN ??= "http://localhost:3001";

  try {
    const { auth } = await import("../packages/auth/src/index");
    const maybeGenerate = auth.api.generateOpenAPISchema;

    if (typeof maybeGenerate !== "function") {
      return null;
    }

    return (await maybeGenerate()) as Record<string, unknown>;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`Better Auth OpenAPI schema skipped: ${message}`);
    return null;
  }
}

function mergeOpenApiDocuments(
  product: Record<string, any>,
  auth: Record<string, any>,
) {
  const authComponents = auth.components ?? {};
  const productComponents = product.components ?? {};

  return {
    ...product,
    paths: {
      ...prefixAuthPaths(auth.paths ?? {}),
      ...(product.paths ?? {}),
    },
    components: {
      ...authComponents,
      ...productComponents,
      schemas: {
        ...(authComponents.schemas ?? {}),
        ...(productComponents.schemas ?? {}),
      },
      securitySchemes: {
        ...(authComponents.securitySchemes ?? {}),
        ...(productComponents.securitySchemes ?? {}),
      },
    },
  };
}

function prefixAuthPaths(paths: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(paths).map(([route, definition]) => {
      const prefixedRoute = route.startsWith("/api/auth/")
        ? route
        : `/api/auth${route.startsWith("/") ? route : `/${route}`}`;

      return [prefixedRoute, definition];
    }),
  );
}
