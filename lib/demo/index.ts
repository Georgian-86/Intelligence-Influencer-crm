export { isDemo } from "./mode";

export const DEMO_USER = {
  id: "demo-user",
  email: "aanya.mehta@nmims.edu",
  user_metadata: { full_name: "Aanya Mehta" },
} as const;

export * from "./fixtures";
