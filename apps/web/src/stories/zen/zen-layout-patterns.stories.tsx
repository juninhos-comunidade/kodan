import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenDivider, ZenPaper } from "@kodan/ui/components/zen";

type LayoutArgs = {
  tone: "washi" | "ink";
  padding: "none" | "sm" | "md" | "lg";
  animated: boolean;
  divider: "brush" | "bamboo" | "seal" | "sumi";
  children: string;
};

const meta = {
  title: "Zen/Layout/Outros Componentes",
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(720px,90vw)]"><Story /></div>],
  args: { tone: "washi", padding: "md", animated: true, divider: "brush", children: "Leia o código como quem estuda uma posição: primeiro observe, depois formule a hipótese." },
  argTypes: {
    tone: { control: "radio", options: ["washi", "ink"] },
    padding: { control: "select", options: ["none", "sm", "md", "lg"] },
    animated: { control: "boolean" },
    divider: { control: "select", options: ["brush", "bamboo", "seal", "sumi"] },
    children: { control: "text" },
  },
} satisfies Meta<LayoutArgs>;

export default meta;
type Story = StoryObj<LayoutArgs>;

export const ZenPaperStory: Story = {
  name: "Zen Paper",
  render: ({ tone, padding, animated, children }) => <ZenPaper tone={tone} padding={padding} animated={animated}>{children}</ZenPaper>,
};

export const ZenDividerStory: Story = {
  name: "Zen Divider",
  render: ({ divider }) => <ZenDivider variant={divider} />,
};
