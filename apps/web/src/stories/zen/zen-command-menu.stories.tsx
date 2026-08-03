import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useEffect, useState } from "react";
import { Button } from "@kodan/ui/components/button";
import { ZenCommandMenu, type ZenCommandItem } from "@kodan/ui/components/zen";

const items: ZenCommandItem[] = [{ label: "Abrir desafios", description: "Explorar o catálogo", shortcut: "G D" }, { label: "Ir para o perfil", description: "Ver evolução de ELO", shortcut: "G P" }, { label: "Alternar tema", description: "Light ou dark", shortcut: "T" }];

function CommandMenuDemo({ open, title }: { open: boolean; title: string }) {
  const [visible, setVisible] = useState(open);
  useEffect(() => setVisible(open), [open]);
  return <><Button onClick={() => setVisible(true)}>Abrir command menu</Button><ZenCommandMenu open={visible} onOpenChange={setVisible} items={items} title={title} /></>;
}

const meta = {
  title: "Zen/Overlays/Command Menu",
  component: CommandMenuDemo,
  parameters: { layout: "centered" },
  args: { open: false, title: "Comandos do dojo" },
} satisfies Meta<typeof CommandMenuDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Aberto: Story = { args: { open: true } };
