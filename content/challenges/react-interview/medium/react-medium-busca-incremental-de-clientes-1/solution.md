### Problemas Encontrados
1. Dependência instável (`options`) no `useEffect`: o objeto é recriado em todo render. O efeito chama `setLoading`, produz outro render e recebe uma nova dependência, formando um ciclo de requisições.
2. `items.sort(...)` muta o array de estado e cria efeitos colaterais invisíveis.
3. Uso de `key={idx}` pode associar linha errada após reordenação.

### Correção Prioritária
- Primeiro estabilizar o gatilho de fetch usando dependências primitivas (`teamId`, `query`).
- Depois tornar ordenação imutável: `[...items].sort(...)`.
- Por fim corrigir chave para `item.id`.

### Patch sugerido
```tsx
useEffect(() => {
  const ctrl = new AbortController();
  setLoading(true);
  fetch(`/api/customers?teamId=${teamId}&q=${query}`, { signal: ctrl.signal })
    .then(r => r.json())
    .then(data => setItems(data.items))
    .finally(() => setLoading(false));
  return () => ctrl.abort();
}, [teamId, query]);

const top = useMemo(() => [...items].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 5), [items]);
```
