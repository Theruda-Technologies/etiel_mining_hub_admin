import { CatalogManager, listProducts, listServices } from "@/features/products";

export default async function ProductsPage(props: PageProps<"/products">) {
  const { tab } = await props.searchParams;
  const initialTab = tab === "services" ? "services" : "products";
  const [products, services] = await Promise.all([
    listProducts(),
    listServices(),
  ]);

  return (
    <CatalogManager
      initialTab={initialTab}
      initialProducts={products}
      initialServices={services}
    />
  );
}
