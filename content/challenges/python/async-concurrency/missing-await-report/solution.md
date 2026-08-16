### Causa

Chamar uma função `async` não executa seu corpo até o resultado final; a chamada cria um objeto coroutine. Como `fetch_report()` não foi aguardada, `report` não é um dicionário e não pode ser indexado. O aviso adicional confirma que a corrotina foi descartada sem execução completa.

### Correção

```py
async def build_report() -> str:
    report = await fetch_report()
    return report["id"]
```

`await` suspende `build_report` sem bloquear o event loop e retoma a função quando o dicionário estiver disponível. `create_task` só seria necessário para iniciar concorrência intencional com outro trabalho, o que não existe neste fluxo sequencial.
