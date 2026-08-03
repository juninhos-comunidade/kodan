import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const meta = {
  title: "Style Guide/Fundamentos",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const colorGroups = [
  {
    title: "Base semântica",
    description: "Primitives de interface compartilhadas por @kodan/ui.",
    colors: [
      ["Background", "--background"],
      ["Foreground", "--foreground"],
      ["Primary", "--primary"],
      ["Secondary", "--secondary"],
      ["Muted", "--muted"],
      ["Accent", "--accent"],
      ["Destructive", "--destructive"],
      ["Success", "--success"],
      ["Border", "--border"],
    ],
  },
  {
    title: "Produto atual",
    description: "Superfícies, texto e estados usados nas telas de perfil, navegação e desafios.",
    colors: [
      ["Page", "--profile-bg"],
      ["Surface", "--profile-surface"],
      ["Elevated", "--profile-surface-elevated"],
      ["Text", "--profile-text-primary"],
      ["Text secondary", "--profile-text-secondary"],
      ["Blue accent", "--profile-accent-blue"],
      ["Success", "--profile-success"],
      ["Warning", "--profile-warning"],
      ["Danger", "--profile-danger"],
    ],
  },
  {
    title: "Zen",
    description: "Paleta tátil aplicada aos componentes de estudo e progressão Zen.",
    colors: [
      ["Washi", "--zen-washi"],
      ["Ink", "--zen-ink"],
      ["Sumi", "--zen-sumi"],
      ["Hanko", "--zen-hanko"],
      ["Moss", "--zen-moss"],
      ["Gold", "--zen-gold"],
      ["Border", "--zen-border"],
      ["Muted", "--zen-muted"],
    ],
  },
] as const;

const spacing = [4, 8, 16, 24, 32] as const;

export const SistemaKodan: Story = {
  render: () => (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground sm:px-10 lg:px-16">
      <header className="max-w-3xl border-b border-border pb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Kodan UI</p>
        <h1 className="mt-3 font-serif text-3xl font-bold">Style Guide atual</h1>
        <p className="mt-4 max-w-[70ch] text-sm leading-7 text-muted-foreground">
          A direção vem do produto — estratégico, vintage e acadêmico — enquanto as cores abaixo são renderizadas diretamente dos tokens atuais do CSS. Use o seletor Tema na barra superior para revisar light e dark.
        </p>
      </header>

      <section className="mt-10">
        <GuideHeading index="01" title="Cores atuais" description="Os swatches usam as próprias CSS variables do projeto; não são uma cópia estática da paleta documentada." />
        <div className="mt-5 space-y-7">
          {colorGroups.map((group) => (
            <div key={group.title}>
              <h3 className="font-serif text-base font-bold">{group.title}</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{group.description}</p>
              <div className="mt-3 grid gap-px border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
                {group.colors.map(([label, token]) => (
                  <article key={token} className="bg-background p-3">
                    <div className="h-16 border border-border" style={{ backgroundColor: `var(${token})` }} />
                    <p className="mt-3 text-xs font-semibold">{label}</p>
                    <code className="mt-1 block text-[11px] text-muted-foreground">var({token})</code>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <GuideHeading index="02" title="Tipografia em uso" description="Amostras renderizadas com as classes atuais do produto, sem impor uma especificação externa." />
        <div className="mt-5 grid gap-px border border-border bg-border lg:grid-cols-[1.2fr_1fr]">
          <div className="bg-background p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Display</p>
            <p className="mt-3 font-serif text-4xl font-bold leading-tight">Leia antes de executar.</p>
          </div>
          <div className="bg-background p-6">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Interface e dados</p>
            <p className="mt-3 font-mono text-sm leading-7">ELO 1460 · 3º Kyu · 07 dias</p>
            <code className="mt-3 block border border-border bg-muted p-3 text-xs">useEffect(() =&gt; diagnose(), [code]);</code>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <GuideHeading index="03" title="Ritmo e estrutura" description="Escala de espaçamento observada no código e exemplos das bordas semânticas disponíveis." />
        <div className="mt-5 border border-border p-6">
          <div className="flex flex-wrap items-end gap-7">
            {spacing.map((value) => (
              <div key={value} className="text-center">
                <div className="mx-auto bg-primary" style={{ width: value, height: value }} />
                <code className="mt-2 block text-[11px] text-muted-foreground">{value}px</code>
              </div>
            ))}
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="border border-border p-4 text-xs">Borda padrão · 1px</div>
            <div className="border-2 border-foreground p-4 text-xs">Ênfase tátil · 2px</div>
            <div className="border border-primary p-4 text-xs text-primary">Foco e seleção</div>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <GuideHeading index="04" title="Princípios do produto" description="Critérios de decisão vindos da documentação do Kodan, aplicados sobre os tokens que estão no código hoje." />
        <div className="mt-5 grid gap-px border border-border bg-border md:grid-cols-3">
          {[
            ["Calma estratégica", "Pouco ruído ao redor do código e das decisões importantes."],
            ["Mesa do mestre", "Superfícies táteis, bordas claras e sensação de estudo concentrado."],
            ["Ofício legível", "Código, dados e diagnósticos continuam sendo o centro da interface."],
          ].map(([title, description]) => (
            <article key={title} className="bg-background p-5">
              <h3 className="font-serif text-base font-bold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <GuideHeading index="05" title="Uso do catálogo" description="O Storybook documenta a implementação atual e permite testar props sem duplicar componentes entre pacotes." />
        <div className="mt-5 grid gap-px border border-border bg-border md:grid-cols-2">
          <div className="bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Faça</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>Importe primitives diretamente de @kodan/ui.</li>
              <li>Teste estados, tamanhos e temas pelos Controls.</li>
              <li>Use os tokens semânticos para preservar light e dark.</li>
            </ul>
          </div>
          <div className="bg-background p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-destructive">Evite</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
              <li>Copiar a implementação de uma primitive para apps/web.</li>
              <li>Usar valores de cor literais quando já existe um token.</li>
              <li>Confundir Controls com edição automática do código-fonte.</li>
            </ul>
          </div>
        </div>
      </section>
    </main>
  ),
};

function GuideHeading({ index, title, description }: { index: string; title: string; description: string }) {
  return (
    <div className="flex max-w-3xl items-start gap-4">
      <span className="border border-primary px-2 py-1 font-mono text-xs text-primary">{index}</span>
      <div>
        <h2 className="font-serif text-xl font-bold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
