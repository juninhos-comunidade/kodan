import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  readChallengesFromContent,
  syncChallengesIndexFromContent,
} from "@kodan/content/promoted-challenge-catalog";

type Difficulty = "EASY" | "MEDIUM" | "HARD";

type ChallengeTemplateData = {
  id: string;
  category: string;
  title: string;
  difficulty: Difficulty;
  recommendedElo: number;
  tags: string[];
  code: string;
  question: string;
  solution: string;
};

const targetTotal = 50;

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function getCandidateRoots() {
  return [
    path.resolve(process.cwd(), "content", "challenges"),
    path.resolve(process.cwd(), "..", "..", "content", "challenges"),
    path.resolve(moduleDir, "..", "..", "..", "content", "challenges"),
  ];
}

async function resolveContentRoot() {
  for (const candidate of getCandidateRoots()) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      continue;
    }
  }

  throw new Error("Pasta de conteúdo não encontrada em /content/challenges");
}

const easyScenarios = [
  { topic: "filtro de produtos", hook: "useMemo", bug: "falta de dependência em `searchTerm`", api: "products" },
  { topic: "lista de alunos", hook: "useEffect", bug: "dependência de objeto recriado a cada render", api: "students" },
  { topic: "contador de notificações", hook: "useEffect", bug: "stale closure no `setInterval`", api: "notifications" },
  { topic: "painel de pedidos", hook: "useState", bug: "mutação direta do estado antes do `setState`", api: "orders" },
  { topic: "grade de tickets", hook: "useEffect", bug: "listener sem cleanup", api: "tickets" },
  { topic: "timeline de eventos", hook: "useMemo", bug: "cálculo caro sem memoização correta", api: "events" },
  { topic: "ranking de jogadores", hook: "useCallback", bug: "callback recriado e quebra memo do filho", api: "players" },
  { topic: "feed de artigos", hook: "useEffect", bug: "fetch dispara em loop por dependência instável", api: "articles" },
  { topic: "carrinho de compras", hook: "useState", bug: "atualização baseada em estado antigo", api: "cart" },
  { topic: "agenda de entrevistas", hook: "useEffect", bug: "race condition ao trocar filtros rápido", api: "interviews" },
  { topic: "lista de tarefas", hook: "useMemo", bug: "ordenação mutando array original", api: "tasks" },
  { topic: "dashboard financeiro", hook: "useEffect", bug: "falta tratamento de erro e loading preso", api: "finance" },
  { topic: "catálogo de cursos", hook: "useEffect", bug: "estado setado após unmount", api: "courses" },
  { topic: "monitor de deploy", hook: "useRef", bug: "acesso a ref sem null-check", api: "deploys" },
  { topic: "tabela de usuários", hook: "useEffect", bug: "request duplicada em Strict Mode sem idempotência", api: "users" },
] as const;

const mediumScenarios = [
  { topic: "busca incremental de clientes", pair: "stale closure + debounce mal implementado", api: "customers" },
  { topic: "sincronização de perfil", pair: "race condition + falta de cancelamento de request", api: "profiles" },
  { topic: "wizard de checkout", pair: "estado derivado redundante + inconsistência entre steps", api: "checkout" },
  { topic: "filtro avançado de logs", pair: "dependências incompletas + memo inválido", api: "logs" },
  { topic: "chat de suporte", pair: "listener duplicado + closure obsoleta na fila", api: "support-chat" },
  { topic: "painel de métricas", pair: "polling sem cleanup + setState em componente desmontado", api: "metrics" },
  { topic: "grade de permissões", pair: "mutação de objeto aninhado + render não dispara", api: "permissions" },
  { topic: "upload de arquivos", pair: "estado de progresso sobrescrito + concorrência", api: "uploads" },
  { topic: "lista paginada de vendas", pair: "merge incorreto de páginas + chave instável", api: "sales" },
  { topic: "resumo de assinaturas", pair: "callback instável + re-render cascata", api: "subscriptions" },
  { topic: "monitor de filas", pair: "intervalo sem atualização funcional + drift de estado", api: "queues" },
  { topic: "editor colaborativo", pair: "aplicação de patch fora de ordem + condição de corrida", api: "docs" },
  { topic: "painel de SLA", pair: "normalização cara em cada render + dependências erradas", api: "sla" },
  { topic: "timeline de auditoria", pair: "filtro por data inconsistente + timezone ignorado", api: "audit" },
  { topic: "resumo de faturamento", pair: "cache local desatualizado + efeito com deps incompletas", api: "billing" },
  { topic: "feed de recomendações", pair: "prefetch redundante + invalidação ausente", api: "recommendations" },
  { topic: "triagem de incidentes", pair: "estado compartilhado mutável + sorting não determinístico", api: "incidents" },
] as const;

