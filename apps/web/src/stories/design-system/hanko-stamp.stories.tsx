import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { HankoStamp } from "@kodan/ui/components/hanko-stamp";

const meta = {
  title: "Design System/Identidade/Hanko Stamp",
  component: HankoStamp,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="relative grid size-28 place-items-center border border-border bg-background"><Story /><span className="relative z-10 text-xs text-foreground">KODAN</span></div>],
} satisfies Meta<typeof HankoStamp>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Padrao: Story = {};
