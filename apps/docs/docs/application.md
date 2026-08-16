---
sidebar_position: 2
title: Aplicação e rotas
---

# Aplicação e rotas

Kodan é uma aplicação Next.js para treino de leitura e diagnóstico de código. Esta página descreve a navegação de interface. Ela é diferente da [referência de API](/api-reference), que documenta apenas os Route Handlers HTTP.

## Navegação global

As telas de treino usam a mesma sidebar global:

- **Início** leva ao fluxo de entrada.
- **Desafios** abre o catálogo.
- **Perfil** mostra progresso, ELO e histórico.
- **Histórico** e **Configurações** apontam para seções do perfil enquanto ainda não possuem rotas independentes.

O cabeçalho global identifica a área atual e mantém o acesso a notificações. A navegação contextual fica dentro da página: por exemplo, a busca e os filtros pertencem ao catálogo, não à sidebar.

## Organização das rotas

A aplicação utiliza Route Groups do App Router do Next.js para separar as páginas conforme seu comportamento de autenticação.

Essa organização facilita a manutenção do projeto e centraliza as regras de acesso de cada grupo de páginas.

### Estrutura das pastas

A organização das rotas é dividida em três grupos principais:

<details>
<summary><code>/(auth)</code> · Autenticação</summary>

Agrupa as páginas responsáveis pelo processo de autenticação, como login, cadastro, recuperar senha, redefinir senha e verificação de email.

</details>

<details>
<summary><code>/(protected)</code> · Rotas protegidas</summary>

Agrupa as páginas que **exigem uma sessão autenticada** para serem acessadas.

Antes de renderizar qualquer página desse grupo, a aplicação verifica se existe um usuário autenticado. Caso contrário, o acesso é bloqueado e o usuário é redirecionado para a página de login, preservando o destino solicitado para que possa retornar após a autenticação.

Esse grupo normalmente contém páginas relacionadas aos dados pessoais do usuário e funcionalidades que dependem da sua identidade.

</details>

<details>
<summary><code>/(public)</code> · Rotas públicas</summary>

Agrupa as páginas que podem ser acessadas por qualquer visitante, independentemente de estar autenticado.

Quando existe uma sessão ativa, essas páginas podem exibir informações personalizadas, como o nome do usuário, seu progresso ou recomendações. Entretanto, funcionalidades que alteram dados, como enviar um diagnostico ou registrar progresso, continuam exigindo autenticação.

Se um visitante tentar executar uma ação protegida dentro de uma rota pública, a aplicação solicita o login e, após a autenticação, retorna o usuário para a mesma página para concluir a ação.

</details>

### Layouts

Cada grupo de rotas possui um arquivo **`layout.tsx`**, responsável por compartilhar componentes e definir regras comuns para todas as páginas daquele grupo.

Essa abordagem evita repetição de código e garante que todas as rotas de um mesmo grupo tenham o mesmo comportamento.

<details> 
<summary><code>/(protected)/layout.tsx</code> · Layout das rotas protegidas</summary>

O layout das rotas protegidas verifica se existe uma sessão autenticada antes de renderizar a página.

Caso o usuário não esteja autenticado, o acesso é bloqueado e ele é redirecionado automaticamente para a página de login.

Todas as páginas dentro de `/(protected)` herdam esse comportamento, não sendo necessário repetir a verificação em cada página individualmente.
</details>
  
<details> 
<summary><code>/(public)/layout.tsx</code> · Layout das rotas públicas</summary>

O layout das rotas públicas permite que qualquer visitante acesse suas páginas.

Entretanto, ele também verifica se existe uma sessão ativa para disponibilizar informações personalizadas ao usuário autenticado.

Quando uma funcionalidade exige autenticação — por exemplo, enviar um diagnóstico para avaliação — o layout permite que a página seja exibida normalmente, mas a ação protegida solicita o login antes de ser executada. Após a autenticação, o usuário retorna automaticamente para a página em que estava.

Essa estratégia permite que visitantes explorem a plataforma livremente, enquanto funcionalidades que alteram dados permanecem protegidas.
</details>

### Rotas de interface

Abra uma rota para ver como ela participa da jornada. As rotas marcadas como **canônicas** são os endereços que a navegação deve preferir.

<details>
<summary><code>/(public)/inicio</code> · Início canônico</summary>

Mostra a visão geral e um desafio em destaque com o código ao lado. Para visitantes, prioriza um desafio fácil praticado por mais pessoas. Para praticantes autenticados, pode retomar uma sessão recente ou recomendar um desafio próximo do ELO atual.

