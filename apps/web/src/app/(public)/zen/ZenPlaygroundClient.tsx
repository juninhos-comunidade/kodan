"use client";

import {
  EnsoCircle,
  HankoMarkSvg,
  SumiDividerSvg,
  DanProgress,
  ZenAlert,
  ZenAchievementSeal,
  ZenAvatar,
  ZenBreadcrumb,
  ZenButton,
  ZenCard,
  ZenCommandMenu,
  ZenConfirmationModal,
  ZenEmptyState,
  ZenErrorState,
  ZenEnsoSvg,
  ZenCheckbox,
  ZenInput,
  ZenLoading,
  ZenPaper,
  ZenRankBadge,
  ZenSeal,
  ZenSelect,
  ZenSidebar,
  ZenSkeleton,
  ZenSuccessState,
  ZenTabs,
  ZenTabsContent,
  ZenTabsList,
  ZenTabsTrigger,
  ZenTextarea,
  ZenToast,
  ZenTooltip,
  ZenDivider,
} from "@kodan/ui/components/zen";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useState } from "react";

type AlertVariant = "success" | "warning" | "error" | "info";

const variants: AlertVariant[] = ["info", "success", "warning", "error"];

const alertCopy: Record<AlertVariant, { title: string; body: string }> = {
  info: {
    title: "Respire antes de seguir",
    body: "Informação neutra com entrada suave, textura de papel e tinta controlada.",
  },
  success: {
    title: "Kata concluído",
    body: "O estado de sucesso usa musgo como acento, mantendo a estética zen discreta.",
  },
  warning: {
    title: "Atenção ao ritmo",
    body: "O aviso destaca cuidado sem ruído visual ou animação exagerada.",
  },
  error: {
    title: "Interrupção no fluxo",
    body: "O erro usa selo vermelho e role alert para priorizar acessibilidade.",
  },
};

const zenInventory = [
  "ZenAlert",
  "ZenButton",
  "ZenCard",
  "ZenPaper",
  "ZenDivider",
  "ZenRankBadge",
  "DanProgress",
  "ZenAchievementSeal",
  "ZenAvatar",
  "ZenProfileCard",
  "ZenSidebar",
  "ZenTabs",
  "ZenBreadcrumb",
  "ZenCommandMenu",
  "ZenSeal",
  "EnsoCircle",
  "ZenEnsoSvg",
  "HankoMarkSvg",
  "SumiDividerSvg",
  "ZenToast",
  "ZenLoading",
  "ZenSkeleton",
  "ZenEmptyState",
  "ZenSuccessState",
  "ZenErrorState",
  "ZenTooltip",
  "ZenConfirmationModal",
  "ZenInput",
  "ZenTextarea",
  "ZenSelect",
  "ZenCheckbox",
  ".zen-paper",
];

export default function ZenPlaygroundPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const [alertVariant, setAlertVariant] = useState<AlertVariant>("info");
  const [alertOpen, setAlertOpen] = useState(true);
  const [toastOpen, setToastOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [stateKey, setStateKey] = useState(0);
  const [ensoKey, setEnsoKey] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  return (
    <main className="min-h-full overflow-auto bg-background px-4 py-8 text-foreground md:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <ZenPlaygroundHeader
          resolvedTheme={resolvedTheme}
          onLightTheme={() => setTheme("light")}
          onDarkTheme={() => setTheme("dark")}
        />
        <ZenNavigationSection onOpenCommand={() => setCommandOpen(true)} />
        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <ZenAlertSection
            cardKey={cardKey}
            alertVariant={alertVariant}
            alertOpen={alertOpen}
            onAlertVariantChange={setAlertVariant}
            onAlertOpenChange={setAlertOpen}
          />
          <ZenEnsoSection ensoKey={ensoKey} onReplay={() => setEnsoKey((value) => value + 1)} />
        </section>
        <ZenHoverAndRankSection cardKey={cardKey} onReplayCard={() => setCardKey((value) => value + 1)} />
        <ZenProgressionSection />
        <ZenLayoutPrimitivesSection />
        <ZenInventorySection />
        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <ZenFeedbackSection
            toastOpen={toastOpen}
            stateKey={stateKey}
            onTestToast={() => {
              setToastOpen(false);
              window.setTimeout(() => setToastOpen(true), 20);
              window.setTimeout(() => setToastOpen(false), 2600);
            }}
            onReplayStates={() => setStateKey((value) => value + 1)}
            onOpenModal={() => setModalOpen(true)}
          />
          <ZenStateSection stateKey={stateKey} />
        </section>
        <ZenFormsSection />
        <ZenSvgAndTokensSection />
      </div>
      <ZenPlaygroundDialogs
        modalOpen={modalOpen}
        commandOpen={commandOpen}
        onCloseModal={() => setModalOpen(false)}
        onCommandOpenChange={setCommandOpen}
      />
    </main>
  );
}

