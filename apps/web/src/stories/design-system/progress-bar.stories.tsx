import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ProgressBar } from "@kodan/ui/components/profile";

const meta = {
  title: "Design System/Profile/Progress Bar",
  component: ProgressBar,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div data-profile-screen="true" className="w-96 bg-[var(--profile-bg)] p-6"><Story /></div>],
  args: { value: 68, label: "Domínio de React: 68%" },
  argTypes: { value: { control: { type: "range", min: 0, max: 100, step: 1 } } },
} satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Completo: Story = { args: { value: 100 } };
