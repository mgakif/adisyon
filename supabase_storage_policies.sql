-- Supabase Storage Bucket Politikaları
-- Supabase Dashboard -> Storage -> cankuruyemis bucket -> Policies bölümünde çalıştırın
-- VEYA SQL Editor'da çalıştırın

-- 1. Bucket'ı oluştur (eğer yoksa)
INSERT INTO storage.buckets (id, name, public)
VALUES ('cankuruyemis', 'cankuruyemis', true)
ON CONFLICT (id) DO NOTHING;

-- 2. HERKESİN RESİMLERİ GÖREBİLMESİ İÇİN (Public Read Policy)
-- Bu policy, herkesin bucket'taki resimleri görmesine izin verir
-- QR kod menüsü için gerekli
CREATE POLICY "Public can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cankuruyemis');

-- 3. SADECE AUTHENTICATED KULLANICILARIN YÜKLEMESİ İÇİN (Authenticated Upload Policy)
-- Bu policy, sadece giriş yapmış kullanıcıların resim yüklemesine izin verir
CREATE POLICY "Authenticated users can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cankuruyemis' 
  AND auth.role() = 'authenticated'
);

-- 4. SADECE AUTHENTICATED KULLANICILARIN SİLMESİ İÇİN (Authenticated Delete Policy)
-- Bu policy, sadece giriş yapmış kullanıcıların resim silmesine izin verir
CREATE POLICY "Authenticated users can delete product images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cankuruyemis' 
  AND auth.role() = 'authenticated'
);

-- 5. SADECE AUTHENTICATED KULLANICILARIN GÜNCELLEMESİ İÇİN (Authenticated Update Policy)
-- Bu policy, sadece giriş yapmış kullanıcıların resim güncellemesine izin verir
CREATE POLICY "Authenticated users can update product images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cankuruyemis' 
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'cankuruyemis' 
  AND auth.role() = 'authenticated'
);

-- NOT: Eğer daha kısıtlayıcı bir politika istiyorsanız (sadece belirli kullanıcılar):
-- auth.uid() = 'kullanici-id' şeklinde kontrol ekleyebilirsiniz
