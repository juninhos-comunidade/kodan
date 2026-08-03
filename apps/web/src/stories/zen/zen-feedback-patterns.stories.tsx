import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import {
  ZenConfirmationModal,
  ZenEmptyState,
  ZenErrorState,
  ZenLoading,
  ZenSkeleton,
  ZenSuccessState,
  ZenToast,
  ZenTooltip,
} from "@kodan/ui/components/zen";
import { useEffect, useState } from "react";
import { fn } from "storybook/test";

type FeedbackArgs = {
  open: boolean;
  tone: "success" | "warning" | "error" | "info";
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
};

const meta = {
  title: "Zen/Feedback/Outros Componentes",
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(480px,90vw)]"><Story /></div>],
  args: { open: true, tone: "info", title: "Leitura concluída", description: "A hipótese está pronta para revisão.", confirmLabel: "Confirmar", cancelLabel: "Cancelar" },
  argTypes: {
    open: { control: "boolean" },
    tone: { control: "select", options: ["success", "warning", "error", "info"] },
    title: { control: "text" },
    description: { control: "text" },
    confirmLabel: { control: "text" },
    cancelLabel: { control: "text" },
  },
} satisfies Meta<FeedbackArgs>;

export default meta;
type Story = StoryObj<FeedbackArgs>;

export const ZenToastStory: Story = { name: "Zen Toast", render: ({ open, tone, title, description }) => <ZenToast open={open} tone={tone} title={title}>{description}</ZenToast> };
export const ZenLoadingStory: Story = { name: "Zen Loading", render: ({ title }) => <ZenLoading label={title} /> };
export const ZenSkeletonStory: Story = { name: "Zen Skeleton", render: () => <div className="space-y-3"><ZenSkeleton className="w-80" /><ZenSkeleton className="w-64" /><ZenSkeleton className="w-44" /></div> };
export const ZenEmptyStateStory: Story = { name: "Zen Empty State", render: ({ title, description }) => <ZenEmptyState title={title}>{description}</ZenEmptyState> };
export const ZenSuccessStateStory: Story = { name: "Zen Success State", render: ({ title }) => <ZenSuccessState title={title} /> };
export const ZenErrorStateStory: Story = { name: "Zen Error State", render: ({ title }) => <ZenErrorState title={title} /> };
export const ZenTooltipStory: Story = { name: "Zen Tooltip", render: ({ description }) => <ZenTooltip content={description}><button type="button" className="zen-focus border border-[color:var(--zen-border)] px-4 py-2 text-xs">Passe o cursor ou use Tab</button></ZenTooltip> };
export const ZenConfirmationModalStory: Story = {
  name: "Zen Confirmation Modal",
  render: (args) => <ConfirmationDemo {...args} />,
};

function ConfirmationDemo({ open, title, description, confirmLabel, cancelLabel }: FeedbackArgs) {
  const [visible, setVisible] = useState(open);
  useEffect(() => setVisible(open), [open]);

  return (
    <>
      <button type="button" className="border border-[color:var(--zen-border)] px-4 py-2 text-xs" onClick={() => setVisible(true)}>Abrir modal</button>
      <ZenConfirmationModal open={visible} title={title} confirmLabel={confirmLabel} cancelLabel={cancelLabel} onConfirm={fn()} onCancel={() => setVisible(false)}>
        {description}
      </ZenConfirmationModal>
    </>
  );
}