function ZenPlaygroundHeader({
  resolvedTheme,
  onLightTheme,
  onDarkTheme,
}: {
  resolvedTheme?: string;
  onLightTheme: () => void;
  onDarkTheme: () => void;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-border pb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ZenSeal label="Zen UI" />
        <div className="flex gap-2">
          <ZenButton
            variant={resolvedTheme === "light" ? "hanko" : "washi"}
            aria-pressed={resolvedTheme === "light"}
            onClick={onLightTheme}
          >
            <Sun className="size-4" />
            Light
          </ZenButton>
          <ZenButton
            variant={resolvedTheme === "dark" ? "hanko" : "washi"}
            aria-pressed={resolvedTheme === "dark"}
            onClick={onDarkTheme}
          >
            <Moon className="size-4" />
            Dark
          </ZenButton>
        </div>
      </div>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl font-bold tracking-normal md:text-4xl">Zen UI Effects Lab</h1>
        <p className="max-w-2xl text-xs/relaxed text-muted-foreground">
          Teste de microinterações, variantes, tokens light/dark, textura washi, selo vermelho e ensō animado.
        </p>
      </div>
    </header>
  );
}

function ZenNavigationSection({ onOpenCommand }: { onOpenCommand: () => void }) {
  return (
    <section className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <ZenSidebar
        title="Dojo Zen"
        rank={{ label: "Shodan", kind: "dan", level: 1, progress: 42 }}
        items={[
          { label: "Arena", active: true },
          { label: "Katas" },
          { label: "Rituais" },
          { label: "Perfil" },
        ]}
      />
      <ZenCard>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <ZenBreadcrumb
                items={[
                  { label: "Dojo", href: "#" },
                  { label: "Shodan", href: "#" },
                  { label: "Kata" },
                ]}
              />
              <h2 className="text-base font-semibold">Navegação Radix/shadcn-style</h2>
              <p className="text-xs text-[color:var(--zen-muted)]">
                Tabs usam Radix Tabs; command menu usa Radix Dialog com composição própria.
              </p>
            </div>
            <ZenButton variant="ink" onClick={onOpenCommand}>
              Abrir comando
            </ZenButton>
          </div>
          <ZenTabs defaultValue="ritual">
            <ZenTabsList>
              <ZenTabsTrigger value="ritual">Ritual</ZenTabsTrigger>
              <ZenTabsTrigger value="rank">Rank</ZenTabsTrigger>
              <ZenTabsTrigger value="focus">Foco</ZenTabsTrigger>
            </ZenTabsList>
            <ZenTabsContent value="ritual">
              Um espaço com navegação por teclado, seleção acessível e underline em pincelada.
            </ZenTabsContent>
            <ZenTabsContent value="rank">
              A progressão visual usa Dan/Kyu, selo hanko e tinta preenchendo.
            </ZenTabsContent>
            <ZenTabsContent value="focus">
              O estado ativo não depende de cor apenas: há posição, linha e contraste.
            </ZenTabsContent>
          </ZenTabs>
        </div>
      </ZenCard>
    </section>
  );
}

