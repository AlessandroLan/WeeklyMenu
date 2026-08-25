import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Surfaces a clear message in the console/UI instead of a cryptic fetch error,
  // since this almost always means the .env file (or the GitHub Actions secret) is missing.
  console.warn(
    "Supabase non configurato: imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (vedi README)."
  );
}

export const supabase = createClient(url ?? "", anonKey ?? "");
export const isSupabaseConfigured = Boolean(url && anonKey);