const hardScenarios = [
  { topic: "dashboard operacional", problems: "race condition, stale closure e mutação de estado", api: "operations" },
  { topic: "painel de atendimento em tempo real", problems: "leak de listeners, key instável e rollback incorreto", api: "realtime-support" },
  { topic: "motor de busca interno", problems: "debounce quebrado, cache incoerente e resposta fora de ordem", api: "internal-search" },
  { topic: "orquestrador de deploy", problems: "polling sem cancelamento, derived state duplicado e retry infinito", api: "orchestrator" },
  { topic: "backoffice de pagamentos", problems: "otimistic update sem compensação e reconciliação inconsistente", api: "payments" },
  { topic: "monitor de fraude", problems: "memo inválido, objeto de dependência instável e regra stale", api: "fraud" },
  { topic: "console de feature flags", problems: "sync bidirecional mal definido, colisão de updates e perda de evento", api: "feature-flags" },
  { topic: "gestão de inventário", problems: "concorrência em lotes, deduplicação fraca e key de lista incorreta", api: "inventory" },
  { topic: "pipeline de aprovação", problems: "efeitos encadeados sem isolamento, rollback parcial e estado fantasma", api: "approvals" },
  { topic: "painel de observabilidade", problems: "normalização O(n²), stale cache e atualizações fora de transição", api: "observability" },
  { topic: "hub de integrações", problems: "erros silenciosos, retries duplicados e tearing visual", api: "integrations" },
  { topic: "sistema de agendamento", problems: "timezone drift, race em refetch e invalidação incompleta", api: "scheduling" },
  { topic: "controle de comissões", problems: "cálculo não determinístico, mutação oculta e dependências quebradas", api: "commissions" },
  { topic: "mesa de operações financeiras", problems: "ordenação instável, snapshot stale e concorrência de submit", api: "trading-desk" },
  { topic: "central de incidentes críticos", problems: "fan-out sem cleanup, duplicidade de eventos e reconciliação tardia", api: "critical-incidents" },
] as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildEasyChallenge(item: (typeof easyScenarios)[number], index: number): ChallengeTemplateData {
  const base = `react-easy-${slugify(item.topic)}-${index + 1}`;
  const id = base;
  const category = "react-interview/easy";
  const title = `Entrevista: Diagnóstico rápido em ${item.topic}`;
  const code = `import React, { useEffect, useMemo, useState } from "react";

type Row = { id: string; name: string; score: number };

export function ${`EasyCase${index + 1}`}() {
  const [rows, setRows] = useState<Row[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/${item.api}")
      .then(r => r.json())
      .then(data => setRows(data))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return rows.filter(row => row.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [rows]);

  const addOne = () => {
    if (rows.length === 0) return;
    rows[0].score = rows[0].score + 1;
    setRows(rows);
  };

  if (loading) return <p>Carregando...</p>;
  return (
    <div>
      <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      <button onClick={addOne}>+1 primeiro</button>
      <ul>{filtered.map(row => <li key={row.id}>{row.name} - {row.score}</li>)}</ul>
    </div>
  );
}
`;

  const question = [
    `Você está em uma entrevista técnica e recebeu este componente de ${item.topic}.`,
    `Explique por que ele apresenta comportamento incorreto em produção.`,
    `Na sua resposta, cubra:`,
    `1) o erro principal envolvendo ${item.hook};`,
    `2) como o bug impacta a saída observável para o usuário;`,
    `3) a correção mínima segura com código.`,
  ].join("\n");

  const solution = [
    `### Leitura de Sinais`,
    `O snippet contém dois sintomas clássicos: filtro com memo incompleto e mutação direta de estado.`,
    ``,
    `### Causa Raiz`,
    `- O filtro depende de \`searchTerm\`, mas ele não está no array de dependências do \`useMemo\`.`,
    `- O botão muta \`rows\` diretamente antes do \`setRows(rows)\`; a referência não muda e o React pode não re-renderizar.`,
    ``,
    `### Correção`,
    `- Incluir \`searchTerm\` nas dependências do memo.`,
    `- Atualizar estado de forma imutável: \`setRows(prev => prev.map(...))\`.`,
    ``,
    `### Exemplo de patch`,
    "```tsx",
    "const filtered = useMemo(() => {",
    "  return rows.filter(row => row.name.toLowerCase().includes(searchTerm.toLowerCase()));",
    "}, [rows, searchTerm]);",
    "",
    "const addOne = () => {",
    "  setRows(prev => prev.map((row, i) => i === 0 ? { ...row, score: row.score + 1 } : row));",
    "};",
    "```",
  ].join("\n");

  return {
    id,
    category,
    title,
    difficulty: "EASY",
    recommendedElo: 1100 + (index % 5) * 40,
    tags: ["interview", "react", "debugging", "hooks", "state"],
    code,
    question,
    solution,
  };
}

