"use client";

import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { sendProductEvent } from "@/lib/product-event-client";
import type { ProductEventInput } from "@/server/training/product-event-store";

export function LandingTrackedLink({ event, children, ...props }: Omit<ComponentProps<typeof Link>, "children"> & {
  event: Extract<ProductEventInput, { name: "landing_cta_clicked" }>;
  children: ReactNode;
}) {
  return (
    <Link
      {...props}
      data-landing-cta={event.contextBucket}
      onClick={(clickEvent) => {
        props.onClick?.(clickEvent);
        void sendProductEvent(event).catch(() => {
          // A navegação não depende da telemetria agregada.
        });
      }}
    >
      {children}
    </Link>
  );
}
