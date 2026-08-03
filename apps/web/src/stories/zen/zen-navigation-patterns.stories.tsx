import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen, CircleHelp, Swords } from "lucide-react";
import { ZenBreadcrumb, ZenSidebar } from "@kodan/ui/components/zen";

type NavigationArgs = {
  title: string;
  activeItem: "inicio" | "desafios" | "ajuda";
  showRank: boolean;
};

const meta = {
  title: "Zen/Navegação/Outros Componentes",
  parameters: { layout: "centered" },
  args: { title: "Dojo Gabriel", activeItem: "desafios", showRank: true },
  argTypes: {
    title: { control: "text" },
    activeItem: { control: "radio", options: ["inicio", "desafios", "ajuda"] },
    showRank: { control: "boolean" },
  },
} satisfies Meta<NavigationArgs>;

export default meta;
type Story = StoryObj<NavigationArgs>;

export const ZenBreadcrumbStory: Story = {
  name: "Zen Breadcrumb",
  render: () => <ZenBreadcrumb items={[{ id: "dojo", label: "Dojo", href: "#" }, { id: "react", label: "React", href: "#" }, { id: "effects", label: "Effects" }]} />,
};

export const ZenSidebarStory: Story = {
  name: "Zen Sidebar",
  render: ({ title, activeItem, showRank }: NavigationArgs) => (
    <ZenSidebar
      title={title}
      rank={showRank ? { label: "3º Kyu", kind: "kyu", level: 3, progress: 64 } : undefined}
      items={[
        { id: "inicio", label: "Início", icon: <BookOpen className="size-4" />, active: activeItem === "inicio" },
        { id: "desafios", label: "Desafios", icon: <Swords className="size-4" />, active: activeItem === "desafios" },
        { id: "ajuda", label: "Ajuda", icon: <CircleHelp className="size-4" />, active: activeItem === "ajuda" },
      ]}
    />
  ),
};
