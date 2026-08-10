import { listContactInquiries } from "@/features/qas";
import { QasPageClient } from "@/features/qas";

export default async function QasPage() {
  const inquiries = await listContactInquiries();
  return <QasPageClient inquiries={inquiries} />;
}
