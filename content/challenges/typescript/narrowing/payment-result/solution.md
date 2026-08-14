### Leitura do diagnóstico

Depois do teste `result.status === "approved"`, o ramo seguinte só pode representar `{ status: "declined"; reason: string }`. Esse membro da união não possui `receipt`; o terminal está mostrando uma suposição inválida no ramo recusado, não uma limitação do compilador.

### Correção

```ts
export function describePayment(result: PaymentResult) {
  if (result.status === "approved") {
    return `Aprovado: ${result.receipt}`;
  }

  return `Recusado: ${result.reason}`;
}
```

O campo literal `status` é o discriminante. A análise de fluxo estreita automaticamente o tipo em cada ramo, mantendo o acesso seguro sem `as`, `in` ou non-null assertion.
