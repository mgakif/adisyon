-- Products tablosuna image kolonu ekleme
-- Supabase SQL Editor'da çalıştırın

-- 1. image kolonunu ekle (eğer yoksa)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image TEXT;

-- 2. (Opsiyonel) image kolonu için açıklama ekle
COMMENT ON COLUMN products.image IS 'Ürün resminin Supabase Storage URL''si';

-- 3. Mevcut ürünlerde image NULL olarak kalacak, bu normaldir
-- Yeni ürünler eklerken veya mevcut ürünleri düzenlerken resim eklenebilir
