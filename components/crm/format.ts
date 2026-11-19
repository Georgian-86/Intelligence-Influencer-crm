/** Deterministic formatters (identical on server and client — no locale-dependent Date APIs). */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const IST = 5.5 * 3600000;

const toIst = (d: string | number | Date) => new Date(new Date(d).getTime() + IST);

/** "19 Nov" */
export function shortDate(d?: string | null) {
  if (!d) return "—";
  const x = d.length === 10 ? new Date(`${d}T00:00:00Z`) : toIst(d);
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]}`;
}

/** "Thursday, 19 November" */
export function longDay(now: number) {
  const x = toIst(now);
  return `${DAYS[x.getUTCDay()]}, ${x.getUTCDate()} ${MONTHS_LONG[x.getUTCMonth()]}`;
}

export function istHour(now: number) {
  return toIst(now).getUTCHours();
}

/** Whole days from `now` to the date (negative = past). */
export function daysUntil(d: string | null | undefined, now: number) {
  if (!d) return null;
  const t = new Date(d.length === 10 ? `${d}T00:00:00Z` : d).getTime();
  const today = Math.floor((now + IST) / 86400000);
  return Math.floor((t + (d.length === 10 ? 0 : IST)) / 86400000) - today;
}

export function dueLabel(d: string | null | undefined, now: number) {
  const n = daysUntil(d, now);
  if (n == null) return "No date";
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  return n < 0 ? `${-n}d late` : `In ${n}d`;
}

/** "4m", "3h", "2d" */
export function ago(d: string, now: number) {
  const s = Math.max(0, (now - new Date(d).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

export function lakh(n?: number | null) {
  if (n == null) return "—";
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2).replace(/\.?0+$/, "")}Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(1).replace(/\.0$/, "")}L`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return `₹${Math.round(n)}`;
}

export const pct = (n?: number | null, digits = 1) => (n == null ? "—" : `${n.toFixed(digits).replace(/\.0$/, "")}%`);

export const STAGE_LABEL: Record<string, string> = {
  interested: "Interested", shortlisted: "Shortlisted", contacted: "Contacted", negotiating: "Negotiating",
  confirmed: "Confirmed", delivered: "Delivered", rejected: "Rejected", dropped: "Dropped",
};

export const DELIVERABLE_LABEL: Record<string, string> = {
  brief_sent: "Brief sent", draft_submitted: "Draft in review", changes_requested: "Changes requested",
  approved: "Approved", live: "Live", overdue: "Overdue",
};
