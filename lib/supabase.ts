import { createClient } from '@supabase/supabase-js';

// Safely access environment variables with fallback
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Check if real keys are provided
export const isMockMode = !supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project');

if (isMockMode) {
  console.warn('Supabase keys missing. Running in DEMO/MOCK mode. Data will not be saved to DB.');
}

// Create client with fallback values to prevent startup crash
export const supabase = createClient(
  supabaseUrl || 'https://toildtpftdqifutznnsy.supabase.co', 
  supabaseAnonKey || 'sb_publishable_j5f_xG7OnvxFlETKVjOgUQ_NLN2DKn7'
);