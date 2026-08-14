### Veredito

O código está correto. O TypeScript usa tipagem estrutural: `apiUser` pode ser usado como `UserSummary` porque possui pelo menos `id` e `name` com os tipos exigidos. A propriedade adicional `role` não invalida a compatibilidade.

### A pegadinha da propriedade extra

Uma verificação mais restritiva ocorre quando um literal de objeto novo é passado diretamente para um ponto que espera `UserSummary`:

```ts
renderSummary({ id: "user-42", name: "Lia", role: "admin" });
```

Nesse caso, a checagem de propriedades extras sinaliza `role`. Ela ajuda a capturar erros de digitação em literais, mas não transforma o sistema em tipagem nominal nem proíbe objetos já existentes de conter mais campos.
