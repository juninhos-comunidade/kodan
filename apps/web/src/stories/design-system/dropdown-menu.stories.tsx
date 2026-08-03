import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@kodan/ui/components/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from "@kodan/ui/components/dropdown-menu";

function DropdownMenuDemo({ label, align, disabled }: { label: string; align: "start" | "center" | "end"; disabled: boolean }) {
  return <DropdownMenu><DropdownMenuTrigger render={<Button variant="outline" />}>{label}</DropdownMenuTrigger><DropdownMenuContent align={align}><DropdownMenuLabel>Conta</DropdownMenuLabel><DropdownMenuItem disabled={disabled}>Abrir perfil<DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem><DropdownMenuItem>Configurações<DropdownMenuShortcut>⌘,</DropdownMenuShortcut></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem variant="destructive">Sair</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

const meta = {
  title: "Design System/Overlays/Dropdown Menu",
  component: DropdownMenuDemo,
  parameters: { layout: "centered" },
  args: { label: "Abrir menu", align: "start", disabled: false },
  argTypes: { align: { control: "radio", options: ["start", "center", "end"] }, label: { control: "text" } },
} satisfies Meta<typeof DropdownMenuDemo>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const AlinhadoAoFim: Story = { args: { align: "end" } };
