-- Supabase Storage Bucket Oluşturma
-- Supabase SQL Editor'da çalıştırın

-- 1. Bucket'ı oluştur (eğer yoksa)
-- Public: true -> Herkesin görebilmesi için (QR kod menüsü için gerekli)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cankuruyemis', 
  'cankuruyemis', 
  true,  -- Public bucket (herkes görebilir)
  5242880,  -- 5MB dosya boyutu limiti
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']  -- İzin verilen dosya tipleri
)
ON CONFLICT (id) DO UPDATE
SET 
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

-- 2. Bucket'ın oluşturulduğunu kontrol et
SELECT * FROM storage.buckets WHERE id = 'cankuruyemis';
