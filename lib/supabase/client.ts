import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * One global client per browser tab. ✅
 */
let browserClient: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (browserClient) return browserClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    // This error is what you are seeing. It means the variables are not accessible in the environment.
    throw new Error(
      "Supabase environment variables are missing.\n" +
        "Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your `.env.local` file.",
    )
  }

  browserClient = createBrowserClient(url, anon)
  return browserClient
}
