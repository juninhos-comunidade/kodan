import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import FeedbackModal, {
  type FeedbackData,
} from "@/components/feedback-modal";

const meta = {
  title: "Design System/Feedback/FeedbackModal",
  component: FeedbackModal,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    open: true,
    taskName: "011 - Lista de Tarefas que Não Atualiza",
    difficulty: "EASY",
    onClose: fn(),
    onTryAgain: fn(),
    onViewAnswer: fn(),
  },
  argTypes: {
    open: {
      control: "boolean",
    },
    difficulty: {
      control: "select",
      options: ["EASY", "MEDIUM", "HARD"],
    },
  },
} satisfies Meta<typeof FeedbackModal>;

export default meta;

type Story = StoryObj<typeof meta>;

/* =====================================================
   DADOS DOS CENÁRIOS
===================================================== */

const feedbackAbaixoDaNotaDeCorte: FeedbackData = {
  score: 5,
  maxScore: 10,

  eloVariation: 0,

  points: [
    {
      title: "Cleanup de efeitos",
      description:
        "Evitar atualização do estado após o componente ser desmontado.",
      status: "missing",
    },
    {
      title: "Dependências estáveis",
      description:
        "Garantir que as dependências do efeito sejam estáveis.",
      status: "missing",
    },
    {
      title: "Tratamento de erros",
      description:
        "Tratar falhas da requisição antes de atualizar o estado.",
      status: "wrong",
    },
  ],

  techLeadFeedback:
    "Esperando você finalizar seu diagnóstico.",
};


const feedbackParcial: FeedbackData = {
  score: 8,
  maxScore: 10,

  eloVariation: 10,

  points: [
    {
      title: "Cleanup de efeitos",
      description:
        "Evitar atualização do estado após o componente ser desmontado.",
      status: "correct",
    },
    {
      title: "Dependências estáveis",
      description:
        "Garantir que as dependências do efeito sejam estáveis.",
      status: "wrong",
    },
    {
      title: "Tratamento de erros",
      description:
        "Tratar falhas da requisição antes de atualizar o estado.",
      status: "missing",
    },
    {
      title: "Cancelamento da requisição",
      description:
        "Cancelar a requisição quando o componente for desmontado.",
      status: "missing",
    },
  ],

  techLeadFeedback:
    "Esperando você finalizar seu diagnóstico.",

  userAnswer: `useEffect(() => {
  fetch("/api/tasks")
    .then((response) => response.json())
    .then((data) => setRows(data));
}, []);`,

  seniorSolution: `useEffect(() => {
  let isMounted = true;

  fetch("/api/tasks")
    .then((response) => response.json())
    .then((data) => {
      if (isMounted) {
        setRows(data);
      }
    });

  return () => {
    isMounted = false;
  };
}, []);`,

  seniorExplanation:
    "A solução de referência evita atualizar o estado caso o componente seja desmontado antes da resposta chegar.",
};


const feedbackNotaMaxima: FeedbackData = {
  score: 10,
  maxScore: 10,

  eloVariation: 20,

  points: [
    {
      title: "Cleanup de efeitos",
      description:
        "Evitar atualização do estado após o componente ser desmontado.",
      status: "correct",
    },
    {
      title: "Dependências estáveis",
      description:
        "Garantir que as dependências do efeito sejam estáveis.",
      status: "correct",
    },
    {
      title: "Tratamento de erros",
      description:
        "Tratar falhas da requisição antes de atualizar o estado.",
      status: "correct",
    },
    {
      title: "Cancelamento da requisição",
      description:
        "Cancelar a requisição quando o componente for desmontado.",
      status: "correct",
    },
  ],

  techLeadFeedback:
    "Excelente diagnóstico. Você identificou todos os pontos relevantes e apresentou uma solução consistente.",

  userAnswer: `useEffect(() => {
  let isMounted = true;

  fetch("/api/tasks")
    .then((response) => response.json())
    .then((data) => {
      if (isMounted) {
        setRows(data);
      }
    });

  return () => {
    isMounted = false;
  };
}, []);`,

  seniorSolution: `useEffect(() => {
  let isMounted = true;

  fetch("/api/tasks")
    .then((response) => response.json())
    .then((data) => {
      if (isMounted) {
        setRows(data);
      }
    });

  return () => {
    isMounted = false;
  };
}, []);`,

  seniorExplanation:
    "A solução utiliza cleanup para impedir atualizações de estado depois que o componente foi desmontado.",
};

/* =====================================================
   STORIES
===================================================== */

/**
 * Usuário tirou menos de 7.
 *
 * Deve mostrar:
 * - Avaliação final
 * - Elo = 0
 * - Mensagem de nota de corte
 * - Botão Tentar Novamente
 *
 * Não deve mostrar:
 * - Solução sênior
 * - Comparação detalhada
 * - Pontos identificados
 */
export const AbaixoDaNotaDeCorte: Story = {
  name: "Nota abaixo da nota de corte",
  args: {
    feedback: feedbackAbaixoDaNotaDeCorte,
  },
};


/**
 * Usuário tirou entre 7 e 9.9.
 *
 * Deve mostrar:
 * - Avaliação final
 * - Variação Elo
 * - Pontos acertados
 * - Pontos errados
 * - Pontos não identificados como "? ----"
 * - Mensagem para tentar novamente ou ver resposta
 *
 * Não deve mostrar:
 * - Solução sênior inicialmente
 * - Feedback completo do Tech Lead
 */
export const NotaParcial: Story = {
  name: "Nota parcial",
  args: {
    feedback: feedbackParcial,
  },
};


/**
 * Usuário tirou nota máxima.
 *
 * Deve mostrar:
 * - Avaliação final
 * - Variação Elo
 * - Feedback do Tech Lead
 * - Todos os pontos identificados
 * - Comparação com solução sênior
 * - Botão Ir para o próximo desafio
 */
export const NotaMaxima: Story = {
  name: "Nota máxima",
  args: {
    feedback: feedbackNotaMaxima,
  },
};


/**
 * Modal fechado.
 */
export const Fechado: Story = {
  name: "Modal fechado",
  args: {
    open: false,
    feedback: feedbackParcial,
  },
};


/**
 * Nota parcial em desafio MEDIUM.
 */
export const NotaParcialMedium: Story = {
  name: "Nota parcial - Medium",
  args: {
    difficulty: "MEDIUM",
    feedback: feedbackParcial,
  },
};


/**
 * Nota máxima em desafio HARD.
 */
export const NotaMaximaHard: Story = {
  name: "Nota máxima - Hard",
  args: {
    difficulty: "HARD",
    feedback: feedbackNotaMaxima,
  },
};