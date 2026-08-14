### Diferença central

Um import normal pode representar uma dependência de runtime e, conforme a configuração do compilador e do bundler, permanecer como `import` no JavaScript. `import type` declara que os símbolos serão usados exclusivamente pelo sistema de tipos e deve ser removido na emissão.

```ts
import type { AuditEvent } from "./audit-contract";
```

Como tipos não existem em runtime, essa forma evita que uma referência puramente estática seja tratada como dependência executável.

### Quando a troca muda comportamento

Ela não é segura se o símbolo for necessário como valor, por exemplo uma classe usada com `new`, `instanceof`, um enum emitido ou uma constante. Também pode remover a execução de efeitos colaterais existentes no módulo importado. Quando o objetivo é executar o módulo por seu efeito, deve existir um import explícito como `import "./register-audit"`.

Portanto, a escolha depende de distinguir posição de tipo de posição de valor e de reconhecer dependências de runtime intencionais.
