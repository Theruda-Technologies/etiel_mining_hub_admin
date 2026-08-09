import {
  CatalogManager,
  listProducts,
  listServices,
} from "@/features/products";
import {
  listProductCategories,
  listServiceCategories,
} from "@/features/products/data/categories.server";

export default async function ProductsPage(props: PageProps<"/products">) {
  const { tab } = await props.searchParams;
  const initialTab = tab === "services" ? "services" : "products";
  const [products, services, productCategories, serviceCategories] =
    await Promise.all([
      listProducts(),
      listServices(),
      listProductCategories(),
      listServiceCategories(),
    ]);

  return (
    <CatalogManager
      initialTab={initialTab}
      initialProducts={products}
      initialServices={services}
      productCategories={productCategories}
      serviceCategories={serviceCategories}
    />
  );
}
