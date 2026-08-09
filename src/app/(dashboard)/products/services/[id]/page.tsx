import { notFound } from "next/navigation";
import {
  getService,
  ServiceDetailEditor,
} from "@/features/products";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const service = await getService(id);
  if (!service) notFound();

  return <ServiceDetailEditor initialService={service} />;
}
