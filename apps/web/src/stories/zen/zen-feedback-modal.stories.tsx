import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { ZenFeedbackModal, type ZenFeedbackData } from "@kodan/ui/components/zen";
import { fn } from "storybook/test";

const partialFeedback: ZenFeedbackData = {
  score: 8,
  maxScore: 10,
  eloVariation: 10,
  points: [
    { title: "Cleanup de efeitos", description: "Evita atualizações após o componente desmontar.", status: "correct" },
    { title: "Dependências estáveis", description: "Mantém o efeito previsível entre renderizações.", status: "wrong" },
    { title: "Cancelamento da requisição", description: "Interrompe trabalho que já não é necessário.", status: "missing" },
  ],
  techLeadFeedback: "Você encontrou a causa principal. A referência mostra como fechar os detalhes restantes.",
};

const meta = {
  title: "Zen/Feedback/Modal de Resultado",
  component: ZenFeedbackModal,
  parameters: { layout: "fullscreen" },
  args: {
    open: true,
    taskName: "011 - Lista de tarefas que não atualiza",
    feedback: partialFeedback,
    onClose: fn(),
    onTryAgain: fn(),
    onViewAnswer: fn(),
    onNextChallenge: fn(),
  },
  argTypes: { open: { control: "boolean" } },
} satisfies Meta<typeof ZenFeedbackModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NotaParcial: Story = {};
export const AcertosEOmissoes: Story = { args: { feedback: partialFeedback }, parameters: { docs: { disable: true } } };
export const AbaixoDaNotaDeCorte: Story = { args: { feedback: { ...partialFeedback, score: 5, eloVariation: 0 } }, parameters: { docs: { disable: true } } };
export const NotaMaxima: Story = { args: { feedback: { ...partialFeedback, score: 10, eloVariation: 20, points: partialFeedback.points.map((point) => ({ ...point, status: "correct" })) } }, parameters: { docs: { disable: true } } };
