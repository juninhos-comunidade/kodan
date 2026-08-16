### Problemas Encontrados
1. Dependência instável (`options`) no `useEffect`: o objeto é recriado em todo render. O efeito chama `setLoading`, produz outro render e recebe uma nova dependência, formando um ciclo de requisições.
2. `items.sort(...)` muta o array de estado e cria efeitos colaterais invisíveis.
3. Uso de `key={idx}` pode associar linha errada após reordenação.

### Correção Prioritária
- Primeiro estabilizar o gatilho de fetch usando dependências primitivas (`teamId`, `query`).
- Depois tornar ordenação imutável: `[...items].sort(...)`.
- Por fim corrigir chave para `item.id`.
