export {
  PRODUCT_CATEGORIES,
  SERVICE_CATEGORIES,
  productCategoryLabel,
  serviceCategoryLabel,
} from "./data/categories";
export { CatalogManager } from "./components/catalog-manager";
export { AddProductForm } from "./components/add-product-form";
export { AddServiceForm } from "./components/add-service-form";
export {
  listProducts,
  listServices,
  updateProduct,
  updateService,
  deleteProduct,
  deleteService,
  createProduct,
  createService,
} from "./api/catalog";
export { sampleProducts, sampleServices } from "./data/catalog";
export type {
  CatalogProduct,
  CatalogService,
  CatalogStatus,
} from "./data/catalog";
export type { ProductCategory, ServiceCategory } from "./data/categories";
