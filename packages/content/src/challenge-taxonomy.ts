import type { ChallengeIndexEntry } from "./challenge-schemas";

export type ChallengeTopicDefinition = {
  key: string;
  label: string;
  description: string;
  matchers: readonly string[];
};

type ChallengeLanguage = ChallengeIndexEntry["language"];

const TOPICS_BY_LANGUAGE: Record<ChallengeLanguage, readonly ChallengeTopicDefinition[]> = {
  react: [
    topic("async-races", "Async UI & Races", "Fetch, concorrência, ordenação e sincronização de interface.", ["race", "data-fetching", "async", "promise", "fetch", "abort", "concurrency"]),
    topic("forms-validation", "Forms & Validation", "Inputs, contratos controlados e validação previsível.", ["form", "validation", "input", "controlled", "uncontrolled"]),
    topic("component-patterns", "Component Patterns", "Composição, interfaces e contratos entre componentes.", ["composition", "component", "contracts", "children", "context", "ref", "architecture", "api"]),
    topic("effects-lifecycle", "Effects & Lifecycle", "useEffect, closures, dependências e ciclo de vida.", ["hooks", "stale-closure", "useeffect", "effect", "dependency", "cleanup", "strict-mode"]),
    topic("type-system", "Type System", "Tipos, generics, inferência e narrowing em componentes.", ["type-system", "typescript", "generic", "inference", "narrowing", "types"]),
    topic("state-rendering", "State & Rendering", "Estado, renderização, derivação e memoização.", ["state-management", "state", "rendering", "immutability", "derived-state", "memoization", "usememo"]),
  ],
  typescript: [
    topic("type-system", "Sistema de tipos", "Tipos estruturais, unions e contratos.", ["type-system", "types", "union", "intersection"]),
    topic("generics-inference", "Generics & Inferência", "Parâmetros de tipo, constraints e inferência.", ["generic", "inference", "constraint"]),
    topic("narrowing", "Narrowing", "Type guards, discriminated unions e controle de fluxo.", ["narrowing", "type-guard", "discriminated"]),
    topic("async-errors", "Async & Erros", "Promises, async/await e propagação segura de falhas.", ["async", "promise", "error", "exception"]),
    topic("modules-runtime", "Módulos & Runtime", "Imports, exports e diferenças entre tipo e execução.", ["module", "import", "export", "runtime"]),
  ],
  python: [
    topic("collections-mutability", "Coleções & Mutabilidade", "Listas, dicionários, referências e cópias.", ["list", "dict", "set", "collection", "mutability", "copy"]),
    topic("iterators-generators", "Iteradores & Geradores", "Protocolo de iteração, yield e avaliação preguiçosa.", ["iterator", "generator", "yield", "iterable"]),
    topic("async-concurrency", "Async & Concorrência", "Corrotinas, tasks e sincronização.", ["async", "await", "concurrency", "thread"]),
    topic("object-model", "Modelo de objetos", "Classes, descriptors, métodos e herança.", ["class", "object", "method", "inheritance", "descriptor"]),
    topic("errors-context-managers", "Erros & Contextos", "Exceções e context managers.", ["exception", "error", "context-manager", "with"]),
  ],
  java: [
    topic("collections-streams", "Coleções & Streams", "Collections, streams e operações funcionais.", ["collection", "list", "map", "stream"]),
    topic("generics-types", "Generics & Tipos", "Wildcards, invariância e contratos de tipo.", ["generic", "wildcard", "type"]),
    topic("concurrency", "Concorrência", "Threads, executors e sincronização.", ["thread", "concurrency", "executor", "synchronized"]),
    topic("object-contracts", "Contratos de objeto", "Herança, interfaces, equals e hashCode.", ["interface", "inheritance", "equals", "hashcode", "object"]),
    topic("exceptions-resources", "Exceções & Recursos", "Exceções, try-with-resources e ciclo de vida.", ["exception", "resource", "try", "closeable"]),
  ],
  go: [
    topic("goroutines-channels", "Goroutines & Channels", "Concorrência, comunicação e cancelamento.", ["goroutine", "channel", "concurrency", "select"]),
    topic("interfaces-methods", "Interfaces & Métodos", "Satisfação implícita, method sets e composição.", ["interface", "method", "struct", "embedding"]),
    topic("errors-context", "Erros & Context", "Erros explícitos, wrapping e cancelamento.", ["error", "context", "cancel", "wrap"]),
    topic("slices-maps-memory", "Slices, Maps & Memória", "Semântica de slices, maps, ponteiros e alocação.", ["slice", "map", "pointer", "memory", "allocation"]),
    topic("modules-testing", "Módulos & Testes", "Packages, módulos, testes e benchmarks.", ["module", "package", "test", "benchmark"]),
  ],
};

export function getChallengeTopicDefinitions(language: ChallengeLanguage) {
  return TOPICS_BY_LANGUAGE[language];
}

export function inferChallengeTopic(challenge: {
  language: ChallengeLanguage;
  id: string;
  title: string;
  tags: readonly string[];
}) {
  const topics = getChallengeTopicDefinitions(challenge.language);
  const tagAndIdEntries = [...challenge.tags, challenge.id].map(normalize);
  const titleEntries = [normalize(challenge.title)];

  for (const entries of [tagAndIdEntries, titleEntries]) {
    for (const candidate of topics) {
      if (entries.some((entry) => candidate.matchers.some((matcher) => entry.includes(matcher)))) {
        return candidate.key;
      }
    }
  }

  return challenge.language === "react"
    ? "state-rendering"
    : topics[0]!.key;
}

function topic(
  key: string,
  label: string,
  description: string,
  matchers: readonly string[],
): ChallengeTopicDefinition {
  return { key, label, description, matchers };
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}
