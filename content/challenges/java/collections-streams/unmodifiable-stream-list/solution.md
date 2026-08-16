### Veredito

A afirmação está errada. `Stream.toList()` retorna uma lista não modificável; uma tentativa de `add`, `remove` ou operação equivalente lança `UnsupportedOperationException`. O contrato também não promete uma implementação concreta como `ArrayList`.

`Collectors.toList()` não garante formalmente tipo, mutabilidade ou serialização do resultado, embora implementações comuns retornem uma lista mutável. Quando a API precisa garantir mutabilidade, a intenção deve ser explícita, por exemplo com `new ArrayList<>(stream.toList())` ou `toCollection(ArrayList::new)`.

O método atual é válido quando entrega um snapshot de leitura e o chamador não deve alterá-lo.
