import { notFound } from "next/navigation";
import {
  getProduct,
  ProductDetailEditor,
} from "@/features/products";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  return <ProductDetailEditor initialProduct={product} />;
}