function buildMediumChallenge(item: (typeof mediumScenarios)[number], index: number): ChallengeTemplateData {
  const base = `react-medium-${slugify(item.topic)}-${index + 1}`;
  const id = base;
  const category = "react-interview/medium";
  const title = `Entrevista: análise de causa raiz em ${item.topic}`;
  const code = `import React, { useEffect, useMemo, useState } from "react";

type Item = { id: string; label: string; updatedAt: number };

export function ${`MediumCase${index + 1}`}({ teamId }: { teamId: string }) {
  const [items, setItems] = useState<Item[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const options = { teamId, query };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch("/api/${item.api}?teamId=" + options.teamId + "&q=" + options.query)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setItems(data.items);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [options]);

  const top = useMemo(() => {
    return items.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5);
  }, [items]);

  return (
    <section>
      <input value={query} onChange={e => setQuery(e.target.value)} />
      {loading ? <p>Carregando...</p> : null}
      <ul>
        {top.map((item, idx) => (
          <li key={idx}>{item.label}</li>
        ))}
      </ul>
    </section>
  );
}
`;

  const question = [
    `Cenário de entrevista: o time reporta comportamento intermitente em ${item.topic}.`,
    `Você deve explicar a causa raiz e priorizar o que corrigir primeiro.`,
    `Mostre no mínimo três problemas no código, incluindo ${item.pair}.`,
    `Depois proponha um plano de correção incremental com justificativa técnica.`,
  ].join("\n");

  const solution = [
    `### Problemas Encontrados`,
    `1. Dependência instável (\`options\`) no \`useEffect\` causa refetch em todo render.`,
    `2. \`items.sort(...)\` muta o array de estado e cria efeitos colaterais invisíveis.`,
    `3. Uso de \`key={idx}\` pode associar linha errada após reordenação.`,
    ``,
    `### Correção Prioritária`,
    `- Primeiro estabilizar o gatilho de fetch usando dependências primitivas (\`teamId\`, \`query\`).`,
    `- Depois tornar ordenação imutável: \`[...items].sort(...)\`.`,
    `- Por fim corrigir chave para \`item.id\`.`,
    ``,
  ].join("\n");

  return {
    id,
    category,
    title,
    difficulty: "MEDIUM",
    recommendedElo: 1350 + (index % 6) * 50,
    tags: ["interview", "react", "diagnosis", "race-condition", "state-management"],
    code,
    question,
    solution,
  };
}

