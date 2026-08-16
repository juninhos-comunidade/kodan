### O que a ordem dos eventos indica

O teste terminou antes de a Promise rejeitada ser observada. Por isso o runner registrou o teste como aprovado e apenas depois recebeu uma rejeição sem consumidor, encerrando o processo com código 1.

O terminal é compatível com uma Promise iniciada e abandonada, sem `await`, `return` ou matcher que instale um tratador:

```ts
test("rejeita pagamento recusado", () => {
  processPayment();
});
```

### Correção

```ts
test("rejeita pagamento recusado", async () => {
  await expect(processPayment()).rejects.toThrow("payment declined");
});
```

Também seria possível retornar a cadeia de expectativa. O ponto essencial é fazer a Promise integrar o ciclo de vida do teste e adicionar uma asserção que realmente verifique a rejeição.
