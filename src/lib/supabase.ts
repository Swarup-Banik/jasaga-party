import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (
    !url ||
    !anonKey ||
    url.includes("your-project") ||
    anonKey.includes("your-supabase") ||
    anonKey.includes("your_key")
  ) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 20,
        },
      },
    });
  }

  return supabaseInstance;
}

export const isSupabaseConfigured = (): boolean => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  return Boolean(
    url &&
    anonKey &&
    !url.includes("your-project") &&
    !anonKey.includes("your-supabase") &&
    !anonKey.includes("your_key")
  );
};

// Safe server-side admin client - NEVER expose service role key to frontend/browser!
export function getSupabaseAdminClient(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    console.error("CRITICAL: Attempted to access Supabase Admin client on the client-side!");
    return null;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !secretKey || secretKey.includes("your_key")) {
    return null;
  }
  return createClient(url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