function buildHardChallenge(item: (typeof hardScenarios)[number], index: number): ChallengeTemplateData {
  const base = `react-hard-${slugify(item.topic)}-${index + 1}`;
  const id = base;
  const category = "react-interview/hard";
  const title = `Entrevista sênior: incidente em ${item.topic}`;
  const code = `import React, { useEffect, useMemo, useState, useTransition } from "react";

type Row = { id: string; name: string; status: string; value: number };

export function ${`HardCase${index + 1}`}({ workspaceId }: { workspaceId: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState("all");
  const [liveEvents, setLiveEvents] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const socket = new WebSocket("wss://example.com/${item.api}/" + workspaceId);
    socket.addEventListener("message", event => {
      const payload = JSON.parse(event.data) as { type: string; row?: Row };
      if (payload.type === "upsert" && payload.row) {
        const found = rows.find(r => r.id === payload.row!.id);
        if (found) {
          found.status = payload.row.status;
          found.value = payload.row.value;
          setRows(rows);
        } else {
          setRows(prev => [...prev, payload.row!]);
        }
      }

      setLiveEvents([...liveEvents, payload.type]);
    });

    fetch("/api/${item.api}?workspaceId=" + workspaceId)
      .then(r => r.json())
      .then(data => setRows(data.rows));
  }, [workspaceId]);

  const visible = useMemo(() => {
    const baseRows = filter === "all" ? rows : rows.filter(r => r.status === filter);
    return baseRows.sort((a, b) => b.value - a.value);
  }, [rows, filter]);

  const refresh = () => {
    startTransition(() => {
      fetch("/api/${item.api}?workspaceId=" + workspaceId + "&refresh=1")
        .then(r => r.json())
        .then(data => setRows(data.rows));
    });
  };

  return (
    <div>
      <button onClick={() => setFilter("all")}>Todos</button>
      <button onClick={() => setFilter("open")}>Abertos</button>
      <button onClick={refresh}>Atualizar</button>
      {isPending ? <small>Atualizando...</small> : null}
      <ul>
        {visible.map((row, index) => (
          <li key={index}>{row.name} - {row.status} - {row.value}</li>
        ))}
      </ul>
    </div>
  );
}
`;

  const question = [
    `Você está em uma entrevista para vaga sênior. O avaliador diz que este componente de ${item.topic} está causando incidentes em produção.`,
    `Identifique pelo menos 4 problemas independentes (não apenas sintomas) e conecte cada um ao impacto real.`,
    `Obrigatório cobrir: ${item.problems}.`,
    `Feche com uma estratégia de correção em fases (hotfix, estabilização e refactor).`,
  ].join("\n");

  const solution = [
    `### Diagnóstico (nível sênior)`,
    `Problemas de base:`,
    `1. Closure obsoleta: callback do socket usa \`rows\` e \`liveEvents\` antigos.`,
    `2. Mutação direta: altera \`found\` dentro do estado e reutiliza referência em \`setRows(rows)\`.`,
    `3. Falta cleanup do socket: listeners acumulam após remount/troca de workspace.`,
    `4. \`sort\` mutável em \`useMemo\`: reordena o próprio estado.`,
    `5. \`key={index}\` produz associações erradas ao reorder.`,
    ``,
    `### Plano de Correção`,
    `- Hotfix: cleanup do socket + updates funcionais imutáveis + key por id.`,
    `- Estabilização: isolar stream em reducer/event queue para evitar race de eventos.`,
    `- Refactor: separar fetch inicial de stream, com protocolo de reconciliação (snapshot + eventos).`,
    ``,
    `### Exemplo de correções críticas`,
    "```tsx",
    "useEffect(() => {",
    "  const socket = new WebSocket(`wss://example.com/${item.api}/${workspaceId}`);",
    "  const onMessage = (event: MessageEvent) => {",
    "    const payload = JSON.parse(event.data) as { type: string; row?: Row };",
    "    setRows(prev => {",
    "      if (payload.type !== \"upsert\" || !payload.row) return prev;",
    "      const idx = prev.findIndex(r => r.id === payload.row!.id);",
    "      if (idx === -1) return [...prev, payload.row!];",
    "      return prev.map((r, i) => i === idx ? { ...r, ...payload.row! } : r);",
    "    });",
    "    setLiveEvents(prev => [...prev, payload.type]);",
    "  };",
    "  socket.addEventListener(\"message\", onMessage);",
    "  return () => {",
    "    socket.removeEventListener(\"message\", onMessage);",
    "    socket.close();",
    "  };",
    "}, [workspaceId]);",
    "",
    "const visible = useMemo(() => {",
    "  const baseRows = filter === \"all\" ? rows : rows.filter(r => r.status === filter);",
    "  return [...baseRows].sort((a, b) => b.value - a.value);",
    "}, [rows, filter]);",
    "```",
  ].join("\n");

  return {
    id,
    category,
    title,
    difficulty: "HARD",
    recommendedElo: 1650 + (index % 6) * 60,
    tags: ["interview", "react", "senior", "multi-bug", "architecture"],
    code,
    question,
    solution,
  };
}

