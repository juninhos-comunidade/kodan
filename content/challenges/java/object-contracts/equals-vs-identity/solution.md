### Identidade e igualdade

Para referências de objetos, `==` verifica se os dois operandos apontam para a mesma instância. `equals` representa igualdade lógica definida pelo tipo; a implementação herdada de `Object` também usa identidade, mas classes de valor costumam sobrescrevê-la.

Duas instâncias de `Customer` com o mesmo identificador podem ser logicamente iguais sem serem a mesma referência. Identidade é adequada quando a instância específica importa; igualdade lógica é adequada quando o domínio define equivalência pelos dados.

### Contrato com hashCode

Objetos iguais por `equals` devem produzir o mesmo `hashCode`. `HashMap` e `HashSet` usam primeiro o hash para localizar um bucket e depois `equals` para confirmar a correspondência. Quebrar essa regra pode tornar uma chave aparentemente igual impossível de encontrar ou permitir duplicações incoerentes.