function ZenAlertSection({
  cardKey,
  alertVariant,
  alertOpen,
  onAlertVariantChange,
  onAlertOpenChange,
}: {
  cardKey: number;
  alertVariant: AlertVariant;
  alertOpen: boolean;
  onAlertVariantChange: (variant: AlertVariant) => void;
  onAlertOpenChange: (open: boolean) => void;
}) {
  return (
    <ZenCard key={`alert-card-${cardKey}`} className="min-h-64">
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">ZenAlert</h2>
            <p className="text-xs text-[color:var(--zen-muted)]">Entrada e saída com Framer Motion.</p>
          </div>
          <ZenButton variant="washi" onClick={() => onAlertOpenChange(!alertOpen)}>
            {alertOpen ? "Ocultar alert" : "Mostrar alert"}
          </ZenButton>
        </div>

        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <ZenButton
              key={variant}
              variant={variant === "error" ? "hanko" : "washi"}
              aria-pressed={alertVariant === variant}
              className={alertVariant === variant ? "border-[color:var(--zen-ink)]" : undefined}
              onClick={() => {
                onAlertVariantChange(variant);
                onAlertOpenChange(true);
              }}
            >
              {variant}
            </ZenButton>
          ))}
        </div>

        <ZenAlert
          open={alertOpen}
          variant={alertVariant}
          title={alertCopy[alertVariant].title}
          action={
            <ZenButton variant="ink" onClick={() => onAlertOpenChange(false)}>
              Fechar
            </ZenButton>
          }
        >
          {alertCopy[alertVariant].body}
        </ZenAlert>
      </div>
    </ZenCard>
  );
}

function ZenEnsoSection({ ensoKey, onReplay }: { ensoKey: number; onReplay: () => void }) {
  return (
    <ZenCard key={`enso-card-${ensoKey}`} tone="ink" className="min-h-64">
      <div className="flex h-full flex-col justify-between gap-5">
        <div>
          <h2 className="text-base font-semibold">EnsoCircle</h2>
          <p className="mt-1 text-xs text-[color:color-mix(in_oklch,var(--zen-washi)_72%,transparent)]">
            Desenho por strokeDasharray e strokeDashoffset.
          </p>
        </div>
        <div className="flex items-center justify-center py-3">
          <EnsoCircle title="Círculo ensō sendo desenhado" className="size-36 text-[color:var(--zen-washi)]" />
        </div>
        <ZenButton variant="hanko" onClick={onReplay}>
          <RotateCcw className="size-4" />
          Reanimar ensō
        </ZenButton>
      </div>
    </ZenCard>
  );
}

function ZenHoverAndRankSection({
  cardKey,
  onReplayCard,
}: {
  cardKey: number;
  onReplayCard: () => void;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <ZenCard>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Hover buttons</h2>
            <p className="text-xs text-[color:var(--zen-muted)]">
              Estado normal em cima; estado hover travado embaixo para comparar.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <ZenButton variant="ink">Ink normal</ZenButton>
              <ZenButton variant="washi">Washi normal</ZenButton>
              <ZenButton variant="hanko">Hanko normal</ZenButton>
            </div>
            <div className="flex flex-wrap gap-2">
              <ZenButton variant="ink" data-hover-preview="true">Ink hover</ZenButton>
              <ZenButton variant="washi" data-hover-preview="true">Washi hover</ZenButton>
              <ZenButton variant="hanko" data-hover-preview="true">Hanko hover</ZenButton>
            </div>
          </div>
        </div>
      </ZenCard>

      <ZenCard>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Dan/Kyu</h2>
            <p className="text-xs text-[color:var(--zen-muted)]">Progressão animada e responsiva.</p>
          </div>
          <ZenRankBadge rank={{ label: "Mushin", kind: "kyu", level: 3, progress: 68 }} />
          <ZenRankBadge rank={{ label: "Shodan", kind: "dan", level: 1, progress: 32 }} />
        </div>
      </ZenCard>

      <ZenCard>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Card entrance</h2>
            <p className="text-xs text-[color:var(--zen-muted)]">Remonte o card para testar a entrada calma.</p>
          </div>
          <ZenButton variant="washi" onClick={onReplayCard}>Reanimar card</ZenButton>
          <ZenPaper animated={false} padding="sm" className="text-xs/relaxed">
            ZenPaper centraliza textura, borda, sombra e padding.
          </ZenPaper>
        </div>
      </ZenCard>
    </section>
  );
}

function ZenProgressionSection() {
  return (
    <ZenCard>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold">Progressão</h2>
            <p className="text-xs text-[color:var(--zen-muted)]">Dan/Kyu, progresso e conquista em selo.</p>
          </div>
          <DanProgress value={72} label="Caminho Shodan" />
          <ZenRankBadge rank={{ label: "Nidan", kind: "dan", level: 2, progress: 72 }} />
        </div>
        <ZenAchievementSeal title="Nova Marca" description="Ritual completo sem quebra de fluxo." />
        <div className="zen-paper flex items-center gap-3 border border-[color:var(--zen-border)] p-4">
          <ZenAvatar fallback="G" />
          <div>
            <div className="text-sm font-semibold text-[color:var(--zen-ink)]">Gabriel</div>
            <div className="text-xs text-[color:var(--zen-muted)]">Mushin Kyu</div>
          </div>
        </div>
      </div>
    </ZenCard>
  );
}

