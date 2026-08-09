import { notFound } from "next/navigation";
import {
  getProduct,
  ProductDetailEditor,
} from "@/features/products";
import { listProductCategories } from "@/features/products/data/categories.server";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id),
    listProductCategories(),
  ]);
  if (!product) notFound();

  return (
    <ProductDetailEditor initialProduct={product} categories={categories} />
  );
}
