-- Fix addon product collection assignments
-- Updates all products with handle starting with 'addon-' to use the add-ons collection
--
-- Collection ID: pcol_01K9TESKK87XQKW7K5C2N3N6QY (Tour Add-ons)
--
-- Usage (from Railway or local with DATABASE_URL):
--   psql $DATABASE_URL < scripts/fix-addons.sql

-- Show products before update
SELECT
  id,
  handle,
  title,
  collection_id
FROM product
WHERE handle LIKE 'addon-%'
AND deleted_at IS NULL
ORDER BY handle;

-- Update all addon products to use add-ons collection
UPDATE product
SET
  collection_id = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY',
  updated_at = NOW()
WHERE handle LIKE 'addon-%'
AND deleted_at IS NULL;

-- Show products after update
SELECT
  id,
  handle,
  title,
  collection_id
FROM product
WHERE handle LIKE 'addon-%'
AND deleted_at IS NULL
ORDER BY handle;

-- Verify count
SELECT COUNT(*) as fixed_count
FROM product
WHERE handle LIKE 'addon-%'
AND collection_id = 'pcol_01K9TESKK87XQKW7K5C2N3N6QY'
AND deleted_at IS NULL;
