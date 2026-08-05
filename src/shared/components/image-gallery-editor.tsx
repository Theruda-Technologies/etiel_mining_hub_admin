"use client";

import { useState } from "react";
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
      setError("Unable to reach upload service.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {images.map((src) => (
          <div
            key={src}
            className="group relative aspect-square overflow-hidden rounded-md border border-border"
          >
            <img src={src} alt="" className="size-full object-cover" />
            <button
              type="button"
              aria-label="Remove image"
              onClick={() => onChange(images.filter((item) => item !== src))}
              className="absolute top-1.5 right-1.5 rounded bg-black/70 p-1 text-danger opacity-0 transition-opacity group-hover:opacity-100"
            >
              <TrashIcon className="size-3.5" />
            </button>
          </div>
        ))}
        {max === 1 || images.length < max ? (
          <label
            className={`flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-background text-muted hover:border-accent/50 hover:text-accent ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <UploadCloudIcon className="size-5" />
            <span className="text-[10px] tracking-wide uppercase">
              {busy ? "…" : "Add"}
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
        Up to {max} images. First image is used as the thumbnail.
      </p>
    </div>
  );
}
