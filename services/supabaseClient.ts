import { createClient } from '@supabase/supabase-js';

// These credentials were provided in the prompt
const supabaseUrl = 'https://pscoppugrlcyphpfowvu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzY29wcHVncmxjeXBocGZvd3Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA3MTIzODAsImV4cCI6MjA3NjI4ODM4MH0.ycaqnTsPeUxAedy9Ap8pEP5FdjnQzpoUS2YThyWjEVo';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are required. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
