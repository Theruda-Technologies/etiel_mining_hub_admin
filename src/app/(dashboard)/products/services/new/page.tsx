import { AddServiceForm } from "@/features/products";
import { listServiceCategories } from "@/features/products/data/categories.server";

export default async function NewServicePage() {
  const categories = await listServiceCategories();
  return <AddServiceForm categories={categories} />;
}
