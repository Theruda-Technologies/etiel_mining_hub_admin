"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TrashIcon, UploadCloudIcon } from "@/shared/components/icons";
import { uploadImageFile } from "@/shared/lib/upload-image";

type ImageGalleryEditorProps = {
  images: string[];
  onChange: (images: string[]) => void;
  uploadKind?: "product" | "service" | "avatar";
  max?: number;
};

export function ImageGalleryEditor({
  images,
  onChange,
  uploadKind = "product",
  max = 8,
}: ImageGalleryEditorProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = max === 1 ? 1 : max - images.length;
    if (remaining <= 0) return;
    const selected = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];

    setBusy(true);
    setError(null);
    try {
      for (const file of selected) {
        const result = await uploadImageFile(file, uploadKind);
        if (!result.ok) {
          setError(result.error);
          continue;
        }
        uploaded.push(result.url);
      }

      if (!uploaded.length) return;
      if (max === 1) onChange(uploaded.slice(0, 1));
      else onChange([...images, ...uploaded]);
    } catch {
      setError(t("common.uploadUnreachable"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {images.map((src) => (
          <div
            key={src}
            className="group relative size-20 shrink-0 overflow-hidden rounded-md border border-border sm:size-24"
          >
            <img src={src} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label={t("common.removeImage")}
              onClick={() => onChange(images.filter((item) => item !== src))}
              className="absolute top-1 right-1 rounded bg-black/70 p-1 text-danger opacity-0 transition-opacity group-hover:opacity-100"
            >
              <TrashIcon className="size-3.5" />
            </button>
          </div>
        ))}
        {max === 1 || images.length < max ? (
          <label
            className={`flex size-20 shrink-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-background text-muted hover:border-accent/50 hover:text-accent sm:size-24 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <UploadCloudIcon className="size-5" />
            <span className="text-[10px] tracking-wide uppercase">
              {busy ? "…" : t("common.add")}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple={max > 1}
              disabled={busy}
              className="sr-only"
              onChange={(e) => {
                void uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        ) : null}
      </div>
      {error ? <p className="text-[11px] text-danger">{error}</p> : null}
      <p className="text-[11px] text-muted">
        {t("common.galleryHint", { max })}
      </p>
    </div>
  );
}
