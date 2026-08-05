export async function uploadImageFile(
  file: File,
  kind: "product" | "service" | "avatar",
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }

  const res = await fetch("/api/catalog/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind,
      fileName: file.name || "upload.jpg",
      contentType: file.type || "image/jpeg",
      data: btoa(binary),
    }),
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
