import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@kodan/ui/components/button";
import { SectionCard } from "@kodan/ui/components/profile";

function SectionCardDemo({ title, body, showAction, showFooter }: { title: string; body: string; showAction: boolean; showFooter: boolean }) {
  return <SectionCard title={title} action={showAction ? <Button variant="ghost" size="sm">Ver tudo</Button> : undefined} footer={showFooter ? <span className="text-xs text-[var(--profile-text-secondary)]">Atualizado agora</span> : undefined}><p className="py-2 text-sm text-[var(--profile-text-secondary)]">{body}</p></SectionCard>;
}

const meta = {
  title: "Design System/Profile/Section Card",
  component: SectionCardDemo,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div data-profile-screen="true" className="w-[min(440px,calc(100vw-2rem))] bg-[var(--profile-bg)] p-4 sm:p-5"><Story /></div>],
  args: { title: "Evolução do ELO", body: "Conteúdo do painel de perfil.", showAction: true, showFooter: true },
} satisfies Meta<typeof SectionCardDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
