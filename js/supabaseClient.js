// Supabase Client Configuration
import { createClient } from '@supabase/supabase-js'

// Supabase configuration using environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Check if environment variables are properly configured
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables are not properly configured. Please check your .env file.');
}