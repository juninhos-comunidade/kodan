### Causa

`K extends string` informa apenas que a chave é alguma string. Isso não estabelece que ela pertence às chaves de `T`; portanto, `record[key]` pode tentar acessar uma propriedade inexistente.

### Assinatura segura

```ts
function readField<T, K extends keyof T>(record: T, key: K): T[K] {
  return record[key];
}
```

`keyof T` conecta os dois parâmetros genéricos. Para o objeto `deploy`, a chamada com `"status"` infere `K` como `"status"` e o retorno como `string`. Uma chave fora do contrato é rejeitada no ponto da chamada.

O uso de `any` ou de uma asserção esconderia a ausência dessa relação em vez de representá-la no sistema de tipos.
