import { NextResponse } from "next/server";
import { getSession } from "@/features/auth/lib/server";
import {
  isInquiryStatus,
  updateContactInquiry,
} from "@/features/qas";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    id?: string;
    status?: string;
    internalNotes?: string;
  };

  if (!body.id) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (body.status !== undefined && !isInquiryStatus(body.status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await updateContactInquiry(body.id, {
    ...(body.status && isInquiryStatus(body.status)
      ? { status: body.status }
      : {}),
    internalNotes: body.internalNotes,
  });

  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
