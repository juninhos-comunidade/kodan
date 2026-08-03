import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenRankBadge } from "@kodan/ui/components/zen";

const meta = {
  title: "Zen/Progression/Zen Rank Badge",
  component: ZenRankBadge,
  parameters: { layout: "centered" },
  args: { rank: { label: "Discípulo", kind: "kyu", level: 3, progress: 64 } },
} satisfies Meta<typeof ZenRankBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Dan: Story = { args: { rank: { label: "Mestre", kind: "dan", level: 1, progress: 18 } } };
