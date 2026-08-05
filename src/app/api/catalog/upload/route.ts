import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/lib/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKETS = {
  product: "product-images",
  service: "service-images",
  avatar: "product-images",
} as const;

type UploadKind = keyof typeof BUCKETS;

function resolveKind(raw: unknown): UploadKind {
  const value = String(raw ?? "product");
  return value in BUCKETS ? (value as UploadKind) : "product";
}

function isUploadFile(value: FormDataEntryValue | null): value is File {
  return (
    !!value &&
    typeof value === "object" &&
    "arrayBuffer" in value &&
    typeof (value as File).arrayBuffer === "function" &&
    typeof (value as File).size === "number"
  );
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Clone before reading so auth/session work stays isolated from body parse.
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        { error: "Expected multipart image upload." },
        { status: 415 },
      );
    }

    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            "Could not read the image upload. Try a smaller image (under 5MB).",
        },
        { status: 400 },
      );
    }

    const file = form.get("file");
    if (!isUploadFile(file) || file.size === 0) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    const mime = file.type || "image/jpeg";
    if (mime !== "application/octet-stream" && !mime.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image uploads are allowed." },
        { status: 400 },
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be 5MB or smaller." },
        { status: 400 },
      );
    }

    const kind = resolveKind(form.get("kind"));
    const bucket = BUCKETS[kind];
    const fileName = file.name || "upload.jpg";
    const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
    const folder = kind === "avatar" ? `avatars/${session.id}` : kind;
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const admin = createAdminClient();
    const { data: buckets } = await admin.storage.listBuckets();
    if (!buckets?.some((b) => b.name === bucket)) {
      const { error: bucketError } = await admin.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (bucketError && !/already exists/i.test(bucketError.message)) {
        return NextResponse.json(
          { error: bucketError.message },
          { status: 500 },
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await admin.storage.from(bucket).upload(path, buffer, {
      contentType: mime.startsWith("image/") ? mime : `image/${ext}`,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data } = admin.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl, path });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Upload failed unexpectedly.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
