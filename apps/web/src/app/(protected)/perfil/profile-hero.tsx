"use client";

import type { ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import {
  CalendarDays,
  Camera,
  Check,
  Pencil,
  X,
} from "lucide-react";

import { ZenToast } from "@kodan/ui/components/zen";
import { updateLocalUserProfile } from "../../actions";
import { useZenToast } from "@/hooks/use-zen-toast";
import type { ProfileUserSummary } from "./profile-types";

export function ProfileHero({ user }: { user: ProfileUserSummary }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [image, setImage] = useState(user.image);
  const [isPending, startTransition] = useTransition();
  const { toast, showToast } = useZenToast();

  const cancelEditing = () => {
    setName(user.name);
    setBio(user.bio);
    setEditing(false);
  };

  const saveProfile = (nextImage = image) => {
    startTransition(async () => {
      const result = await updateLocalUserProfile({
        name,
        bio,
        image: nextImage,
      });

      if (!result.success) {
        showToast("error", "Falha ao atualizar", result.error ?? "Erro ao atualizar perfil.");
        return;
      }

      setEditing(false);
      showToast("success", "Perfil atualizado", "Suas alterações foram salvas com sucesso.");
      router.refresh();
    });
  };

  const selectAvatar = () => {
    fileInputRef.current?.click();
  };

  const changeAvatar = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("warning", "Arquivo inválido", "Selecione um arquivo de imagem.");
      return;
    }

    if (file.size > 1_500_000) {
      showToast("warning", "Arquivo muito grande", "A imagem deve ter no máximo 1.5MB.");
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImage(dataUrl);
      saveProfile(dataUrl);
    } catch {
      showToast("error", "Falha ao carregar", "Não foi possível ler a imagem selecionada.");
    }
  };

  return (
    <section className="grid gap-6 rounded-[8px] border border-transparent py-1 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
        className="hidden"
        aria-label="Selecionar foto de perfil"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) {
            return;
          }

          void changeAvatar(file);
          event.target.value = "";
        }}
      />

      <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
        <ProfileAvatar
          editing={editing}
          image={image}
          name={name}
          onClick={selectAvatar}
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            {editing ? (
              <input
                value={name}
                maxLength={60}
                className="profile-control h-10 min-w-[240px] rounded-[7px] border border-[color:var(--profile-border)] bg-[var(--profile-surface-elevated)] px-3 font-serif text-2xl font-semibold text-[var(--profile-text-primary)] outline-none"
                aria-label="Nome de exibição"
                onChange={(event) => setName(event.target.value)}
              />
            ) : (
              <h1 className="font-serif text-3xl font-semibold leading-tight text-[var(--profile-text-primary)] sm:text-[2rem]">
                {name}
              </h1>
            )}
            {editing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="profile-focusable inline-flex size-8 items-center justify-center rounded-[7px] border border-[color:var(--profile-border)] text-[var(--profile-success)]"
                  aria-label="Salvar perfil"
                  disabled={isPending}
                  onClick={() => saveProfile()}
                >
                  <Check className="size-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="profile-focusable inline-flex size-8 items-center justify-center rounded-[7px] border border-[color:var(--profile-border)] text-[var(--profile-text-secondary)]"
                  aria-label="Cancelar edição"
                  disabled={isPending}
                  onClick={cancelEditing}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="profile-focusable inline-flex size-8 items-center justify-center rounded-[7px] border border-[color:var(--profile-border)] text-[var(--profile-text-secondary)]"
                aria-label="Editar perfil"
                onClick={() => setEditing(true)}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {editing ? (
            <textarea
              value={bio}
              maxLength={180}
              rows={2}
              className="profile-control mt-2 w-full max-w-2xl resize-none rounded-[7px] border border-[color:var(--profile-border)] bg-[var(--profile-surface-elevated)] px-3 py-2 text-sm leading-6 text-[var(--profile-text-secondary)] outline-none"
              aria-label="Bio do usuário"
              onChange={(event) => setBio(event.target.value)}
            />
          ) : (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--profile-text-secondary)]">
              {bio}
            </p>
          )}

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--profile-text-muted)]">
            <ProfileMetaItem
              icon={<CalendarDays className="size-4" aria-hidden="true" />}
              value={user.memberSinceLabel}
            />
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-6 lg:justify-self-end">
        <div className="flex items-center gap-4">
          <span className="font-serif text-3xl font-semibold text-[var(--profile-text-primary)]">
            {user.rankKanji}
          </span>
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--profile-text-muted)]">
              Rank
            </p>
            <p className="font-serif text-xl font-semibold text-[var(--profile-text-primary)]">
              {user.rank}
            </p>
          </div>
        </div>
        <div className="h-14 w-px bg-[var(--profile-border-strong)]" />
        <div>
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[var(--profile-text-muted)]">
            ELO atual
          </p>
          <p className="font-serif text-3xl font-semibold leading-tight text-[var(--profile-accent-blue)]">
            {user.elo}
          </p>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 z-[80]">
        <ZenToast open={toast.open} tone={toast.tone} title={toast.title}>
          {toast.message}
        </ZenToast>
      </div>
    </section>
  );
}

function ProfileAvatar({
  editing,
  image,
  name,
  onClick,
}: {
  editing: boolean;
  image: string | null;
  name: string;
  onClick: () => void;
}) {
  const initials = getInitials(name);
  const content = image ? (
    <Image
      src={image}
      alt={`Foto de ${name}`}
      width={96}
      height={96}
      unoptimized
      className="size-full object-cover"
    />
  ) : (
    initials
  );

  if (!editing) {
    return (
      <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-[color:var(--profile-border-strong)] bg-[var(--profile-surface-elevated)] font-serif text-2xl font-semibold text-[var(--profile-text-primary)]">
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="profile-focusable group relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-full border border-[color:var(--profile-border-strong)] bg-[var(--profile-surface-elevated)] font-serif text-2xl font-semibold text-[var(--profile-text-primary)]"
      aria-label="Trocar foto de perfil"
      onClick={onClick}
    >
      {content}
      <span className="absolute inset-0 grid place-items-center bg-[color-mix(in_srgb,var(--profile-surface)_75%,transparent)] opacity-0 transition-opacity group-hover:opacity-100">
        <Camera className="size-5" aria-hidden="true" />
      </span>
    </button>
  );
}

function ProfileMetaItem({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <li className="flex items-center gap-1.5">
      {icon}
      <span>{value}</span>
    </li>
  );
}

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .flatMap((part) => (part.trim()[0] ? [part.trim()[0]!] : []))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "K"
  );
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Erro ao ler imagem"));
    reader.readAsDataURL(file);
  });
}
