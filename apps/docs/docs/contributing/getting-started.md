---
sidebar_position: 1
title: Primeiros passos
---

# Primeiros passos

Este guia prepara uma contribuição local para o Kodan. O repositório usa **Bun**, um monorepo com workspaces e PostgreSQL via Prisma.

## Pré-requisitos

- Bun 1.3 ou superior;
- Node.js compatível com o Bun usado no projeto;
- PostgreSQL (Neon ou local) apenas para os fluxos integrados que acessam dados e autenticação.

## Instalação

Na raiz do repositório:

```bash
bun install
```

Crie o arquivo de ambiente a partir do exemplo:

```bash
cp apps/web/.env.example apps/web/.env
```

No PowerShell, use:

```powershell
Copy-Item apps/web/.env.example apps/web/.env
```

O modo integrado é o padrão. Para contribuições de interface, ative temporariamente o mock em `apps/web/src/lib/mock-mode.ts`: a aplicação passa a usar desafios, usuário e tentativas em memória, sem PostgreSQL nem Better Auth. Os dados são reiniciados ao parar o servidor. Não envie essa alteração como `true` em um commit.

Para trabalhar com Prisma, banco ou autenticação, mantenha o mock desativado e preencha as variáveis de banco e autenticação. Os valores nunca devem ser enviados em commits.

Veja as limitações e os dados disponíveis no [modo mock local](./mock-mode) antes de usar esse caminho para validar uma contribuição.

## Banco de dados

No modo integrado, depois de configurar `DATABASE_URL` e `DIRECT_URL`, aplique o schema:

```bash
bun run db:push
```

Ao aplicar pela primeira vez o modelo de sessões de tentativa em um banco que
já possui histórico, inspecione e aplique o backfill idempotente:

```bash
bun run db:backfill:attempts
bun run db:backfill:attempts:apply
```

O primeiro comando é somente leitura. O segundo recalcula `attemptNumber` e
`sessionStatus` por praticante e desafio, preservando respostas, feedback e ELO.

## Servidores de desenvolvimento

Para trabalhar apenas na aplicação web:

```bash
bun run dev:web
```

Ela abre em [http://localhost:3001](http://localhost:3001).

Para trabalhar apenas na documentação:

```bash
bun run docs:dev
```

Ela abre em [http://localhost:3002](http://localhost:3002). Esse comando também atualiza a especificação OpenAPI usada pela referência de API.

`bun run dev` inicia todos os workspaces. Prefira os comandos isolados quando for alterar uma única área ou quando as portas já estiverem em uso.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | No modo integrado | Conexão usada pela aplicação. |
| `DIRECT_URL` | Para comandos Prisma | Conexão direta para CLI/migrações. |
| `BETTER_AUTH_SECRET` | No modo integrado | Segredo de autenticação, com ao menos 32 caracteres. |
| `BETTER_AUTH_URL` | No modo integrado | URL pública/local da aplicação, por exemplo `http://localhost:3001`. |
| `CORS_ORIGIN` | No modo integrado | Origem autorizada, normalmente a mesma URL local da aplicação. |
| `OPENROUTER_API_KEY` | Não | Habilita a avaliação integrada; sem ela o envio falha sem registrar tentativa ou alterar ELO. |
| `OPENROUTER_MODEL` | Não | Modelo gratuito fixo (`:free`); padrão validado `google/gemma-4-26b-a4b-it:free`. `openrouter/free` é rejeitado. |
| `EVALUATION_V2_ENABLED` | Não | Ativa a avaliação estruturada V2; padrão `true`. |
| `LEGACY_SQLITE_URL` | Não | Caminho do banco SQLite legado, somente para migração. |
| `GITHUB_CLIENT_ID` | Não | Client ID da aplicação registrada no GitHub OAuth, utilizado para habilitar o login com GitHub. |
| `GITHUB_CLIENT_SECRET` | Não | Client Secret da aplicação registrada no GitHub OAuth, utilizado em conjunto com o GITHUB_CLIENT_ID para autenticar usuários via GitHub. |


## Próximo passo

Leia o [mapa de arquitetura](./architecture) antes de mover código entre `apps`, `packages` ou `content`.
