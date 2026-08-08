import { Flame } from "lucide-react";

import { SectionCard } from "@kodan/ui/components/profile";
import type { ProfileStatItem } from "./profile-types";

export function ProfileStatsRow({ stats }: { stats: ProfileStatItem[] }) {
  return (
    <SectionCard className="rounded-[8px]">
      <dl className="grid gap-y-5 pt-5 pb-0 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.id}
            className="px-5 text-center lg:border-r lg:border-[color:var(--profile-border)] lg:last:border-r-0"
          >
            <dt className="text-xs text-[var(--profile-text-secondary)]">
              {stat.label}
            </dt>
            <dd className="mt-2 flex items-center justify-center gap-2 font-serif text-2xl font-medium text-[var(--profile-text-primary)]">
              {stat.accent === "warning" ? (
                <Flame
                  className="size-5 text-[var(--profile-warning)]"
                  aria-hidden="true"
                />
              ) : null}
              <span>{stat.value}</span>
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
