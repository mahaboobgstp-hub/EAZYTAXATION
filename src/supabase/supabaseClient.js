import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Explicitly keep native Android sessions in the WebView's durable local
// storage and refresh access tokens automatically. Supabase's browser
// storage is shared across app restarts for this Capacitor WebView origin.
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: "syd-billing-accounting-auth"
    }
  }
);
