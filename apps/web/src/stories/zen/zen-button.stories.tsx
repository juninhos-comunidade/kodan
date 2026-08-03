import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import { ZenButton } from "@kodan/ui/components/zen";

const meta = {
  title: "Zen/Actions/Zen Button",
  component: ZenButton,
  parameters: { layout: "centered" },
  args: { children: "Iniciar ritual", variant: "ink", disabled: false, onClick: fn() },
  argTypes: { variant: { control: "radio", options: ["ink", "washi", "hanko"] }, children: { control: "text" } },
} satisfies Meta<typeof ZenButton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Washi: Story = { args: { variant: "washi" } };
export const Hanko: Story = { args: { variant: "hanko", children: "Confirmar" } };
export const Desabilitado: Story = { args: { disabled: true } };