function ZenLayoutPrimitivesSection() {
  return (
    <ZenCard>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Layout primitives</h2>
          <p className="text-xs text-[color:var(--zen-muted)]">Base visual reutilizável antes dos componentes específicos.</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <ZenPaper padding="sm" animated={false}>
            <div className="space-y-3">
              <span className="text-xs font-semibold">ZenPaper / washi</span>
              <ZenDivider variant="brush" />
              <p className="text-xs text-[color:var(--zen-muted)]">Papel claro com textura e borda sumi.</p>
            </div>
          </ZenPaper>
          <ZenPaper tone="ink" padding="sm" animated={false}>
            <div className="space-y-3">
              <span className="text-xs font-semibold">ZenPaper / ink</span>
              <ZenDivider variant="seal" />
              <p className="text-xs text-[color:color-mix(in_oklch,var(--zen-washi)_72%,transparent)]">Papel escuro para momentos de foco.</p>
            </div>
          </ZenPaper>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          <ZenDivider variant="brush" />
          <ZenDivider variant="bamboo" />
          <ZenDivider variant="seal" />
          <ZenDivider variant="sumi" />
        </div>
      </div>
    </ZenCard>
  );
}

function ZenInventorySection() {
  return (
    <ZenCard>
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold">Inventário do Zen UI Pack</h2>
          <p className="text-xs text-[color:var(--zen-muted)]">Estes são todos os componentes, SVGs e utilitários Zen criados até agora.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {zenInventory.map((item) => (
            <span key={item} className="zen-paper border border-[color:var(--zen-border)] px-2.5 py-1 text-xs text-[color:var(--zen-ink)]">
              {item}
            </span>
          ))}
        </div>
      </div>
    </ZenCard>
  );
}

function ZenFeedbackSection({
  toastOpen,
  stateKey,
  onTestToast,
  onReplayStates,
  onOpenModal,
}: {
  toastOpen: boolean;
  stateKey: number;
  onTestToast: () => void;
  onReplayStates: () => void;
  onOpenModal: () => void;
}) {
  return (
    <ZenCard>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Feedback & Estado</h2>
          <p className="text-xs text-[color:var(--zen-muted)]">Toast, loading, skeleton, estados finais, tooltip e modal ritual.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ZenButton variant="hanko" onClick={onTestToast}>Testar toast</ZenButton>
          <ZenButton variant="washi" onClick={onReplayStates}>Reanimar estados</ZenButton>
          <ZenButton variant="ink" onClick={onOpenModal}>Abrir modal</ZenButton>
          <ZenTooltip content="Mini pergaminho em hover e focus.">
            <ZenButton variant="washi">Tooltip</ZenButton>
          </ZenTooltip>
        </div>
        <ZenToast open={toastOpen} tone="success" title="Carimbo aplicado">
          O toast entra como um selo rápido sobre papel.
        </ZenToast>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="zen-paper border border-[color:var(--zen-border)] p-3">
            <ZenLoading key={`loading-${stateKey}`} label="Ensō desenhando..." />
          </div>
          <div className="zen-paper space-y-2 border border-[color:var(--zen-border)] p-3">
            <ZenSkeleton className="w-full" />
            <ZenSkeleton className="w-4/5" />
            <ZenSkeleton className="w-2/3" />
          </div>
        </div>
      </div>
    </ZenCard>
  );
}

function ZenStateSection({ stateKey }: { stateKey: number }) {
  return (
    <ZenCard>
      <div className="grid gap-3 sm:grid-cols-2">
        <ZenEmptyState title="Pergaminho vazio">Nenhum registro encontrado neste fluxo.</ZenEmptyState>
        <div className="zen-paper flex min-h-36 items-center justify-center border border-[color:var(--zen-border)] p-4">
          <ZenSuccessState key={`success-${stateKey}`} title="Selo confirmado" />
        </div>
        <ZenErrorState key={`error-${stateKey}`} title="Tinta falhando" className="sm:col-span-2" />
      </div>
    </ZenCard>
  );
}