function buildCatalog() {
  const easy = easyScenarios.map(buildEasyChallenge);
  const medium = mediumScenarios.map(buildMediumChallenge);
  const hard = hardScenarios.map(buildHardChallenge);
  return [...easy, ...medium, ...hard];
}

async function writeChallenge(root: string, item: ChallengeTemplateData) {
  const dir = path.join(root, item.category, item.id);
  await mkdir(dir, { recursive: true });

  const meta = {
    id: item.id,
    title: item.title,
    difficulty: item.difficulty,
    recommendedElo: item.recommendedElo,
    question: item.question,
    tags: item.tags,
  };

  await Promise.all([
    writeFile(path.join(dir, "challenge.json"), `${JSON.stringify(meta, null, 2)}\n`, "utf8"),
    writeFile(path.join(dir, "code.tsx"), `${item.code.trimEnd()}\n`, "utf8"),
    writeFile(path.join(dir, "solution.md"), `${item.solution.trimEnd()}\n`, "utf8"),
  ]);
}

async function run() {
  const [root, existing] = await Promise.all([
    resolveContentRoot(),
    readChallengesFromContent(),
  ]);
  const existingIds = new Set(existing.map(ch => ch.id));
  const catalog = buildCatalog().filter(item => !existingIds.has(item.id));

  const missing = Math.max(0, targetTotal - existing.length);
  if (missing === 0) {
    const synced = await syncChallengesIndexFromContent();
    console.log(`[generate:challenges] indexSynced total=${synced.total}`);
    console.log(`[generate:challenges] já existem ${existing.length} desafios. Nada a fazer.`);
    return;
  }

  if (catalog.length < missing) {
    throw new Error(
      `[generate:challenges] catálogo insuficiente: faltam ${missing}, mas só há ${catalog.length} disponíveis`,
    );
  }

  const selected = catalog.slice(0, missing);
  await Promise.all(
    selected.map((challenge) => writeChallenge(root, challenge)),
  );

  const [finalChallenges, synced] = await Promise.all([
    readChallengesFromContent(),
    syncChallengesIndexFromContent(),
  ]);
  console.log(
    `[generate:challenges] created=${selected.length} previous=${existing.length} final=${finalChallenges.length}`,
  );
  console.log(`[generate:challenges] indexSynced total=${synced.total}`);
}

run().catch((error) => {
  console.error("[generate:challenges] failed", error);
  process.exitCode = 1;
});
