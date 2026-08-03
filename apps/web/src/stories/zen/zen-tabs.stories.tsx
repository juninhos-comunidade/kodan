import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenTabs, ZenTabsContent, ZenTabsList, ZenTabsTrigger } from "@kodan/ui/components/zen";

function ZenTabsDemo({ defaultValue, firstLabel, secondLabel }: { defaultValue: string; firstLabel: string; secondLabel: string }) {
  return <ZenTabs defaultValue={defaultValue} className="w-[min(440px,calc(100vw-2rem))]"><ZenTabsList><ZenTabsTrigger value="diagnostic">{firstLabel}</ZenTabsTrigger><ZenTabsTrigger value="feedback">{secondLabel}</ZenTabsTrigger></ZenTabsList><ZenTabsContent value="diagnostic">Escreva sua hipótese antes de executar o código.</ZenTabsContent><ZenTabsContent value="feedback">O feedback do Tech Lead aparece aqui.</ZenTabsContent></ZenTabs>;
}

const meta = {
  title: "Zen/Navigation/Zen Tabs",
  component: ZenTabsDemo,
  parameters: { layout: "centered" },
  args: { defaultValue: "diagnostic", firstLabel: "Diagnóstico", secondLabel: "Feedback" },
  argTypes: { defaultValue: { control: "radio", options: ["diagnostic", "feedback"] } },
} satisfies Meta<typeof ZenTabsDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
