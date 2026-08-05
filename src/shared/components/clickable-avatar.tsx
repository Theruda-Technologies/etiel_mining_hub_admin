"use client";

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProfileAvatar } from "@/shared/components/profile-avatar";
import { uploadImageFile } from "@/shared/lib/upload-image";

type ClickableAvatarProps = {
  src?: string | null;
  name: string;
  size?: number;
  onUploaded: (url: string) => void | Promise<void>;
};

export function ClickableAvatar({
  src,
  name,
  size = 96,
  onUploaded,
}: ClickableAvatarProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const result = await uploadImageFile(file, "avatar");
      if (!result.ok) {
        setError(result.error);
        return;
      }
      await onUploaded(result.url);
    } catch {
      setError("Unable to upload image.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="group relative rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-60"
        aria-label={t("settings.clickPhoto")}
      >
        <ProfileAvatar src={src} name={name} size={size} />
        <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/55 text-[11px] font-medium tracking-wide text-white uppercase opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          {busy ? "…" : t("common.save")}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error ? <p className="text-[11px] text-danger">{error}</p> : null}
      <p className="text-[11px] text-muted">{t("settings.clickPhoto")}</p>
    </div>
  );
}
