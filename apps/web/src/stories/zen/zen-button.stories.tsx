import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import type { ComponentProps, CSSProperties } from "react";
import { fn } from "storybook/test";
import { ZenButton } from "@kodan/ui/components/zen";

type ButtonStoryProps = ComponentProps<typeof ZenButton> & {
  inkColor: string;
  washiColor: string;
  mossColor: string;
  hankoColor: string;
  inkTextColor: string;
  washiTextColor: string;
  mossTextColor: string;
  hankoTextColor: string;
  inkHoverColor: string;
  inkHoverTextColor: string;
  washiHoverColor: string;
  washiHoverTextColor: string;
  mossHoverColor: string;
  mossHoverTextColor: string;
  hankoHoverColor: string;
  hankoHoverTextColor: string;
  hoverShadow: boolean;
  hoverShadowColor: string;
  hoverShadowOpacity: number;
};

function ButtonPlayground({ inkColor, washiColor, mossColor, hankoColor, inkTextColor, washiTextColor, mossTextColor, hankoTextColor, inkHoverColor, inkHoverTextColor, washiHoverColor, washiHoverTextColor, mossHoverColor, mossHoverTextColor, hankoHoverColor, hankoHoverTextColor, hoverShadow, hoverShadowColor, hoverShadowOpacity, ...buttonProps }: ButtonStoryProps) {
  const style = {
    ...(inkColor ? { "--zen-button-ink": inkColor } : {}),
    ...(washiColor ? { "--zen-button-washi": washiColor } : {}),
    ...(mossColor ? { "--zen-button-moss": mossColor } : {}),
    ...(hankoColor ? { "--zen-button-hanko": hankoColor } : {}),
    ...(inkTextColor ? { "--zen-button-ink-text": inkTextColor } : {}),
    ...(washiTextColor ? { "--zen-button-washi-text": washiTextColor } : {}),
    ...(mossTextColor ? { "--zen-button-moss-text": mossTextColor } : {}),
    ...(hankoTextColor ? { "--zen-button-hanko-text": hankoTextColor } : {}),
    ...(inkHoverColor ? { "--zen-button-ink-hover": inkHoverColor } : {}),
    ...(inkHoverTextColor ? { "--zen-button-ink-hover-text": inkHoverTextColor } : {}),
    ...(washiHoverColor ? { "--zen-button-washi-hover": washiHoverColor } : {}),
    ...(washiHoverTextColor ? { "--zen-button-washi-hover-text": washiHoverTextColor } : {}),
    ...(mossHoverColor ? { "--zen-button-moss-hover": mossHoverColor } : {}),
    ...(mossHoverTextColor ? { "--zen-button-moss-hover-text": mossHoverTextColor } : {}),
    ...(hankoHoverColor ? { "--zen-button-hanko-hover": hankoHoverColor } : {}),
    ...(hankoHoverTextColor ? { "--zen-button-hanko-hover-text": hankoHoverTextColor } : {}),
    ...(hoverShadowColor ? { "--zen-button-hover-shadow-color": hoverShadowColor } : {}),
    "--zen-button-hover-shadow-opacity": `${hoverShadow ? hoverShadowOpacity : 0}%`,
  } as CSSProperties;

  return <div style={style}><ZenButton {...buttonProps} /></div>;
}

const meta = {
  title: "Zen/Actions/Zen Button",
  component: ButtonPlayground,
  parameters: { layout: "centered" },
  args: { children: "Iniciar ritual", variant: "ink", disabled: false, onClick: fn(), inkColor: "", washiColor: "", mossColor: "", hankoColor: "", inkTextColor: "", washiTextColor: "", mossTextColor: "", hankoTextColor: "", inkHoverColor: "", inkHoverTextColor: "", washiHoverColor: "", washiHoverTextColor: "", mossHoverColor: "", mossHoverTextColor: "", hankoHoverColor: "", hankoHoverTextColor: "", hoverShadow: true, hoverShadowColor: "", hoverShadowOpacity: 22 },
  argTypes: { variant: { control: "radio", options: ["ink", "washi", "moss", "hanko"] }, children: { control: "text" }, inkColor: { control: "color" }, washiColor: { control: "color" }, mossColor: { control: "color" }, hankoColor: { control: "color" }, inkTextColor: { control: "color" }, washiTextColor: { control: "color" }, mossTextColor: { control: "color" }, hankoTextColor: { control: "color" }, inkHoverColor: { control: "color" }, inkHoverTextColor: { control: "color" }, washiHoverColor: { control: "color" }, washiHoverTextColor: { control: "color" }, mossHoverColor: { control: "color" }, mossHoverTextColor: { control: "color" }, hankoHoverColor: { control: "color" }, hankoHoverTextColor: { control: "color" }, hoverShadow: { control: "boolean" }, hoverShadowColor: { control: "color" }, hoverShadowOpacity: { control: { type: "range", min: 0, max: 60, step: 1 } } },
} satisfies Meta<typeof ButtonPlayground>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Playground: Story = {};
export const Washi: Story = { args: { variant: "washi" } };
export const Moss: Story = { args: { variant: "moss", children: "Ver resposta" } };
export const Hanko: Story = { args: { variant: "hanko", children: "Confirmar" } };
export const Desabilitado: Story = { args: { disabled: true } };
