### Diagnóstico (nível sênior)
Problemas de base:
1. Closure obsoleta: callback do socket usa `rows` e `liveEvents` antigos.
2. Mutação direta: altera `found` dentro do estado e reutiliza referência em `setRows(rows)`.
3. Falta cleanup do socket: listeners acumulam após remount/troca de workspace.
4. `sort` mutável em `useMemo`: reordena o próprio estado.
5. `key={index}` produz associações erradas ao reorder.
6. Snapshot e stream não possuem estratégia de reconciliação: o `fetch` inicial pode terminar depois de eventos do socket e sobrescrever atualizações mais recentes.

### Plano de Correção
- Hotfix: cleanup do socket + updates funcionais imutáveis + key por id.
- Estabilização: reconciliar o snapshot inicial com o stream por versão, sequência ou fila, para que uma resposta atrasada não apague eventos mais novos.
- Refactor: separar fetch inicial de stream, com protocolo de reconciliação (snapshot + eventos).

### Exemplo de correções críticas
```tsx
useEffect(() => {
  const socket = new WebSocket(`wss://example.com/${item.api}/${workspaceId}`);
  const onMessage = (event: MessageEvent) => {
    const payload = JSON.parse(event.data) as { type: string; row?: Row };
    setRows(prev => {
      if (payload.type !== "upsert" || !payload.row) return prev;
      const idx = prev.findIndex(r => r.id === payload.row!.id);
      if (idx === -1) return [...prev, payload.row!];
      return prev.map((r, i) => i === idx ? { ...r, ...payload.row! } : r);
    });
    setLiveEvents(prev => [...prev, payload.type]);
  };
  socket.addEventListener("message", onMessage);
  return () => {
    socket.removeEventListener("message", onMessage);
    socket.close();
  };
}, [workspaceId]);

const visible = useMemo(() => {
  const baseRows = filter === "all" ? rows : rows.filter(r => r.status === filter);
  return [...baseRows].sort((a, b) => b.value - a.value);
}, [rows, filter]);
```
