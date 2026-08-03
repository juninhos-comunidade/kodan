import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Flame } from "lucide-react";
import { AchievementBadge } from "@kodan/ui/components/profile";

const meta = {
  title: "Design System/Profile/Achievement Badge",
  component: AchievementBadge,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div data-profile-screen="true" className="bg-[var(--profile-bg)] p-6"><Story /></div>],
  args: { tone: "orange", children: <Flame className="size-5" /> },
  argTypes: { tone: { control: "select", options: ["blue", "green", "orange", "indigo"] } },
} satisfies Meta<typeof AchievementBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