function ZenFormsSection() {
  return (
    <ZenCard>
      <div className="space-y-5">
        <div>
          <h2 className="text-base font-semibold">Forms</h2>
          <p className="text-xs text-[color:var(--zen-muted)]">Controles de entrada como pergaminho, foco em hanko e checkbox com selo.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <ZenInput label="Nome do kata" placeholder="Race condition dojo" hint="Borda e foco usam tokens Zen." />
          <ZenSelect
            label="Disciplina"
            defaultValue="shodan"
            options={[
              { label: "Mushin Kyu", value: "mushin" },
              { label: "Shodan", value: "shodan" },
              { label: "Nidan", value: "nidan" },
            ]}
          />
          <ZenTextarea label="Observação" placeholder="Escreva como em um pergaminho..." className="md:col-span-2" />
          <ZenCheckbox defaultChecked label="Selar ritual" description="Marca visual com selo vermelho animado." />
        </div>
      </div>
    </ZenCard>
  );
}

function ZenSvgAndTokensSection() {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <ZenCard>
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-semibold">Todos os SVGs</h2>
            <p className="text-xs text-[color:var(--zen-muted)]">Assets vetoriais internos, sem imagem externa.</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="zen-paper flex min-h-28 flex-col items-center justify-center gap-2 border border-[color:var(--zen-border)] p-3">
              <ZenEnsoSvg className="size-14 text-[color:var(--zen-ink)]" />
              <span className="text-[10px] uppercase text-[color:var(--zen-muted)]">ZenEnsoSvg</span>
            </div>
            <div className="zen-paper flex min-h-28 flex-col items-center justify-center gap-2 border border-[color:var(--zen-border)] p-3">
              <HankoMarkSvg className="size-14 text-[color:var(--zen-hanko)]" />
              <span className="text-[10px] uppercase text-[color:var(--zen-muted)]">HankoMarkSvg</span>
            </div>
            <div className="zen-paper flex min-h-28 flex-col items-center justify-center gap-2 border border-[color:var(--zen-border)] p-3">
              <SumiDividerSvg className="h-8 w-full text-[color:var(--zen-ink)]" />
              <span className="text-[10px] uppercase text-[color:var(--zen-muted)]">SumiDividerSvg</span>
            </div>
          </div>
        </div>
      </ZenCard>
      <ZenCard tone="ink">
        <div className="space-y-5">
          <div>
            <h2 className="text-base font-semibold">Tokens light/dark</h2>
            <p className="text-xs text-[color:color-mix(in_oklch,var(--zen-washi)_72%,transparent)]">Os mesmos componentes respondem aos tokens CSS do tema ativo.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["washi", "var(--zen-washi)"],
              ["ink", "var(--zen-ink)"],
              ["sumi", "var(--zen-sumi)"],
              ["hanko", "var(--zen-hanko)"],
              ["moss", "var(--zen-moss)"],
              ["border", "var(--zen-border)"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center gap-2 border border-[color:color-mix(in_oklch,var(--zen-washi)_22%,transparent)] p-2">
                <span className="size-5 border border-[color:color-mix(in_oklch,var(--zen-washi)_35%,transparent)]" style={{ background: value }} />
                <span className="uppercase text-[10px] text-[color:color-mix(in_oklch,var(--zen-washi)_78%,transparent)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </ZenCard>
    </section>
  );
}

function ZenPlaygroundDialogs({
  modalOpen,
  commandOpen,
  onCloseModal,
  onCommandOpenChange,
}: {
  modalOpen: boolean;
  commandOpen: boolean;
  onCloseModal: () => void;
  onCommandOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <ZenConfirmationModal
        open={modalOpen}
        title="Confirmar ritual"
        confirmLabel="Selar"
        cancelLabel="Voltar"
        onCancel={onCloseModal}
        onConfirm={onCloseModal}
      >
        Esta confirmação usa papel, selo e entrada calma para ações que exigem intenção.
      </ZenConfirmationModal>
      <ZenCommandMenu
        open={commandOpen}
        onOpenChange={onCommandOpenChange}
        items={[
          { label: "Iniciar kata", description: "Abrir o próximo desafio", shortcut: "K" },
          { label: "Ver progressão", description: "Consultar Dan/Kyu e conquistas", shortcut: "P" },
          { label: "Alternar tema", description: "Trocar entre washi e ink", shortcut: "T" },
        ]}
      />
    </>
  );
}

