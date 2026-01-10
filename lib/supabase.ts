import { createClient } from '@supabase/supabase-js';

// Safely access environment variables
const env = (import.meta as any).env || {};

// 1. HARDCODED FALLBACKS
// Eğer .env dosyası okunamazsa bu değerler kullanılır.
// Lütfen buraya Supabase Dashboard -> Project Settings -> API kısmındaki URL ve ANON KEY'i giriniz.
const FALLBACK_URL = 'https://toildtpftdqifutznnsy.supabase.co';
const FALLBACK_KEY = 'sb_publishable_j5f_xG7OnvxFlETKVjOgUQ_NLN2DKn7'; // Buraya genellikle 'eyJ...' ile başlayan anon key gelir.

// 2. Resolve Config
// Önce env dosyasını dener, yoksa yukarıdaki fallback değerleri alır.
const supabaseUrl = env.VITE_SUPABASE_URL || FALLBACK_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

// 3. Determine Mode
// Eğer URL 'your-project' içeriyorsa veya boşsa Mock Mode açılır.
export const isMockMode = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('your-project');

if (isMockMode) {
  console.warn('Supabase keys missing. Running in DEMO/MOCK mode.');
} else {
  console.log('Supabase Connection Active:', supabaseUrl);
}

// 4. Create Client
export const supabase = createClient(
  supabaseUrl || 'https://your-project.supabase.co', 
  supabaseAnonKey || 'your-anon-key'
);