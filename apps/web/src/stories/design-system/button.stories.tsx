import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ArrowRight, Save } from "lucide-react";
import { fn } from "storybook/test";

import { Button } from "@kodan/ui/components/button";

const meta = {
  title: "Design System/Primitives/Button",
  component: Button,
  parameters: { layout: "centered" },
  args: { children: "Continuar", variant: "default", size: "default", disabled: false, onClick: fn() },
  argTypes: {
    variant: { control: "select", options: ["default", "outline", "secondary", "ghost", "destructive", "link"] },
    size: { control: "select", options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"] },
    children: { control: "text" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const ComIcone: Story = { args: { children: <><Save /> Salvar diagnóstico</> } };
export const IconeNoFinal: Story = { args: { children: <>Próximo desafio <ArrowRight /></> } };
export const Destrutivo: Story = { args: { variant: "destructive", children: "Excluir tentativa" } };
export const Desabilitado: Story = { args: { disabled: true } };

export const TodasAsVariantes: Story = {
  render: (args) => <div className="flex flex-wrap items-center gap-3">{["default", "outline", "secondary", "ghost", "destructive", "link"].map((variant) => <Button key={variant} {...args} variant={variant as typeof args.variant}>{variant}</Button>)}</div>,
};
