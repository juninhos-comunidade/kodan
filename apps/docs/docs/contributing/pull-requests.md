---
sidebar_position: 3
title: Fluxo de contribuição e PR
---

# Fluxo de contribuição e PR

## Antes de começar

1. Abra uma branch com um objetivo pequeno e claro.
2. Identifique a camada correta no [mapa de arquitetura](./architecture).
3. Evite misturar refatoração ampla, mudança visual e conteúdo sem relação no mesmo PR.

## Fluxos por tipo de mudança

### Interface React

- Mantenha componentes específicos em `apps/web`.
- Extraia para `packages/ui` apenas quando houver reutilização real.
- Verifique estados de teclado, foco, responsividade e contraste.
- Atualize [Aplicação e rotas](../application) se mudar a jornada, uma rota ou a navegação global.

### API e dados

- Atualize schema, contratos Zod e handlers de forma coerente.
- Gere novamente OpenAPI após alterar contratos HTTP.
- Não retorne soluções de desafios antes do momento de feedback definido pelo produto.

### Conteúdo de treino

- Use `content/challenges` para desafios que já podem aparecer no catálogo público. Sem rubrica válida, eles permanecem bloqueados como **Em revisão** e não iniciam tentativa, avaliação ou ELO.
- Use o question bank para seeds e material bruto que ainda não possui enunciado, evidência e solução revisáveis no contrato do runtime.
- Só considere um desafio avaliável depois de validar e promover sua rubrica e seus casos editoriais.
- Siga o [guia de autoria](../question-bank/authoring-guide) e valide o banco após alterações.

## Checklist antes do PR

Rode apenas o que for relevante, mas a base para mudanças de código é:

```bash
bun run check-types
bun test
```

Para documentação ou contratos HTTP:

```bash
bun run docs:build
```

Para alterações no banco de perguntas:

```bash
bun run question-bank:validate
```

Para mudanças React, rode também:

```bash
bun run doctor
```

No PR, descreva:

- o problema resolvido;
- a área afetada (web, UI compartilhada, API, dados, conteúdo ou docs);
- como foi validado;
- capturas de tela para mudanças visuais, quando aplicável.

## Convenções práticas

- Não comite `.env`, chaves, bancos locais, resultados de testes ou artefatos de ferramentas.
- Prefira nomes de commit que expressem intenção, por exemplo `feat(challenges): adiciona filtro por status`.
- Preserve compatibilidade de rotas existentes ou documente a migração antes de removê-las.
