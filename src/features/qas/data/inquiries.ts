export type InquiryStatus =
  | "new"
  | "in_progress"
  | "closed"
  | "resolved";

export type ContactInquiry = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  message: string;
  status: InquiryStatus;
  internalNotes: string;
  createdAt: string;
  updatedAt: string;
};

export const INQUIRY_STATUSES: InquiryStatus[] = [
  "new",
  "in_progress",
  "closed",
  "resolved",
];

export function isInquiryStatus(value: unknown): value is InquiryStatus {
  return (
    value === "new" ||
    value === "in_progress" ||
    value === "closed" ||
    value === "resolved"
  );
}
