import { clsx } from "clsx";
import { CircleCheck, EyeOff, GraduationCap, Info, TriangleAlert, UserRoundX, WifiOff } from "lucide-react";
import type { Flag } from "./flags";

const FLAG_ICON = { fake: UserRoundX, private: EyeOff, college: GraduationCap, fetch: WifiOff, ratio: TriangleAlert } as const;

export function FlagChip({ flag, withDetail = false }: { flag: Flag; withDetail?: boolean }) {
  const I = FLAG_ICON[flag.key];
  return (
    <span title={flag.detail} className={clsx("inline-flex items-start gap-1.5 rounded-[10px] px-2 py-1 text-[12px] font-medium",
      flag.severity === "high" ? "bg-bad-bg text-bad" : "bg-warn-bg text-warn", withDetail && "w-full px-3 py-2")}>
      <I className="mt-[1px] h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{flag.label}{withDetail && <span className="block font-normal text-ink-2">{flag.detail}</span>}</span>
    </span>
  );
}

/** Flash messages from server-action redirects (?saved / ?error / ?done / ?demo). */
export function ActionNotice({ sp }: { sp: { saved?: string; error?: string; done?: string; demo?: string } }) {
  const msg = sp.error ?? sp.done ?? sp.demo ?? (sp.saved ? "Saved." : null);
  if (!msg) return null;
  const kind = sp.error ? "error" : sp.demo ? "demo" : "ok";
  const I = kind === "error" ? TriangleAlert : kind === "demo" ? Info : CircleCheck;
  return (
    <div role={kind === "error" ? "alert" : "status"} className={clsx("mb-6 flex items-center gap-2.5 rounded-[14px] px-4 py-3 text-[14px]",
      kind === "error" ? "bg-bad-bg text-bad" : kind === "demo" ? "bg-info-bg text-info" : "bg-ok-bg text-ok")}>
      <I className="h-4 w-4 shrink-0" /> {msg}
    </div>
  );
}

export const RANK_TONE: Record<string, string> = {
  bronze: "bg-[#f6ebe1] text-bronze", silver: "bg-[#eef0f4] text-silver", gold: "bg-[#fbf3d9] text-gold", platinum: "bg-[#e1f3f8] text-platinum",
};
export const RANK_RUBRIC: Record<string, string> = {
  bronze: "New or under 10K. Trial briefs only.",
  silver: "10–50K, healthy ER, 1+ delivered brief.",
  gold: "50K+ or top campus voice, on-time record.",
  platinum: "250K+ or proven brand-safe headliner.",
};
