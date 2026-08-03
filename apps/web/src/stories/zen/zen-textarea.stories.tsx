import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenTextarea } from "@kodan/ui/components/zen";

const meta = {
  title: "Zen/Forms/Zen Textarea",
  component: ZenTextarea,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(440px,calc(100vw-2rem))]"><Story /></div>],
  args: { label: "Seu diagnóstico", hint: "Explique causa e correção.", placeholder: "O efeito registra um listener...", rows: 5, disabled: false },
  argTypes: { label: { control: "text" }, hint: { control: "text" }, placeholder: { control: "text" }, rows: { control: { type: "range", min: 3, max: 12, step: 1 } } },
} satisfies Meta<typeof ZenTextarea>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
