async function compressImage(
  file: File,
  kind: "product" | "service" | "avatar",
): Promise<File> {
  if (!file.type.startsWith("image/") && file.type !== "") {
    return file;
  }

  const maxEdge = kind === "avatar" ? 512 : 1600;
  const quality = kind === "avatar" ? 0.85 : 0.8;

  const bitmap = await createImageBitmap(file);
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) return file;

    const base = (file.name || "upload").replace(/\.[^.]+$/, "");
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}

export async function uploadImageFile(
  file: File,
  kind: "product" | "service" | "avatar",
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  let prepared: File;
  try {
    prepared = await compressImage(file, kind);
  } catch {
    prepared = file;
  }

  if (prepared.size > 4.5 * 1024 * 1024) {
    return {
      ok: false,
      error: "Image is still too large after compression. Try a smaller file.",
    };
  }

  const body = new FormData();
  body.set("file", prepared);
  body.set("kind", kind);

  const res = await fetch("/api/catalog/upload", {
    method: "POST",
    body,
  });

  const text = await res.text();
  let data: { url?: string; error?: string } = {};
  if (text.trim()) {
    try {
      data = JSON.parse(text) as { url?: string; error?: string };
    } catch {
      return { ok: false, error: `Invalid upload response (${res.status}).` };
    }
  } else if (!res.ok) {
    return { ok: false, error: `Upload failed (${res.status}).` };
  }

  if (!res.ok || !data.url) {
    return { ok: false, error: data.error ?? `Upload failed (${res.status}).` };
  }

  return { ok: true, url: data.url };
}
