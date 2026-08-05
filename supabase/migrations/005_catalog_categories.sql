-- Catalog category schema (matches live CHECK constraints).
-- Product categories and service categories are text columns with allowed values.

-- Products
-- ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
-- ALTER TABLE products ADD CONSTRAINT products_category_check
--   CHECK (category IN (
--     'metal_detectors',
--     'ground_scanners',
--     'drilling',
--     'excavators',
--     'mining_supplies'
--   ));

-- Services
-- ALTER TABLE services DROP CONSTRAINT IF EXISTS services_category_check;
-- ALTER TABLE services ADD CONSTRAINT services_category_check
--   CHECK (category IN (
--     'training',
--     'field_support',
--     'on_site_assembly',
--     'financing'
--   ));

-- Multi-image support: image_paths text[] on both products and services.
-- ALTER TABLE products ALTER COLUMN image_paths SET DEFAULT '{}';
-- ALTER TABLE services ALTER COLUMN image_paths SET DEFAULT '{}';

COMMENT ON COLUMN products.category IS
  'One of: metal_detectors, ground_scanners, drilling, excavators, mining_supplies';
COMMENT ON COLUMN services.category IS
  'One of: training, field_support, on_site_assembly, financing';
