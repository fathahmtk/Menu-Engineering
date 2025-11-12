import { createClient } from '@supabase/supabase-js';

// These credentials were provided in the prompt
const supabaseUrl = 'https://jsuelwyzqutdmlarldej.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzdWVsd3l6cXV0ZG1sYXJsZGVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NzE0MzcsImV4cCI6MjA3ODU0NzQzN30.csPCJRhjdKQVtIGPFjAudhsb3tnBF0ygAts75Drxw7Y';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are required. Check your environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);