### Leitura do erro

Ao acessar `PriceFormatter.format` pela classe, não existe instância para ser ligada automaticamente ao primeiro parâmetro. Quando o registry chama a função com o valor, esse argumento ocupa `self`, deixando `value` ausente.

### Correções possíveis

Se a formatação depende de estado do objeto, registre um método ligado:

```py
formatter = PriceFormatter(currency="BRL")
registry.register("price", formatter.format)
```

Se a operação não depende de instância, declare explicitamente outro contrato, como `@staticmethod`, removendo `self`. A escolha deve refletir se configurações do formatter participam do comportamento; apenas adicionar argumentos até o erro desaparecer esconderia essa decisão.
