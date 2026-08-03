import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";

import { AppSidebar } from "@/components/app-sidebar";

const user = { name: "Gabriel Silva", image: null, elo: 1460 };
const meta = {
  title: "Padrões do Produto/Navegação/App Sidebar",
  component: AppSidebar,
  parameters: { layout: "fullscreen" },
  args: {
    collapsed: false,
    mobileOpen: false,
    pathname: "/inicio",
    user,
    onCloseMobile: fn(),
    onToggle: fn(),
  },
  argTypes: {
    collapsed: { control: "boolean", description: "Alterna entre a sidebar expandida e recolhida." },
    mobileOpen: { control: "boolean", description: "Exibe a navegação no estado de painel móvel aberto." },
    pathname: {
      control: "select",
      options: ["/inicio", "/desafios", "/desafios?status=in_progress", "/revisoes", "/simulados", "/perfil", "/ajuda", "/configuracoes"],
      description: "Define a rota e o item ativo.",
    },
    user: { control: "object", description: "Use null para o estado visitante ou edite nome, imagem e ELO." },
    onCloseMobile: { control: false },
    onToggle: { control: false },
  },
  render: (args) => <AppSidebar key={`${args.pathname}-${args.collapsed}-${args.mobileOpen}-${args.user?.name ?? "visitor"}`} {...args} />,
} satisfies Meta<typeof AppSidebar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
export const Expandida: Story = {};
export const Recolhida: Story = { args: { collapsed: true, pathname: "/desafios" } };
export const Visitante: Story = { args: { pathname: "/ajuda", user: null } };
export const MobileAberta: Story = {
  args: { mobileOpen: true, pathname: "/desafios" },
  parameters: { viewport: { defaultViewport: "mobile1" } },
};
