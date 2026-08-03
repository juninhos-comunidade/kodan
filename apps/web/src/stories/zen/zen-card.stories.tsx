import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenCard } from "@kodan/ui/components/zen";

const meta = {
  title: "Zen/Layout/Zen Card",
  component: ZenCard,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(420px,calc(100vw-2rem))]"><Story /></div>],
  args: { tone: "washi", children: <><h2 className="text-lg font-semibold">Ritual de leitura</h2><p className="mt-2 text-sm opacity-75">Observe o código antes de formular uma hipótese.</p></> },
  argTypes: { tone: { control: "radio", options: ["washi", "ink"] } },
} satisfies Meta<typeof ZenCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Ink: Story = { args: { tone: "ink" } };
