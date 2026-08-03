import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "@kodan/ui/components/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@kodan/ui/components/card";

const meta = {
  title: "Design System/Primitives/Card",
  component: Card,
  parameters: { layout: "centered" },
  decorators: [(Story) => <div className="w-[min(380px,calc(100vw-2rem))]"><Story /></div>],
  args: { size: "default" },
  argTypes: { size: { control: "radio", options: ["default", "sm"] } },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = { render: (args) => <Card {...args}><CardHeader><CardTitle>Diagnóstico atual</CardTitle><CardDescription>Revise o efeito antes de enviar sua resposta.</CardDescription><CardAction><span className="text-primary">+24 ELO</span></CardAction></CardHeader><CardContent><code className="block border border-border bg-muted p-3">useEffect(() =&gt; connect(), [])</code></CardContent><CardFooter className="justify-end gap-2"><Button variant="ghost">Cancelar</Button><Button>Continuar</Button></CardFooter></Card> };
export const Compacto: Story = { args: { size: "sm" } };
