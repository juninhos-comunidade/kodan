import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Skeleton } from "@kodan/ui/components/skeleton";

function SkeletonDemo({ width, lines, avatar }: { width: number; lines: number; avatar: boolean }) {
  return <div className="flex items-start gap-3" style={{ width }} >{avatar ? <Skeleton className="size-10 shrink-0" /> : null}<div className="w-full space-y-2">{Array.from({ length: lines }, (_, index) => <Skeleton key={index} className="h-3 w-full" />)}</div></div>;
}

const meta = {
  title: "Design System/Feedback/Skeleton",
  component: SkeletonDemo,
  parameters: { layout: "centered" },
  args: { width: 360, lines: 3, avatar: true },
  argTypes: { width: { control: { type: "range", min: 200, max: 720, step: 20 } }, lines: { control: { type: "range", min: 1, max: 8, step: 1 } } },
} satisfies Meta<typeof SkeletonDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
