import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenInput } from "@kodan/ui/components/zen";

const meta = {
  title: "Zen/Forms/Zen Input",
  component: ZenInput,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  args: { label: "Nome do ritual", hint: "Use um nome curto.", placeholder: "Diagnóstico matinal", disabled: false },
  argTypes: { label: { control: "text" }, hint: { control: "text" }, placeholder: { control: "text" } },
} satisfies Meta<typeof ZenInput>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Desabilitado: Story = { args: { disabled: true, defaultValue: "Ritual bloqueado" } };
