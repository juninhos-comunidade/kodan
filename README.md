# Kodan

Kodan é uma plataforma de treino para leitura, diagnóstico e explicação de código em TypeScript e React. A pessoa escolhe um desafio, analisa o snippet, envia o diagnóstico e acompanha o feedback e a evolução de ELO.

O repositório é um monorepo Bun com duas aplicações locais: o produto web e a documentação Docusaurus.

## Início rápido

### 1. Pré-requisitos

- [Bun](https://bun.sh/) 1.3 ou superior;
- PostgreSQL apenas para os fluxos integrados com dados e autenticação;
- Git.

### 2. Instale as dependências

```bash
bun install
```

### 3. Configure o ambiente

Crie seu arquivo local a partir do exemplo seguro:

```bash
cp apps/web/.env.example apps/web/.env
```

No PowerShell:

```powershell
Copy-Item apps/web/.env.example apps/web/.env
```

Para desenvolver apenas a interface sem PostgreSQL nem Better Auth, ative temporariamente o mock em `apps/web/src/lib/mock-mode.ts`; nesse caso, os dados vivem apenas na memória. Não envie `apps/web/.env` para o Git.

As limitações e a troca para a integração real estão documentadas em [Modo mock local](apps/docs/docs/contributing/mock-mode.md).

Para trabalhar com banco, autenticação ou Prisma, mantenha o mock desativado e preencha `DATABASE_URL`, `DIRECT_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` e `CORS_ORIGIN`.

### 4. Prepare o banco (somente modo integrado)

```bash
bun run db:push
```

### 5. Inicie as aplicações

Use terminais separados durante o desenvolvimento:

```bash
# Aplicação Kodan
bun run dev:web
```

Abra [http://localhost:3001](http://localhost:3001).

```bash
# Documentação e referência de API
bun run docs:dev
```

Abra [http://localhost:3002](http://localhost:3002).

`bun run docs:dev` gera a especificação OpenAPI antes de iniciar o Docusaurus. Para trabalhar apenas na interface da documentação, sem regenerar a API, use `bun run --filter docs dev`.

> Se uma porta já estiver em uso, finalize o processo que está usando `3001` ou `3002`, ou reutilize o servidor que já está em execução. Evite iniciar `bun run dev` duas vezes.

## Onde começar

| Quero... | Leia / rode |
| --- | --- |
| Entender as telas e rotas | [Aplicação e rotas](apps/docs/docs/application.md) |
| Preparar o ambiente com mais detalhes | [Primeiros passos](apps/docs/docs/contributing/getting-started.md) |
| Entender a separação entre apps, packages e conteúdo | [Mapa de arquitetura](apps/docs/docs/contributing/architecture.md) |
| Abrir um PR | [Fluxo de contribuição](apps/docs/docs/contributing/pull-requests.md) e [CONTRIBUTING.md](CONTRIBUTING.md) |
| Criar ou revisar material editorial | [Guia do banco de perguntas](apps/docs/docs/question-bank/authoring-guide.md) |

## Aplicações locais

| Aplicação | Comando | URL | Papel |
| --- | --- | --- | --- |
| Web | `bun run dev:web` | `http://localhost:3001` | Catálogo, arena de treino, perfil e API Next.js. |
| Docs | `bun run docs:dev` | `http://localhost:3002` | Docusaurus, guias para contribuidores e referência OpenAPI. |

## Estrutura do projeto

```text
apps/
  web/                  # Next.js: interface e Route Handlers HTTP
  docs/                 # Docusaurus e referência OpenAPI
packages/
  ui/                   # Primitives shadcn/ui, estilos e tokens
  db/                   # Prisma, schema e acesso a PostgreSQL
  auth/                 # Better Auth
  env/                  # Validação tipada de variáveis de ambiente
content/
  challenges/           # Desafios já disponíveis para treino
  question-bank/        # Seeds editoriais para curadoria
scripts/                # Geração OpenAPI e rotinas editoriais
```

Regra prática: mantenha código específico da aplicação em `apps/web`; extraia para `packages/ui` apenas o que for realmente reutilizável; use `content/challenges` para desafios jogáveis e `content/question-bank` para material editorial ainda não promovido.

## Variáveis de ambiente

| Variável | Necessária | Finalidade |
| --- | --- | --- |
| `DATABASE_URL` | No modo integrado | Conexão usada pela aplicação. |
| `DIRECT_URL` | Para Prisma | Conexão direta para schema e migrações. |
| `BETTER_AUTH_SECRET` | No modo integrado | Segredo com pelo menos 32 caracteres. |
| `BETTER_AUTH_URL` | No modo integrado | URL da aplicação, normalmente `http://localhost:3001`. |
| `CORS_ORIGIN` | No modo integrado | Origem autorizada, normalmente a mesma URL local. |
| `OPENROUTER_API_KEY` | Não | Habilita a avaliação integrada; sem ela o envio falha sem registrar tentativa ou alterar ELO. |
| `OPENROUTER_MODEL` | Não | Modelo gratuito fixo (`:free`); padrão validado `google/gemma-4-26b-a4b-it:free`. `openrouter/free` é rejeitado. |
| `EVALUATION_V2_ENABLED` | Não | Ativa a avaliação estruturada V2; padrão `true`. |
| `LEGACY_SQLITE_URL` | Não | Caminho do banco legado para migração. |

## Comandos úteis

| Comando | O que faz |
| --- | --- |
| `bun run dev:web` | Inicia somente o Next.js na porta 3001. |
| `bun run docs:dev` | Gera OpenAPI e inicia o Docusaurus na porta 3002. |
| `bun run dev` | Inicia todos os workspaces. Use quando as portas estiverem livres. |
| `bun run docs:build` | Gera OpenAPI e cria a documentação estática. |
| `bun run check-types` | Verifica os tipos dos workspaces. |
| `bun test` | Executa os testes Bun. |
| `bun run doctor` | Executa o React Doctor. |
| `bun run db:push` | Aplica o schema Prisma no banco configurado. |
| `bun run db:backfill:attempts` | Mostra quantas tentativas antigas precisam da classificação de sessão. |
| `bun run db:backfill:attempts:apply` | Recalcula e persiste número/status das tentativas antigas. |
| `bun run db:studio` | Abre o Prisma Studio. |
| `bun run question-bank:generate` | Regenera os artefatos editoriais. |
| `bun run question-bank:validate` | Valida estrutura e consistência do banco de perguntas. |

## Antes de abrir um PR

Para mudanças de código:

```bash
bun run check-types
bun test
```

Para alterações em Docs, contratos HTTP ou OpenAPI:

```bash
bun run docs:build
```

Para alterações React, rode também:

```bash
bun run doctor
```

Veja o [guia de contribuição](CONTRIBUTING.md) para os fluxos de interface, API, dados e conteúdo.
