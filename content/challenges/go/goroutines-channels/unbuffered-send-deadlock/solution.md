### Causa

O envio para um canal sem buffer só termina quando outra goroutine está pronta para receber o valor. Como a própria `main` tenta enviar antes de alcançar a leitura, ela bloqueia e não existe outra goroutine capaz de avançar o programa.

### Correção

O produtor ou o consumidor deve executar concorrentemente. Por exemplo:

```go
values := make(chan int)
go func() {
	values <- 42
}()

fmt.Println(<-values)
```

Criar `make(chan int, 1)` também evitaria o bloqueio deste exemplo, mas muda a semântica para permitir um valor pendente. O buffer deve representar uma decisão do pipeline, não apenas esconder uma ordem incorreta.
