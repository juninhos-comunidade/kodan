import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DanProgress, ZenAchievementSeal, ZenSeal } from "@kodan/ui/components/zen";

type ProgressionArgs = { value: number; label: string; title: string; description: string };

const meta = {
  title: "Zen/Progressão/Outros Componentes",
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(480px,90vw)]"><Story /></div>],
  args: { value: 64, label: "Ascensão", title: "Semana consistente", description: "Treinou por sete dias seguidos." },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    label: { control: "text" },
    title: { control: "text" },
    description: { control: "text" },
  },
} satisfies Meta<ProgressionArgs>;

export default meta;
type Story = StoryObj<ProgressionArgs>;

export const DanProgressStory: Story = { name: "Dan Progress", render: ({ value, label }) => <DanProgress value={value} label={label} /> };
export const ZenAchievementSealStory: Story = { name: "Zen Achievement Seal", render: ({ title, description }) => <ZenAchievementSeal title={title} description={description} /> };
export const ZenSealStory: Story = { name: "Zen Seal", render: ({ label }) => <ZenSeal label={label} /> };
