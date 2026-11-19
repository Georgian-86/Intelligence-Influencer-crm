/** Small formatting helpers shared by CRM and admin screens (server- and client-safe). */

export const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  platform_ops: "Platform ops",
  hr_screener: "HR screener",
  org_owner: "Owner",
  org_admin: "Admin",
  campaign_manager: "Campaign manager",
  scout: "Scout",
};

export function roleLabel(role?: string | null) {
  if (!role) return undefined;
  return ROLE_LABEL[role] ?? role.replace(/_/g, " ");
}

export function timeAgo(date?: string | null, now = Date.now()) {
  if (!date) return "—";
  const s = Math.max(0, Math.round((now - new Date(date).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: d > 330 ? "numeric" : undefined });
}

export function fmtDate(date?: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function initials(name?: string | null) {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function fmtEr(er?: number | null) {
  return er == null ? "—" : `${Number(er).toFixed(Number(er) >= 10 ? 1 : 2).replace(/\.?0+$/, "")}%`;
}
