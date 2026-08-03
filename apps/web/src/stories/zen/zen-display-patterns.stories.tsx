import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenAvatar, ZenProfileCard } from "@kodan/ui/components/zen";

type DisplayArgs = {
  name: string;
  subtitle: string;
  fallback: string;
  seal: boolean;
  xp: number;
};

const meta = {
  title: "Zen/Display/Componentes",
  parameters: { layout: "centered" },
  args: { name: "Gabriel Silva", subtitle: "Consistência antes da velocidade", fallback: "GS", seal: true, xp: 64 },
  argTypes: {
    name: { control: "text" },
    subtitle: { control: "text" },
    fallback: { control: "text" },
    seal: { control: "boolean" },
    xp: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
} satisfies Meta<DisplayArgs>;

export default meta;
type Story = StoryObj<DisplayArgs>;

export const ZenAvatarStory: Story = {
  name: "Zen Avatar",
  render: ({ fallback, seal }: DisplayArgs) => <ZenAvatar fallback={fallback} seal={seal} />,
};

export const ZenProfileCardStory: Story = {
  name: "Zen Profile Card",
  render: ({ name, subtitle, xp }: DisplayArgs) => (
    <ZenProfileCard className="w-[360px]" name={name} subtitle={subtitle} xp={xp} rank={{ label: "3º Kyu", kind: "kyu", level: 3, progress: xp }} />
  ),
};
