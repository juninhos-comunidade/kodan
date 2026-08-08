import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import DashboardHome, { type DashboardChallenge } from "@/app/(public)/inicio/dashboard-home";
import { ChallengeCodePreview } from "@/app/(public)/inicio/dashboard-home/challenge-code-preview";
import { DashboardHomeHeader } from "@/app/(public)/inicio/dashboard-home/dashboard-home-header";
import { DashboardNavigation } from "@/app/(public)/inicio/dashboard-home/dashboard-navigation";
import { DashboardRankMenu } from "@/app/(public)/inicio/dashboard-home/dashboard-rank-menu";
import { DojoInitiationCard } from "@/app/(public)/inicio/dashboard-home/dojo-initiation-card";
import { RecommendedChallengeCard } from "@/app/(public)/inicio/dashboard-home/recommended-challenge-card";
import { useDashboardThemeAssets } from "@/app/(public)/inicio/dashboard-home/use-dashboard-theme-assets";

const challenge: DashboardChallenge = { id: "cleanup-websocket", title: "Evite vazamentos em uma conexão WebSocket", difficulty: "MEDIUM", tags: ["React", "useEffect", "cleanup"], question: "O componente mantém listeners ativos depois do unmount. Encontre a causa e proponha a correção.", code: `useEffect(() => {\n  socket.addEventListener("message", onMessage);\n}, [socket]);` };
const meta = {
  title: "Telas/Início",
  component: DashboardHome,
  parameters: { layout: "fullscreen" },
  args: {
    challenge,
    challengeCount: 32,
    recommendationReason: "CONTINUE_RECENT",
    userName: "Gabriel",
    userImage: null,
  },
  argTypes: {
    challenge: { control: "object" },
    challengeCount: { control: { type: "number", min: 0 } },
    recommendationReason: { control: "select", options: ["CONTINUE_RECENT", "PERSONALIZED", "POPULAR_BEGINNER", "FALLBACK"] },
    userName: { control: "text" },
    userImage: { control: "text" },
  },
} satisfies Meta<typeof DashboardHome>;
export default meta;
type Story = StoryObj<typeof meta>;

export const DashboardCompleto: Story = {};
export const Cabecalho: Story = { render: () => <DashboardHomeHeader userName="Gabriel" userImage={null} /> };
export const DesafioRecomendado: Story = { render: () => <div className="p-6"><RecommendedChallengeCard challenge={challenge} recommendationReason="PERSONALIZED" /></div> };
export const PreviewDeCodigo: Story = { parameters: { layout: "centered" }, render: () => <div className="h-[420px] w-[640px]"><ChallengeCodePreview code={challenge.code} /></div> };
export const MenuDeRank: Story = { parameters: { layout: "centered" }, render: () => <DashboardRankMenu userElo={1460} /> };
export const NavegacaoDoDashboard: Story = { render: () => <DashboardAssetsDemo variant="navigation" /> };
export const IniciacaoDoDojo: Story = { render: () => <div className="p-6"><DashboardAssetsDemo variant="initiation" /></div> };

function DashboardAssetsDemo({ variant }: { variant: "navigation" | "initiation" }) {
  const assets = useDashboardThemeAssets();
  return variant === "navigation" ? <DashboardNavigation challengeCount={32} icons={assets} /> : <DojoInitiationCard icon={assets.initiation} />;
}
