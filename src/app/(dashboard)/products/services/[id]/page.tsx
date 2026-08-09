import { notFound } from "next/navigation";
import {
  getService,
  ServiceDetailEditor,
} from "@/features/products";
import { listServiceCategories } from "@/features/products/data/categories.server";

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [service, categories] = await Promise.all([
    getService(id),
    listServiceCategories(),
  ]);
  if (!service) notFound();

  return (
    <ServiceDetailEditor initialService={service} categories={categories} />
  );
}
