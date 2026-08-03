import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "@kodan/ui/components/input";
import { Label } from "@kodan/ui/components/label";

const meta = {
  title: "Design System/Primitives/Input",
  component: Input,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  args: { type: "text", placeholder: "Digite sua resposta", disabled: false, "aria-invalid": false },
  argTypes: { type: { control: "select", options: ["text", "email", "password", "search", "number"] }, placeholder: { control: "text" } },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const ComLabel: Story = { render: (args) => <div className="space-y-2"><Label htmlFor="answer">Resposta</Label><Input {...args} id="answer" /></div> };
export const Invalido: Story = { args: { "aria-invalid": true, defaultValue: "Resposta incompleta" } };
export const Desabilitado: Story = { args: { disabled: true, defaultValue: "Campo bloqueado" } };
