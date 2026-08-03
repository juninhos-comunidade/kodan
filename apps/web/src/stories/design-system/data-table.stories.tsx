import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DataTable, type DataTableColumn } from "@kodan/ui/components/profile";

type Row = { id: string; challenge: string; status: string; elo: number };
const allRows: Row[] = [{ id: "1", challenge: "Cleanup de WebSocket", status: "Resolvido", elo: 24 }, { id: "2", challenge: "Closure obsoleta", status: "Em progresso", elo: -8 }, { id: "3", challenge: "Estado derivado", status: "Não iniciado", elo: 0 }];
const columns: DataTableColumn<Row>[] = [{ key: "challenge", header: "Desafio", render: (item) => item.challenge }, { key: "status", header: "Status", render: (item) => item.status }, { key: "elo", header: "ELO", className: "text-right", render: (item) => `${item.elo > 0 ? "+" : ""}${item.elo}` }];

function DataTableDemo({ rows, empty }: { rows: number; empty: boolean }) {
  return <DataTable columns={columns} items={empty ? [] : allRows.slice(0, rows)} emptyMessage="Nenhuma sessão registrada." />;
}

const meta = {
  title: "Design System/Profile/Data Table",
  component: DataTableDemo,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div data-profile-screen="true" className="w-[min(620px,calc(100vw-2rem))] overflow-x-auto bg-[var(--profile-bg)] p-4 text-[var(--profile-text-primary)] sm:p-6"><Story /></div>],
  args: { rows: 3, empty: false },
  argTypes: { rows: { control: { type: "range", min: 1, max: 3, step: 1 } } },
} satisfies Meta<typeof DataTableDemo>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Vazio: Story = { args: { empty: true } };
