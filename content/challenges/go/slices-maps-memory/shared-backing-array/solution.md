### Saída

```text
[10 20 40]
[10 20 40]
```

`base` tem comprimento 2 e capacidade 4. O primeiro `append` pode reutilizar seu array de apoio e gravar `30` no índice 2. O segundo parte novamente de `base`, também encontra capacidade disponível e grava `40` no mesmo índice. `first` e `second` apontam para essa região compartilhada, então ambos observam o último valor.

Para garantir independência, cada variação pode começar de uma cópia:

```go
first := append(append([]int(nil), base...), 30)
second := append(append([]int(nil), base...), 40)
```

Outra opção é limitar a capacidade antes do `append`, com `base[:len(base):len(base)]`, forçando a alocação de um novo array para cada resultado. A cópia explícita costuma deixar a intenção mais clara.
