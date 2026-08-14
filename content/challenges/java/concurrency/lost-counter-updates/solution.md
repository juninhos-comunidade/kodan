### Causa

`value++` é uma sequência de leitura, soma e escrita. Dois workers podem ler o mesmo valor e gravar o mesmo resultado incrementado, perdendo uma atualização. Aguardar o executor garante que as tarefas terminaram, mas não corrige a corrida ocorrida durante a execução.

Marcar o campo como `volatile` melhora visibilidade, porém não torna a sequência composta atômica.

### Correções

Para um contador simples, use `AtomicInteger.incrementAndGet()`. Em cenários de alta contenção e agregação, `LongAdder` pode escalar melhor. Um bloco ou método `synchronized` também preserva a atualização, com custo e semântica de exclusão mútua explícitos.
