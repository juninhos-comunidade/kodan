### Causa

Generics em Java são invariantes: `List<Integer>` não é subtipo de `List<Number>`. Se fosse, `addZero` poderia inserir qualquer `Number`, como um `Double`, dentro de uma lista cujo contrato permite apenas `Integer`.

### Contratos seguros

Para apenas ler valores como números:

```java
static double sum(List<? extends Number> values) {
    return values.stream().mapToDouble(Number::doubleValue).sum();
}
```

O wildcard `extends` permite consumir valores, mas impede inserções arbitrárias. Para inserir um valor do mesmo tipo da lista:

```java
static <T extends Number> void addDefault(List<T> values, T defaultValue) {
    values.add(defaultValue);
}
```

Assim, o chamador de `List<Integer>` precisa fornecer um `Integer`, preservando o contrato.
