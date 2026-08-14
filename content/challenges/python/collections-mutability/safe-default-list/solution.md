### Veredito

O código está correto: `None` é o valor padrão compartilhado, mas ele é imutável e funciona apenas como sentinela. A cada chamada sem uma lista explícita, o corpo executa `tags = []` e cria um novo objeto.

Assim, `first` contém `python` e `second` contém `backend`; as duas referências não apontam para a mesma lista.

### Versão vulnerável

```py
def add_tag(tag: str, tags: list[str] = []) -> list[str]:
    tags.append(tag)
    return tags
```

Argumentos padrão são avaliados uma única vez, na definição da função. Nessa versão, todas as chamadas sem `tags` reutilizariam a mesma lista mutável.
