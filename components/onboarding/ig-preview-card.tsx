"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertCircle, BadgeCheck, Clock, Lock, RefreshCw } from "lucide-react";
import { clsx } from "clsx";
import { fmtNum, imgSrc } from "@/components/ui";
import { InstagramIcon } from "@/components/brand/icons";
import type { PreviewState } from "@/components/onboarding/use-ig-preview";

const EASE = [0.2, 0.8, 0.2, 1] as const;
const LOADING_LINES = ["Finding your profile…", "Counting followers…", "Reading your latest posts…", "Working out engagement…"];

/**
 * Live Instagram preview for onboarding. Fixed height in every state (skeleton, card, friendly
 * fallbacks) so nothing below it shifts. Never blocks: failure states say "we'll sync later".
 */
export function IgPreviewCard({ state, onRetry }: { state: PreviewState; onRetry?: () => void }) {
  const reduce = useReducedMotion();
  const key = state.status === "loading" ? "loading" : state.status;
  return (
    <div className="relative min-h-[13.5rem]" aria-live="polite" aria-busy={state.status === "loading"}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={key}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0.1 : 0.22, ease: EASE }}
        >
          {state.status === "idle" && <IdleCard />}
          {state.status === "invalid" && (
            <NoteCard tone="warn" icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />} title="That doesn't look like a handle yet">
              Use your username (like <span className="text-fog">@yourname</span>) or paste your profile link.
            </NoteCard>
          )}
          {state.status === "loading" && <LoadingCard handle={state.handle} />}
          {(state.status === "ok" || state.status === "private") && <ProfileCard state={state} />}
          {state.status === "notfound" && (
            <NoteCard tone="warn" icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />} title={`We couldn't find @${state.handle}`}>
              Double-check the spelling. If it&apos;s right, carry on — we&apos;ll try again after you join.
            </NoteCard>
          )}
          {state.status === "taken" && (
            <NoteCard tone="bad" icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />} title={`@${state.handle} is already in the network`}>
              If this is your account, contact the Vigor team and we&apos;ll move it to you.
            </NoteCard>
          )}
          {state.status === "unavailable" && (
            <NoteCard
              tone="info"
              icon={<Clock className="h-5 w-5" aria-hidden="true" />}
              title={`We'll sync @${state.handle} later`}
              action={onRetry && (
                <button type="button" onClick={onRetry} className="btn-quiet min-h-11 px-3 text-xs">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
                </button>
              )}
            >
              Instagram is taking its time. Keep going — your followers and engagement will appear on your dashboard shortly.
            </NoteCard>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("card relative min-h-[13.5rem] overflow-hidden p-4 sm:p-5", className)}>{children}</div>;
}

function IdleCard() {
  return (
    <Frame className="border-dashed bg-ink-2/50">
      <div className="flex items-center gap-3 opacity-60">
        <div className="grid h-14 w-14 place-items-center rounded-full border border-dashed border-line-2 text-mute">
          <InstagramIcon className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-28 rounded bg-ink-4" />
          <div className="h-3 w-40 rounded bg-ink-3" />
        </div>
      </div>
      <p className="mt-6 text-sm text-mute">
        Your profile preview shows up here — followers, posts and engagement, fetched automatically. No screenshots needed.
      </p>
    </Frame>
  );
}

function LoadingCard({ handle }: { handle: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % LOADING_LINES.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <Frame>
      <div className="flex items-center gap-3">
        <div className="skeleton h-14 w-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="text-sm font-semibold text-fog">@{handle}</div>
          <div className="skeleton h-3 w-36" />
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[0, 1, 2].map((k) => <div key={k} className="skeleton h-14 rounded-xl" />)}
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-mute" role="status">
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
        {LOADING_LINES[i]} <span className="text-mute/70">You can keep going meanwhile.</span>
      </p>
    </Frame>
  );
}

