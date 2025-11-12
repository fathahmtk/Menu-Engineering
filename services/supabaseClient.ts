import { createClient } from '@supabase/supabase-js';

// These credentials were provided in the prompt
const supabaseUrl = 'https://wyhsrctindohotbrnrrg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5aHNyY3RpbmRvaG90YnJucnJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzQwOTksImV4cCI6MjA3ODU1MDA5OX0.WIyIhFCKCcKLGLYfpzN7Anefx36UnZ_1T6YEwANuHQU';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are required. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);