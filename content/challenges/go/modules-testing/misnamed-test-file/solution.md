### Causa

O comando `go test` só trata como fonte de teste os arquivos cujo nome termina em `_test.go`. `handler-tests.go` é compilado como um arquivo Go comum e não participa da descoberta de testes.

A correção mínima é renomeá-lo para algo como `handler_test.go`. Dentro dele, testes comuns devem ser funções exportadas no formato `func TestNome(t *testing.T)`, sem retorno. Benchmarks usam `BenchmarkNome(*testing.B)` e exemplos descobertos seguem a convenção `Example...`.

Estar no mesmo diretório e usar o mesmo pacote não compensa um nome de arquivo inválido. Depois do rename, uma função como `TestHandler` passa a ser coletada pelo runner.