function ProfileCard({ state }: { state: Extract<PreviewState, { status: "ok" | "private" }> }) {
  const p = state.preview;
  const stats: [string, string][] = [
    ["Followers", fmtNum(p.followers)],
    ["Posts", fmtNum(p.posts)],
    ["Engagement", p.engagementRate != null ? `${p.engagementRate}%` : "—"],
  ];
  return (
    <Frame>
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.18),transparent)]" />
      <div className="relative flex items-center gap-3">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-2 via-[#e1306c] to-[#833ab4] p-[2px]">
          {p.profilePicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgSrc(p.profilePicUrl)} alt="" width={52} height={52} referrerPolicy="no-referrer" className="h-full w-full rounded-full border-2 border-ink-2 bg-ink-3 object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center rounded-full border-2 border-ink-2 bg-ink-3 text-sm font-bold">{p.handle.slice(0, 2).toUpperCase()}</span>
          )}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1 font-semibold text-fog">
            <span className="truncate">@{p.handle}</span>
            {p.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-info" aria-label="Verified" />}
          </div>
          <div className="truncate text-xs text-mute">{[p.fullName, p.category].filter(Boolean).join(" · ") || "Instagram creator"}</div>
        </div>
        {state.status === "private" ? (
          <span className="ml-auto chip shrink-0 border-warn/40 bg-warn/10 text-warn">Private</span>
        ) : (
          <span className="ml-auto chip shrink-0 border-ok/40 bg-ok/10 text-ok">Found</span>
        )}
      </div>
      <dl className="relative mt-4 grid grid-cols-3 gap-2">
        {stats.map(([k, v]) => (
          <div key={k} className="rounded-xl border border-line bg-ink-3/60 px-3 py-2">
            <dt className="text-[10px] uppercase tracking-wider text-mute">{k}</dt>
            <dd className="text-lg font-bold tabular-nums text-fog">{v}</dd>
          </div>
        ))}
      </dl>
      {state.status === "private" ? (
        <p className="relative mt-3 flex items-start gap-2 text-xs text-warn">
          <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          This account is private, so we can&apos;t read engagement. Switch it to public anytime and we&apos;ll sync automatically.
        </p>
      ) : p.biography ? (
        <p className="relative mt-3 line-clamp-2 text-xs text-mute">{p.biography}</p>
      ) : null}
    </Frame>
  );
}

function NoteCard({ tone, icon, title, children, action }: {
  tone: "info" | "warn" | "bad"; icon: React.ReactNode; title: string; children: React.ReactNode; action?: React.ReactNode;
}) {
  const c = tone === "bad" ? "text-bad bg-bad/10 border-bad/30" : tone === "warn" ? "text-warn bg-warn/10 border-warn/30" : "text-info bg-info/10 border-info/30";
  return (
    <Frame className="flex flex-col justify-center">
      <div className="flex items-start gap-3">
        <span className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl border", c)}>{icon}</span>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-fog">{title}</div>
          <p className="mt-1 text-sm text-mute">{children}</p>
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </Frame>
  );
}

/** Small avatar + handle chip shown in the stepper header after the Instagram step. */
export function IgMiniChip({ state }: { state: PreviewState }) {
  if (state.status === "idle" || state.status === "invalid") return null;
  const pic = state.status === "ok" || state.status === "private" ? state.preview.profilePicUrl : null;
  const dot = state.status === "loading" ? "bg-warn animate-pulse" : state.status === "ok" ? "bg-ok" : state.status === "taken" ? "bg-bad" : "bg-info";
  const label = state.status === "loading" ? "fetching" : state.status === "ok" ? "synced" : state.status === "private" ? "private" : state.status === "taken" ? "taken" : "sync later";
  return (
    <span className="chip max-w-[12rem] gap-1.5 py-1 pl-1 pr-2.5">
      {pic ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imgSrc(pic)} alt="" width={20} height={20} referrerPolicy="no-referrer" className="h-5 w-5 rounded-full object-cover" />
      ) : (
        <InstagramIcon className="h-4 w-4 text-mute" />
      )}
      <span className="truncate">@{state.handle}</span>
      <span className={clsx("h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}
