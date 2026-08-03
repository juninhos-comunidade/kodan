import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenAlert } from "@kodan/ui/components/zen";

const meta = {
  title: "Zen/Feedback/Zen Alert",
  component: ZenAlert,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(480px,calc(100vw-2rem))]"><Story /></div>],
  args: { open: true, variant: "info", title: "Leitura do Tech Lead", children: "Revise a lista de dependências antes de enviar." },
  argTypes: { variant: { control: "select", options: ["success", "warning", "error", "info"] }, title: { control: "text" }, children: { control: "text" } },
} satisfies Meta<typeof ZenAlert>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Sucesso: Story = { args: { variant: "success", title: "Diagnóstico aceito" } };
export const Erro: Story = { args: { variant: "error", title: "Ajuste necessário" } };
