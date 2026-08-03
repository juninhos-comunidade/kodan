import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@kodan/ui/components/alert";

const meta = {
  title: "Design System/Feedback/Alert",
  component: Alert,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(440px,calc(100vw-2rem))]"><Story /></div>],
  args: { variant: "default" },
  argTypes: { variant: { control: "select", options: ["default", "success", "warning", "error", "info"] } },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = { render: (args) => <Alert {...args}><CircleAlert /><AlertTitle>Feedback do Tech Lead</AlertTitle><AlertDescription>Explique por que o cleanup deve remover o listener registrado.</AlertDescription></Alert> };
export const Sucesso: Story = { args: { variant: "success" } };
export const Aviso: Story = { args: { variant: "warning" } };
export const Erro: Story = { args: { variant: "error" } };
export const Informacao: Story = { args: { variant: "info" } };
