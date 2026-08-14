### Causa

Uma expressão geradora produz um iterador de passagem única. `sum(1 for _ in ids)` consome todos os valores disponíveis; quando `list(ids)` é executado, o iterador já está esgotado.

### Correção direta

```py
ids = [row["id"] for row in rows if row["active"]]
return len(ids), ids
```

Materializar é adequado quando o resultado precisa ser percorrido mais de uma vez e cabe confortavelmente em memória. Para um fluxo grande, outra opção é acumular contagem e IDs em uma única passagem, ou recriar o gerador a partir de uma fonte que possa ser percorrida novamente.
