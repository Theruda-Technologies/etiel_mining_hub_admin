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

async function readUpload(request: Request): Promise<{
  kind: UploadKind;
  buffer: Buffer;
  mime: string;
  fileName: string;
}> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as {
      kind?: string;
      fileName?: string;
      contentType?: string;
      data?: string;
    };
    if (!body.data?.trim()) {
      throw new Error("File data is required.");
    }
    const buffer = Buffer.from(body.data, "base64");
    if (!buffer.length) throw new Error("File data is required.");
    return {
      kind: resolveKind(body.kind),
      buffer,
      mime: body.contentType || "application/octet-stream",
      fileName: body.fileName || "upload.jpg",
    };
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new Error(
      "Failed to parse upload. Please try again with a smaller image.",
    );
  }

  const file = form.get("file");
  if (!isUploadFile(file) || file.size === 0) {
    throw new Error("File is required.");
  }

  return {
    kind: resolveKind(form.get("kind")),
    buffer: Buffer.from(await file.arrayBuffer()),
    mime: file.type || "application/octet-stream",
    fileName: file.name || "upload.jpg",
  };
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const upload = await readUpload(request);

    if (
      upload.mime !== "application/octet-stream" &&
      !upload.mime.startsWith("image/")
    ) {
      return NextResponse.json(
        { error: "Only image uploads are allowed." },
        { status: 400 },
      );
    }
    if (upload.buffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Image must be 5MB or smaller." },
        { status: 400 },
      );
    }

    const bucket = BUCKETS[upload.kind];
    const ext = upload.fileName.split(".").pop()?.toLowerCase() || "jpg";
    const folder =
      upload.kind === "avatar" ? `avatars/${session.id}` : upload.kind;
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

    const { error } = await admin.storage.from(bucket).upload(path, upload.buffer, {
      contentType: upload.mime.startsWith("image/")
        ? upload.mime
        : `image/${ext}`,
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
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
