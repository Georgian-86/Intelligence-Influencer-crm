"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Browser client (user session from cookies). Used only for direct-to-storage draft uploads. */
export const createBrowserSupabase = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
