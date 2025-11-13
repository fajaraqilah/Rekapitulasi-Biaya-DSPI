// Supabase Client Configuration
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// IMPORTANT: Replace these with your actual Supabase project URL and anon key
// 1. Go to your Supabase project dashboard
// 2. Click on "Project Settings" -> "API"
// 3. Copy the Project URL and anon key (public)
const SUPABASE_URL = 'https://mhrqftkfribvtvpebbnr.supabase.co'; // e.g., 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ocnFmdGtmcmlidnR2cGViYm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjE0NjgsImV4cCI6MjA3Nzk5NzQ2OH0.vDAPNiOASPhkqinp1hClk2bF9zxdjYxEaxLykwiJPDc'; // e.g., 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);