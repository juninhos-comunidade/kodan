"use client";

import { useEffect, useRef } from "react";

import {
  ACTIVATION_DAY_STORAGE_KEY,
  getActiveDayBucket,
  sendProductEvent,
  toUtcDateKey,
} from "@/lib/product-event-client";
import type { ProductEventInput } from "@/server/training/product-event-store";

const EVENT_DEDUPE_PREFIX = "kodan:product-event:";

export function ProductEventBeacon({
  event,
  dedupeKey,
}: {
  event: ProductEventInput;
  dedupeKey: string;
}) {
  const sentRef = useRef(false);
  const challengeId = "challengeId" in event ? event.challengeId : undefined;
  const contextBucket = "contextBucket" in event
    ? event.contextBucket
    : undefined;

  useEffect(() => {
    if (sentRef.current) return;
    const storageKey = `${EVENT_DEDUPE_PREFIX}${dedupeKey}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "true") {
        sentRef.current = true;
        return;
      }
      window.sessionStorage.setItem(storageKey, "true");
    } catch {
      // O ref ainda evita repetição durante a montagem atual.
    }
    sentRef.current = true;
    void sendProductEvent(event).catch(() => {
      // Métricas de produto nunca interrompem a jornada principal.
    });
  }, [challengeId, contextBucket, dedupeKey, event]);

  return null;
}

export function ActiveDayBeacon() {
  const sentRef = useRef(false);

  useEffect(() => {
    if (sentRef.current) return;
    sentRef.current = true;

    try {
      const activationDay = window.localStorage.getItem(
        ACTIVATION_DAY_STORAGE_KEY,
      );
      if (!activationDay) return;
      const now = new Date();
      const contextBucket = getActiveDayBucket(activationDay, now);
      if (!contextBucket) return;
      const storageKey = `${EVENT_DEDUPE_PREFIX}active_day:${toUtcDateKey(now)}`;
      if (window.localStorage.getItem(storageKey) === "true") return;
      window.localStorage.setItem(storageKey, "true");
      void sendProductEvent({ name: "active_day", contextBucket }).catch(
        () => {
          // A retenção agregada é best effort e não bloqueia a aplicação.
        },
      );
    } catch {
      // Sem storage, não inferimos retenção para evitar contagens instáveis.
    }
  }, []);

  return null;
}
