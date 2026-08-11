import type { Route } from "next";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, UsersRound, type LucideIcon } from "lucide-react";

import type { DashboardThemeAssets } from "./use-dashboard-theme-assets";

type DashboardNavigationCardProps = {
  title: string;
  description: string;
  footer: string;
  href: Route;
  icon: StaticImageData;
  footerIcon: LucideIcon;
};

function DashboardNavigationCard({ title, description, footer, href, icon, footerIcon: FooterIcon }: DashboardNavigationCardProps) {
  return (
    <Link href={href} className="group relative flex min-h-56 items-center overflow-hidden rounded-2xl border border-[color:var(--dojo-border)] bg-transparent p-6 transition-[transform,border-color] duration-200 motion-safe:hover:-translate-y-1 hover:border-[color:var(--dojo-accent-border)]">
      <Image src={icon} alt="" width={500} height={500} className="pointer-events-none absolute left-5 top-1/2 z-10 size-24 -translate-y-1/2 object-contain transition-transform duration-200 motion-safe:group-hover:scale-105" />
      <div className="relative z-10 flex min-h-44 flex-1 flex-col justify-center pl-28 pr-12">
        <h2 className="font-serif text-2xl font-bold text-[var(--dojo-ink)]">{title}</h2>
        <p className="mt-3 min-h-12 max-w-60 text-sm leading-6 text-[var(--dojo-muted)]">{description}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--dojo-ink-soft)]">
          <FooterIcon className="size-4 shrink-0" aria-hidden="true" />
          <span>{footer}</span>
        </div>
      </div>
      <span className="absolute bottom-6 right-6 z-10 grid size-11 place-items-center rounded-full border border-[color:var(--dojo-border-strong)] text-[var(--dojo-ink)] transition-colors duration-200 group-hover:bg-[var(--dojo-accent)] group-hover:text-[var(--dojo-surface)]">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </Link>
  );
}

function TrainingNavigationCard({ challengeCount, icon }: { challengeCount: number; icon: StaticImageData }) {
  return (
    <DashboardNavigationCard
      title="Treinos Avulsos"
      description="Desafios rápidos para manter sua mente afiada."
      footer={`${challengeCount} desafios disponíveis`}
      footerIcon={UsersRound}
      icon={icon}
      href="/desafios"
    />
  );
}

function ReviewsNavigationCard({ icon }: { icon: StaticImageData }) {
  return (
    <RoadmapNavigationCard
      title="Revisões"
      description="Acompanhe suas tentativas e os feedbacks do Tech Lead."
      footer="Em breve"
      footerIcon={BookOpen}
      icon={icon}
    />
  );
}

function SimulatorNavigationCard({ icon }: { icon: StaticImageData }) {
  return (
    <RoadmapNavigationCard
      title="Simulados"
      description="Simule uma sequência real e avalie seu desempenho."
      footer="Em breve"
      footerIcon={UsersRound}
      icon={icon}
    />
  );
}

function RoadmapNavigationCard({ title, description, footer, icon, footerIcon: FooterIcon }: Omit<DashboardNavigationCardProps, "href">) {
  return (
    <article data-roadmap-state="unavailable" className="relative flex min-h-56 items-center overflow-hidden rounded-2xl border border-dashed border-[color:var(--dojo-border)] bg-transparent p-6 opacity-75">
      <Image src={icon} alt="" width={500} height={500} className="pointer-events-none absolute left-5 top-1/2 z-10 size-24 -translate-y-1/2 object-contain grayscale" />
      <div className="relative z-10 flex min-h-44 flex-1 flex-col justify-center pl-28 pr-4">
        <span className="mb-3 w-fit rounded-full border border-[color:var(--dojo-border-strong)] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--dojo-accent)]">Em breve</span>
        <h2 className="font-serif text-2xl font-bold text-[var(--dojo-ink)]">{title}</h2>
        <p className="mt-3 min-h-12 max-w-60 text-sm leading-6 text-[var(--dojo-muted)]">{description}</p>
        <div className="mt-5 flex items-center gap-2 text-xs text-[var(--dojo-ink-soft)]"><FooterIcon className="size-4 shrink-0" aria-hidden="true" /><span>{footer}</span></div>
      </div>
    </article>
  );
}

export function DashboardNavigation({ challengeCount, icons }: { challengeCount: number; icons: DashboardThemeAssets }) {
  
  
  return (
    <aside className="grid gap-5 md:grid-cols-3 2xl:block 2xl:space-y-5">
      <TrainingNavigationCard challengeCount={challengeCount} icon={icons.training} />
      <ReviewsNavigationCard icon={icons.review} />
      <SimulatorNavigationCard icon={icons.simulation} />
    </aside>
  );
}
