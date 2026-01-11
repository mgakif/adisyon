-- Ürünler tablosuna sort_order kolonu ekleme
-- Supabase SQL Editor'da çalıştırın

-- 1. sort_order kolonunu ekle (eğer yoksa)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS sort_order INTEGER;

-- 2. Mevcut ürünlere sıralama numarası ver (eğer null ise)
-- Bu komut, mevcut ürünlere id'lerine göre sıralama numarası verir
UPDATE products 
SET sort_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY name) as row_number
  FROM products
  WHERE sort_order IS NULL
) AS subquery
WHERE products.id = subquery.id AND products.sort_order IS NULL;

-- 3. sort_order için index ekle (performans için)
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);

-- 4. sort_order için default değer ayarla (yeni ürünler için)
ALTER TABLE products 
ALTER COLUMN sort_order SET DEFAULT 0;

-- 5. (Opsiyonel) sort_order NULL değerlerini 0 yap
UPDATE products 
SET sort_order = 0 
WHERE sort_order IS NULL;
