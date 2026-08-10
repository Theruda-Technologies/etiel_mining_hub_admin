import { createAdminClient } from "@/lib/supabase/admin";
import {
  isInquiryStatus,
  type ContactInquiry,
  type InquiryStatus,
} from "../data/inquiries";

type InquiryRow = {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  message: string;
  status: string;
  internal_notes: string;
  created_at: string;
  updated_at: string;
};

function mapRow(row: InquiryRow): ContactInquiry {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    message: row.message,
    status: isInquiryStatus(row.status) ? row.status : "new",
    internalNotes: row.internal_notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listContactInquiries(): Promise<ContactInquiry[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contact_inquiries")
    .select(
      "id, full_name, phone, email, message, status, internal_notes, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("listContactInquiries:", error?.message);
    return [];
  }

  return (data as InquiryRow[]).map(mapRow);
}

export async function updateContactInquiry(
  id: string,
  patch: { status?: InquiryStatus; internalNotes?: string },
): Promise<{ error: string | null }> {
  const admin = createAdminClient();
  const payload: Record<string, string> = {
    updated_at: new Date().toISOString(),
  };
  if (patch.status) payload.status = patch.status;
  if (patch.internalNotes !== undefined) {
    payload.internal_notes = patch.internalNotes;
  }

  const { error } = await admin
    .from("contact_inquiries")
    .update(payload)
    .eq("id", id);

  return { error: error?.message ?? null };
}
