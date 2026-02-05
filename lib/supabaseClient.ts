// Fix for 'import.meta.env' TypeScript error

import { createClient } from '@supabase/supabase-js';

// FIX: The reference to "vite/client" types was removed as it was not found. Using `(import.meta as any)` to bypass the type check.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;

// The key is now hardcoded as requested. For production, it's recommended to use
// environment variables (e.g., VITE_SUPABASE_ANON_KEY) to keep keys secure and manageable.
const supabaseAnonKey = 'sb_publishable_ZPKD817UclrzeTkdmofN8g_gww2AbFT';


if (!supabaseUrl) {
  throw new Error("Supabase URL must be provided in an environment variable (VITE_SUPABASE_URL).");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);