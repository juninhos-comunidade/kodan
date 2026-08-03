import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Alert, AlertDescription, AlertTitle } from "@kodan/ui/components/alert";
import { Button } from "@kodan/ui/components/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kodan/ui/components/card";
import { Input } from "@kodan/ui/components/input";
import { ZenSeal } from "@kodan/ui/components/zen";
import { CircleAlert } from "lucide-react";
import type { CSSProperties } from "react";

type ColorPlaygroundArgs = {
  canvasColor: string;
  surfaceColor: string;
  textColor: string;
  mutedTextColor: string;
  primaryColor: string;
  destructiveColor: string;
  successColor: string;
  warningColor: string;
  borderColor: string;
  hankoColor: string;
};

const meta = {
  title: "Style Guide/Playground de Cores",
  component: ColorPlayground,
  parameters: { layout: "fullscreen" },
  args: {
    canvasColor: "",
    surfaceColor: "",
    textColor: "",
    mutedTextColor: "",
    primaryColor: "",
    destructiveColor: "",
    successColor: "",
    warningColor: "",
    borderColor: "",
    hankoColor: "",
  },
  argTypes: {
    canvasColor: colorControl("Fundo", "Vazio usa o token do tema atual."),
    surfaceColor: colorControl("Superfície", "Cards, campos e painéis."),
    textColor: colorControl("Texto", "Texto principal da interface."),
    mutedTextColor: colorControl("Texto secundário", "Descrições e metadados."),
    primaryColor: colorControl("Primária", "Ações, foco e seleção."),
    destructiveColor: colorControl("Destrutiva", "Erros e ações destrutivas."),
    successColor: colorControl("Sucesso", "Estados positivos."),
    warningColor: colorControl("Aviso", "Estados de atenção."),
    borderColor: colorControl("Borda", "Divisórias e contornos."),
    hankoColor: colorControl("Hanko Zen", "Selos e destaques Zen."),
  },
} satisfies Meta<typeof ColorPlayground>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Laboratorio: Story = {};

function ColorPlayground(args: ColorPlaygroundArgs) {
  const styles = createTokenStyles(args);

  return (
    <main className="min-h-screen bg-background p-4 text-foreground sm:p-8" style={styles}>
      <header className="mx-auto max-w-5xl border-b border-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Laboratório</p>
            <h1 className="mt-2 font-serif text-2xl font-bold">Experimente a paleta</h1>
          </div>
          <ZenSeal label="Kodan" />
        </div>
        <p className="mt-3 max-w-[70ch] text-sm leading-6 text-muted-foreground">
          Abra Controls, altere qualquer cor e compare os componentes juntos. Apague um valor ou use Reset para voltar aos tokens do tema atual.
        </p>
      </header>

      <div className="mx-auto mt-6 grid max-w-5xl items-start gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico atual</CardTitle>
            <CardDescription>Observe contraste, hierarquia e estados antes de aplicar a paleta no código.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <label htmlFor="color-lab-answer" className="text-xs font-semibold">Hipótese</label>
              <Input id="color-lab-answer" placeholder="O listener não é removido no cleanup" />
            </div>
            <Alert variant="info">
              <CircleAlert />
              <AlertTitle>Feedback do Tech Lead</AlertTitle>
              <AlertDescription>Verifique se foco, bordas e texto continuam legíveis.</AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="justify-end gap-2">
            <Button variant="outline">Revisar</Button>
            <Button>Enviar diagnóstico</Button>
          </CardFooter>
        </Card>

        <section className="border border-border bg-card p-4 text-card-foreground sm:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Estados semânticos</p>
          <div className="mt-4 space-y-3">
            <StateRow label="Primária" variable="--primary" />
            <StateRow label="Sucesso" variable="--success" />
            <StateRow label="Aviso" variable="--profile-warning" />
            <StateRow label="Destrutiva" variable="--destructive" />
            <StateRow label="Hanko" variable="--zen-hanko" />
            <StateRow label="Borda" variable="--border" />
          </div>
        </section>
      </div>
    </main>
  );
}

function StateRow({ label, variable }: { label: string; variable: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <span className="size-8 shrink-0 border border-border" style={{ backgroundColor: `var(${variable})` }} />
      <div className="min-w-0">
        <p className="text-xs font-semibold">{label}</p>
        <code className="text-[11px] text-muted-foreground">var({variable})</code>
      </div>
    </div>
  );
}

function colorControl(name: string, description: string) {
  return { name, description, control: "color" as const, table: { category: "Paleta experimental" } };
}

function createTokenStyles(args: ColorPlaygroundArgs) {
  const entries: Array<[string, string]> = [];
  const add = (value: string, variables: string[]) => {
    if (!value) return;
    variables.forEach((variable) => entries.push([variable, value]));
  };

  add(args.canvasColor, ["--background", "--profile-bg", "--dojo-page"]);
  add(args.surfaceColor, ["--card", "--popover", "--profile-surface", "--profile-surface-elevated", "--dojo-surface", "--dojo-panel"]);
  add(args.textColor, ["--foreground", "--card-foreground", "--popover-foreground", "--profile-text-primary", "--dojo-ink", "--zen-ink"]);
  add(args.mutedTextColor, ["--muted-foreground", "--profile-text-secondary", "--profile-text-muted", "--dojo-ink-soft", "--dojo-muted", "--zen-muted"]);
  add(args.primaryColor, ["--primary", "--ring", "--profile-accent-blue", "--dojo-accent", "--dojo-accent-strong", "--info-border", "--info-foreground"]);
  add(args.destructiveColor, ["--destructive", "--profile-danger", "--dojo-rose", "--error-border", "--error-foreground"]);
  add(args.successColor, ["--success", "--profile-success", "--success-border", "--success-foreground"]);
  add(args.warningColor, ["--profile-warning", "--dojo-amber", "--dojo-flame", "--warning-border", "--warning-foreground"]);
  add(args.borderColor, ["--border", "--input", "--profile-border", "--profile-border-strong", "--dojo-border", "--dojo-border-strong", "--zen-border"]);
  add(args.hankoColor, ["--zen-hanko"]);

  return Object.fromEntries(entries) as CSSProperties;
}
