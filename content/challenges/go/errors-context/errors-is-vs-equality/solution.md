### Diferença central

`err == ErrNotFound` compara diretamente os dois valores. A comparação só reconhece o sentinela quando ele é o próprio erro retornado, além de exigir que os valores envolvidos sejam comparáveis.

`errors.Is(err, ErrNotFound)` examina `err` e percorre a cadeia formada por erros encapsulados, normalmente com `fmt.Errorf("...: %w", err)`. Por isso, o sentinela continua reconhecível mesmo depois de receber contexto. A função também respeita um método `Is(error) bool` implementado por um tipo de erro.

`%w` preserva a causa para `errors.Is`, `errors.As` e `errors.Unwrap`; `%v` apenas formata o texto e rompe essa relação programática. Igualdade direta ainda pode ser útil quando a identidade exata do valor é o contrato desejado, mas não substitui `errors.Is` diante de wrapping.
