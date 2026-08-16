import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenCheckbox } from "@kodan/ui/components/zen";

function ZenCheckboxDemo({ checked, label, description, disabled }: { checked: boolean; label: string; description: string; disabled: boolean }) {
  return <ZenCheckbox key={String(checked)} defaultChecked={checked} label={label} description={description} disabled={disabled} />;
}

const meta = {
  title: "Zen/Forms/Zen Checkbox",
  component: ZenCheckboxDemo,
  parameters: { layout: "centered" },
  args: { checked: false, label: "Apenas não resolvidos", description: "Oculta desafios já concluídos.", disabled: false },
} satisfies Meta<typeof ZenCheckboxDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Marcado: Story = { args: { checked: true } };
