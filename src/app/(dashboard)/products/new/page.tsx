import { AddProductForm } from "@/features/products";
import { listProductCategories } from "@/features/products/data/categories.server";

export default async function NewProductPage() {
  const categories = await listProductCategories();
  return <AddProductForm categories={categories} />;
}
