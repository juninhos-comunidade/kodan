import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { ProfileAchievementsCard } from "@/app/(protected)/perfil/profile-achievements-card";
import { ProfileContent } from "@/app/(protected)/perfil/profile-content";
import { ProfileEloChartCard } from "@/app/(protected)/perfil/profile-elo-chart-card";
import { ProfileHero } from "@/app/(protected)/perfil/profile-hero";
import { ProfileRecentSessionsCard } from "@/app/(protected)/perfil/profile-recent-sessions-card";
import { ProfileRecommendationsCard } from "@/app/(protected)/perfil/profile-recommendations-card";
import { ProfileStatsRow } from "@/app/(protected)/perfil/profile-stats-row";
import { ProfileTopicMasteryCard } from "@/app/(protected)/perfil/profile-topic-mastery-card";
import type { ProfileViewModel } from "@/app/(protected)/perfil/profile-types";

const profile: ProfileViewModel = {
  user: { id: "user-1", name: "Gabriel Silva", bio: "Frontend engineer praticando diagnósticos React.", image: null, planLabel: "Praticante", tagline: "Consistência antes da velocidade", memberSinceLabel: "Membro desde jul. 2026", countryLabel: "Brasil", timezoneLabel: "São Paulo (UTC-3)", rank: "3º Kyu", rankKanji: "参", elo: 1460, topPercentLabel: "Top 18%" },
  stats: [{ id: "streak", label: "Sequência", value: "7 dias", accent: "warning" }, { id: "solved", label: "Resolvidos", value: "24" }, { id: "accuracy", label: "Precisão", value: "82%" }, { id: "time", label: "Tempo médio", value: "11 min" }],
  eloSeries: [{ dateLabel: "01 jul", elo: 1120 }, { dateLabel: "08 jul", elo: 1210 }, { dateLabel: "15 jul", elo: 1320 }, { dateLabel: "22 jul", elo: 1390 }, { dateLabel: "29 jul", elo: 1460 }],
  topicMastery: [{ topicId: "effects", label: "Effects", proficiency: 86 }, { topicId: "state", label: "State", proficiency: 68 }, { topicId: "performance", label: "Performance", proficiency: 44 }, { topicId: "architecture", label: "Arquitetura", proficiency: 0, locked: true, unlockHint: "Resolva 3 desafios avançados" }],
  recentSessions: [{ id: "s1", dateLabel: "Hoje", challenge: "Cleanup de WebSocket", difficulty: "MEDIUM", result: "resolved", eloChange: 28 }, { id: "s2", dateLabel: "Ontem", challenge: "Closure obsoleta", difficulty: "HARD", result: "in_progress", eloChange: -8 }],
  recommendations: [{ id: "c1", challenge: "Corrida de requisições", topic: "Effects", difficulty: "HARD", possibleElo: 42 }, { id: "c2", challenge: "Memoização seletiva", topic: "Performance", difficulty: "MEDIUM", possibleElo: 25 }],
  achievements: [{ id: "a1", title: "Primeiro diagnóstico", description: "Concluiu o primeiro desafio.", unlockedAtLabel: "12 jul. 2026", tone: "blue" }, { id: "a2", title: "Semana consistente", description: "Treinou por sete dias seguidos.", unlockedAtLabel: "29 jul. 2026", tone: "orange" }],
};

const meta = {
  title: "Telas/Perfil",
  component: ProfileContent,
  parameters: { layout: "fullscreen" },
  decorators: [(Story) => <div data-profile-screen="true" className="min-h-screen bg-[var(--profile-bg)] p-6 text-[var(--profile-text-primary)]"><Story /></div>],
  args: { profile },
  argTypes: { profile: { control: "object", description: "Edite o view model completo para testar conteúdo, quantidades e estados." } },
} satisfies Meta<typeof ProfileContent>;
export default meta;
type Story = StoryObj<typeof meta>;

export const PerfilCompleto: Story = {};
export const Hero: Story = { render: () => <ProfileHero user={profile.user} /> };
export const Estatisticas: Story = { render: () => <ProfileStatsRow stats={profile.stats} /> };
export const GraficoDeElo: Story = { render: () => <ProfileEloChartCard points={profile.eloSeries} /> };
export const DominioPorTopico: Story = { render: () => <ProfileTopicMasteryCard topics={profile.topicMastery} /> };
export const SessoesRecentes: Story = { render: () => <ProfileRecentSessionsCard sessions={profile.recentSessions} /> };
export const Recomendacoes: Story = { render: () => <ProfileRecommendationsCard recommendations={profile.recommendations} /> };
export const Conquistas: Story = { render: () => <ProfileAchievementsCard achievements={profile.achievements} /> };
