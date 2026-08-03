import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { Checkbox } from "@kodan/ui/components/checkbox";

const meta = {
  title: "Design System/Primitives/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  args: { checked: false, disabled: false, onCheckedChange: fn(), "aria-label": "Marcar desafio" },
  argTypes: { checked: { control: "boolean" }, disabled: { control: "boolean" } },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const ComTexto: Story = { render: (args) => <label className="flex items-center gap-2 text-xs"><Checkbox {...args} /> Apenas desafios não resolvidos</label> };
export const Marcado: Story = { args: { checked: true } };
export const Desabilitado: Story = { args: { disabled: true } };
