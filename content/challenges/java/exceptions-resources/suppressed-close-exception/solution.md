### Exceção principal

A falha lançada pelo corpo do `try` continua sendo a exceção principal propagada: `write failed`. Durante a saída, o recurso é fechado; como `close()` também falha, essa segunda exceção é anexada à principal como suprimida.

Ela pode ser inspecionada por `Throwable.getSuppressed()` e aparece indentada no stack trace.

### Por que preservar dessa forma

Substituir a falha original pela exceção de fechamento esconderia a causa que interrompeu o trabalho. Ignorar a falha de `close` também perderia informação relevante sobre o estado do recurso. Try-with-resources mantém a causalidade principal e conserva as falhas secundárias para diagnóstico.
