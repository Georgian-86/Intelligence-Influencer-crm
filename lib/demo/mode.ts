/** Demo mode: on when Supabase isn't configured, or forced with NEXT_PUBLIC_DEMO_MODE=1. */
export const isDemo = () =>
  process.env.NEXT_PUBLIC_DEMO_MODE === "1" || !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