</details>

<details>
<summary><code>/(public)/desafios</code> · Catálogo canônico</summary>

Mostra desafios de React, TypeScript, Python, Java e Go, com busca textual e filtros contextuais de linguagem, tópico, dificuldade, status, tipo e ordenação. Desafios com rubrica validada navegam para <code>/treinar/[id]</code>. Itens ainda não avaliáveis aparecem com cadeado e selo **Em revisão**; a ação abre uma explicação editorial sem iniciar tentativa, avaliação ou ELO.

</details>

<details>
<summary><code>/(public)/treinar/[id]</code> · Arena canônica</summary>

Recebe o identificador de um desafio avaliável e apresenta a evidência conforme o contrato editorial: código, código com terminal em abas, terminal ou comparação conceitual. O contexto narrativo acompanha qualquer formato. Depois de errar, o praticante pode continuar sem ver a solução e com menor ELO potencial, ou revelar a solução e encerrar a sessão. A sessão aceita no máximo três tentativas avaliadas. Um acesso direto a um desafio em revisão mostra o bloqueio editorial e não cria tentativa nem chama o provedor de avaliação.

</details>

<details>
<summary><code>/(public)/ajuda</code> · Ajuda </summary>

Página com resposta para dúvidas sobre como o sistema funciona

</details>

<details>
<summary><code>/(public)/revisoes</code> · Revisões </summary>

Página em implementação ainda.

</details>

<details>
<summary><code>/(public)/simulados</code> · Simulados </summary>

Página em implementação ainda.

</details>

<details>
<summary><code>/zen</code> · Laboratório</summary>

É um playground visual experimental. Fica fora da navegação principal e não faz parte da jornada de treino, catálogo ou perfil.

</details>

<details>
<summary><code>/(protected)/perfil</code> · Perfil canônico</summary>

Reúne identidade do jogador, ELO, evolução, domínio por tópico, sessões recentes, recomendações e conquistas. A sidebar global também leva a esta rota para itens que ainda são seções do perfil, como histórico e configurações.

</details>

<details>
<summary><code>/(protected)/configuracoes</code> · Configurações</summary>

Configurações gerais como aparência do sistema(dark ou light), botão de redirecionamento pro perfil e botão de logOut
</details>

<details>
<summary><code>/(auth)/login</code> · Redirecionamento local</summary>

O login autentica o praticante e preserva o destino local solicitado pela navegação.

</details>

<details>
<summary><code>/(auth)/cadastro</code> · Redirecionamento local</summary>

O cadastro cria um usuário para o praticante no sistemae preserva o destino local solicitado pela navegação.

</details>


## Fluxo principal

1. O praticante ou visitante abre **Início** e escolhe entrar no catálogo.
2. Busca por texto e abre **Filtros** para combinar dificuldade, status, tipo e ordenação.
3. Seleciona um desafio avaliável e entra em `/treinar/[id]`; em um item bloqueado, consulta o motivo da revisão sem sair do catálogo.
4. Envia a análise e decide entre tentar novamente ou revelar a solução quando não resolver o desafio.
5. Consulta o resultado no **Perfil**.

## Rotas de API

As rotas `/api/*` não são páginas. Elas são interfaces HTTP para integrações e são descritas na [referência OpenAPI](/api-reference).

- `/api/me` e `/api/me/attempts` tratam o jogador atual e seu histórico.
- `/api/challenges` lista desafios.
- `/api/challenges/{id}` retorna detalhe de desafio.
- `/api/challenges/{id}/attempts` registra uma tentativa.
- `/api/product-events` registra apenas eventos agregados da jornada pública, sem identificadores de praticante ou conteúdo de respostas.
- `/api/auth/*` é fornecida pelo Better Auth.

> O contrato público de detalhe não expõe a solução de referência. Ela só aparece no resultado quando a sessão é resolvida ou quando o praticante escolhe revelá-la.

## Leitura do funil de produto

O relatório operacional usa somente os agregados de baixa cardinalidade já gravados no banco. Para consultar os últimos 30 dias:

```bash
bun run product-events:funnel --days=30
```

O resultado separa entrada pela landing, CTAs, início, abertura e início de desafio, bloqueio de autenticação, autenticação concluída, primeiro feedback e próximo desafio. `auth_completed` é registrado por uma ação protegida por sessão; ele não é aceito pelo endpoint público de eventos.

As contagens representam volume direcional de eventos, não conversão por coorte nem usuários únicos. Para uma taxa de conversão real, será necessário definir uma política de identidade consentida antes de ampliar a coleta.
