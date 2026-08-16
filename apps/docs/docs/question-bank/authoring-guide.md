# Guia do Banco de Perguntas

Guia canonico para criar, revisar e promover seeds do Kodan.

## Uso atual

Este guia e usado para orientar autores humanos e IA na criacao de seeds editoriais em `content/question-bank/`.

Hoje ele nao e uma API de runtime e nao alimenta diretamente a tela de treino. O fluxo atual e:

1. A autoria cria ou ajusta seeds editoriais.
2. `bun run question-bank:generate` gera os arquivos Markdown revisaveis.
3. `bun run question-bank:validate` confere estrutura, secoes obrigatorias e consistencia minima.
4. Quando uma seed possui enunciado, evidencia e solucao revisaveis, ela e promovida manualmente para `content/challenges/` e passa a aparecer no catalogo como **Em revisao**.
5. O desafio so se torna avaliavel depois que a rubrica e os casos editoriais sao validados e promovidos.

## O que este banco e

- `content/question-bank/` guarda seeds editoriais, nao desafios jogaveis finais.
- A fonte de verdade humana fica em `scripts/question-bank/bank-data.ts`.
- Os arquivos Markdown sao artefatos gerados para revisao, curadoria e futura promocao.

## Tipos de pergunta aceitos

### debug

- Runtime type sugerido: `debugging`
- Quando usar: quando o usuario precisa encontrar o erro, explicar impacto e propor fix.
- Cobertura minima:
  - Identificar a causa raiz no snippet
  - Explicar o impacto observavel para o usuario ou para o sistema
  - Propor a correcao minima segura com justificativa

### explain-code

- Runtime type sugerido: `explain-code`
- Quando usar: quando o valor esta em ler o snippet com precisao e explicar seu contrato.
- Cobertura minima:
  - Descrever o que o codigo esta tentando fazer
  - Explicar onde o contrato do codigo termina ou fica fragil
  - Apontar trade-offs, limites ou riscos da abordagem

### explain-concept

- Runtime type sugerido: `explain-concept`
- Quando usar: quando o foco e explicar um principio tecnico usando o snippet como ancora.
- Cobertura minima:
  - Definir o conceito usando o snippet como base
  - Explicar por que esse conceito importa na pratica
  - Conectar o conceito a uma decisao de modelagem ou manutencao

### output-diagnosis

- Runtime type sugerido: `output-diagnosis`
- Quando usar: quando a evidencia principal e uma saida de terminal, erro de compilacao, teste ou divergencia entre esperado e obtido.
- Cobertura minima:
  - Interpretar os sinais presentes na saida sem inventar codigo ausente
  - Relacionar a divergencia a uma causa tecnica plausivel
  - Explicar a correcao ou a proxima verificacao necessaria

### compare-concepts

- Runtime type sugerido: `compare-concepts`
- Quando usar: quando o praticante precisa distinguir duas estruturas, mecanismos ou decisoes tecnicas.
- Cobertura minima:
  - Definir a diferenca central sem depender de palavras-chave decoradas
  - Explicar quando cada alternativa participa do runtime ou da modelagem
  - Conectar a comparacao a uma decisao pratica

### behavior-validation

- Runtime type sugerido: `behavior-validation`
- Quando usar: quando o codigo pode estar correto e o desafio pede que o praticante valide uma afirmacao, inclusive como pegadinha editorial.
- Cobertura minima:
  - Declarar se a afirmacao procede
  - Justificar o veredito com o contrato observavel
  - Explicar o limite em que o comportamento mudaria

## Regras editoriais

- Portugues por padrao.
- Evidencia curta, cirurgica e com potencial de expansao. Ela pode ser codigo, terminal ou somente o contexto conceitual.
- A narrativa e independente do formato: descreva o contexto sem afirmar automaticamente que existe um bug.
- Em terminal, use blocos rotulados como `Esperado` e `Obtido` quando houver divergencia observavel.
- O prompt deve pedir raciocinio, nao apenas resposta decorada.
- `Expected Answer Summary` descreve o que uma boa resposta precisa cobrir.
- `Expansion Notes` registra como a seed poderia crescer para um desafio real.

## Fluxo recomendado

1. Escolha `language`, `theme` e `challengeType` antes de escrever o prompt.
2. Escolha `presentation` e escreva a menor evidencia que ancora o raciocinio pedido.
3. Use o checklist canonico do tipo de pergunta, ajustando apenas a redacao do prompt.
4. Rode `bun run question-bank:generate`.
5. Rode `bun run question-bank:validate`.
6. Se a seed evoluir para o catalogo, crie uma pasta em `content/challenges/` com `challenge.json`, `solution.md` e os arquivos exigidos pelo formato.

## Formatos no runtime

- `code`: exige `codeFile`; apresenta o codigo como evidencia principal.
- `code-terminal`: exige `codeFile` e `terminalFile`; permite alternar entre as duas evidencias em abas.
- `terminal`: exige `terminalFile` e nao inventa um arquivo de codigo.
- `concept`: nao exige codigo; apresenta contexto e pergunta no painel principal.

O `challenge.json` deve declarar `language`, `topic`, `presentation`, `intent`, narrativa em `scenario` e a pergunta. Um item sem rubrica valida continua publico no catalogo, mas bloqueado como **Em revisao**. Nessa fase ele nao chama o provedor, nao cria tentativa e nao altera ELO.

## Ponte para runtime

- Seed `debug` promove naturalmente para runtime `debugging`.
- Seed `explain-code` pode virar runtime `explain-code` ou permanecer sem `type` explicito, se o consumidor aceitar o default.
- Seed `explain-concept` vira runtime `explain-concept` quando a avaliacao pede explicacao de principio e trade-off.
- Uma evidencia de terminal promove para `output-diagnosis` quando o praticante precisa interpretar esperado e obtido.
- Uma pergunta sem codigo pode promover para `compare-concepts` no formato `concept`.
- Uma validacao em que o codigo pode estar correto promove para `behavior-validation`.

## Temas atuais

- architecture-and-api-design: 10 seed(s)
- async-and-concurrency: 10 seed(s)
- async-ui-and-races: 5 seed(s)
- component-contracts-and-composition: 5 seed(s)
- derived-state-and-memoization: 5 seed(s)
- effects-and-lifecycle: 5 seed(s)
- generics-and-inference: 10 seed(s)
- state-and-immutability: 10 seed(s)
- state-and-rendering: 5 seed(s)
- types-and-narrowing: 10 seed(s)
