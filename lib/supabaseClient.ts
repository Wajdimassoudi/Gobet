
import { createClient } from '@supabase/supabase-js';

// The Supabase URL and Anon Key are now hardcoded with the values you provided.
// This will connect the application to your specific Supabase project.
const supabaseUrl = 'https://kofasswhbfbenywjnrfm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvZmFzc3doYmZiZW55d2pucmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMTg3MTYsImV4cCI6MjA4NTg5NDcxNn0.vfQYjM65SCVjld3FCgP7G-SZUOSB4rlITJILgCo-oko';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
