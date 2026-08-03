import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ZenSelect } from "@kodan/ui/components/zen";

const options = [{ value: "easy", label: "Fácil" }, { value: "medium", label: "Médio" }, { value: "hard", label: "Difícil" }];
const meta = {
  title: "Zen/Forms/Zen Select",
  component: ZenSelect,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-80"><Story /></div>],
  args: { label: "Dificuldade", hint: "Filtra o catálogo.", placeholder: "Selecionar nível", options, disabled: false, onValueChange: fn() },
  argTypes: { label: { control: "text" }, hint: { control: "text" }, placeholder: { control: "text" } },
} satisfies Meta<typeof ZenSelect>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Selecionado: Story = { args: { defaultValue: "medium" } };
