### Diferença central

`try/finally` é o mecanismo geral que garante a execução de uma limpeza escrita manualmente. Ele funciona, mas o chamador precisa adquirir o recurso, guardar a referência correta e repetir a política de liberação em cada uso.

Um context manager encapsula esse ciclo no protocolo `__enter__`/`__exit__`. O bloco `with` chama a entrada, entrega o recurso e garante a saída ao final normal ou excepcional, favorecendo reutilização e composição de múltiplos recursos.

`__exit__` recebe informações sobre uma exceção ativa. Ele pode apenas limpar e deixar a falha propagar, que é o comportamento comum, ou retornar um valor verdadeiro para suprimi-la quando isso fizer parte explícita do contrato. `with` não elimina exceções automaticamente; ele centraliza a política de ciclo de vida.
