"use client";

import { motion, useReducedMotion } from "motion/react";
import { BadgeCheck, GraduationCap, MapPin, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { Avatar, MediaTile, km } from "@/components/kit";
import { CountUp } from "@/components/motion/reveal";
import type { Draft } from "./types";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The profile as brands will see it — fills in live as the creator answers each step. */
export function PreviewCard({ d, fetching, variant = "full" }: { d: Draft; fetching: boolean; variant?: "full" | "mini" }) {
  const reduce = useReducedMotion();
  const p = d.preview;
  const name = d.fullName || p?.fullName || (d.handle ? `@${d.handle}` : "");
  const has = !!p || d.manual;
  const rise = (delay: number) => (reduce ? {} : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: EASE, delay } });
  const college = d.inCollege && d.college ? `${d.college.name.replace(/^SVKM's\s+/, "")}${d.gradYear ? ` '${String(d.gradYear).slice(2)}` : ""}` : null;

  if (variant === "mini") {
    if (!has) return null;
    return (
      <div className="flex items-center gap-3 rounded-[18px] border border-line bg-surface p-3 shadow-sm">
        <Photo url={p?.photoUrl ?? null} name={name || "You"} size={44} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{name}</div>
          <div className="flex flex-wrap items-center gap-x-2 text-[12.5px] text-mute">
            {p?.followers != null && <span className="tabular-nums">{km(p.followers)} followers</span>}
            {d.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{d.city}</span>}
            {college && <span className="inline-flex items-center gap-1 truncate"><GraduationCap className="h-3 w-3" />{college}</span>}
          </div>
        </div>
        {p?.engagementRate != null && <span className="rounded-full bg-cobalt-50 px-2.5 py-1 text-[12px] font-semibold tabular-nums text-cobalt-700">{p.engagementRate}% ER</span>}
      </div>
    );
  }

  const strength = Math.min(100, 20 + (p ? 30 : d.manual ? 10 : 0) + (d.inCollege !== null ? 15 : 0) + (d.interests.length ? 15 : 0) + (d.whatsapp ? 10 : 0));

  return (
    <article aria-label="Profile preview" className="relative overflow-hidden rounded-[28px] border border-line bg-surface shadow-lg">
      {/* banner */}
      <div className="relative h-24 overflow-hidden"
        style={{ background: p ? "linear-gradient(120deg, var(--color-cobalt), var(--color-cobalt-400) 45%, var(--color-lilac))" : "var(--color-canvas-2)" }}>
        {p && <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_120%_at_85%_0%,rgb(255_255_255/.45),transparent)]" />}
        {fetching && <div className="skeleton absolute inset-0 rounded-none" />}
      </div>

      <div className="px-6 pb-6">
        <div className="-mt-10 flex items-end justify-between">
          <div className="rounded-full bg-surface p-1">
            {p || d.manual ? (
              <motion.div key={p?.handle ?? "manual"} {...(reduce ? {} : { initial: { scale: 0.6, opacity: 0 }, animate: { scale: 1, opacity: 1 }, transition: { duration: 0.6, ease: EASE } })}>
                <Photo url={p?.photoUrl ?? null} name={name || "You"} size={76} />
              </motion.div>
            ) : (
              <div className={clsx("h-[76px] w-[76px] rounded-full", fetching ? "skeleton rounded-full" : "border-2 border-dashed border-line-2 bg-canvas")} />
            )}
          </div>
          {p && (
            <motion.span {...rise(0.75)} className="mb-1 inline-flex items-center gap-1 rounded-full bg-ok-bg px-2.5 py-1 text-[12px] font-semibold text-ok">
              <BadgeCheck className="h-3.5 w-3.5" /> Synced from Instagram
            </motion.span>
          )}
        </div>

        {/* identity */}
        <div className="mt-3 min-h-[52px]">
          {has ? (
            <motion.div key={`id-${p?.handle ?? "m"}`} {...rise(0.1)}>
              <h3 className="font-display text-[22px] font-bold leading-tight tracking-[-0.03em]">{name}</h3>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mute">
                {p && <span>@{p.handle}</span>}
                {d.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{d.city}</span>}
                {college && <motion.span {...rise(0)} className="inline-flex items-center gap-1 font-medium text-cobalt-700"><GraduationCap className="h-3.5 w-3.5" />{college}</motion.span>}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <div className={clsx("h-5 w-40 rounded-md", fetching ? "skeleton" : "bg-canvas-2")} />
              <div className={clsx("h-3.5 w-56 rounded-md", fetching ? "skeleton" : "bg-canvas-2")} />
            </div>
          )}
        </div>

        {p?.bio && <motion.p {...rise(0.2)} className="mt-3 line-clamp-2 text-[14px] leading-relaxed text-ink-2">{p.bio}</motion.p>}

        {/* stats */}
        <dl className="mt-5 grid grid-cols-3 divide-x divide-line rounded-[16px] border border-line bg-canvas/60">
          {[
            { label: "Followers", v: p?.followers, fmt: (n: number) => km(n) },
            { label: "Engagement", v: p?.engagementRate, fmt: (n: number) => `${n}%` },
            { label: "Avg views", v: p?.avgViews, fmt: (n: number) => km(n) },
          ].map((s, i) => (
            <div key={s.label} className="px-3 py-3 text-center">
              <dt className="text-[11.5px] font-medium text-mute">{s.label}</dt>
              <dd className="mt-1 h-7 font-display text-[22px] font-bold leading-7 tracking-[-0.03em] tabular-nums">
                {p && s.v != null ? (
                  <motion.span {...rise(0.3 + i * 0.08)} className="inline-block">
                    {s.label === "Engagement" ? <CountUp to={s.v} decimals={1} suffix="%" /> : s.v >= 1000 ? <CountUpKm to={s.v} /> : s.fmt(s.v)}
                  </motion.span>
                ) : p ? <span className="text-faint">—</span> : <span className={clsx("mx-auto block h-5 w-12 rounded-md", fetching ? "skeleton" : "bg-canvas-2")} />}
              </dd>
            </div>
          ))}
        </dl>

        {/* top posts */}
        <div className="mt-5">
          <div className="mb-2 text-[12px] font-semibold text-mute">Top posts</div>
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => {
              const post = p?.posts[i];
              return post ? (
                <motion.div key={post.id} {...(reduce ? {} : { initial: { opacity: 0, scale: 0.92 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.5, ease: EASE, delay: 0.5 + i * 0.08 } })}>
                  {post.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.thumb} alt="" className="aspect-[4/5] w-full rounded-[14px] object-cover" />
                  ) : (
                    <MediaTile hue={post.hue} type={post.type} views={post.views ?? undefined} />
                  )}
                </motion.div>
              ) : (
                <div key={i} className={clsx("aspect-[4/5] rounded-[14px]", fetching ? "skeleton" : "border border-dashed border-line-2 bg-canvas")} />
              );
            })}
          </div>
        </div>

        {/* inferred chips */}
        <div className="mt-5 min-h-[28px]">
          {d.niches.length || d.languages.length ? (
            <motion.div {...rise(0.7)} className="flex flex-wrap gap-1.5">
              {d.niches.map((n) => <span key={n} className="chip h-7 border-cobalt-100 bg-cobalt-50 px-3 text-cobalt-700">{n}</span>)}
              {d.languages.map((l) => <span key={l} className="chip h-7 px-3">{l}</span>)}
            </motion.div>
          ) : (
            <div className="flex gap-1.5">{[64, 52, 72].map((w) => <span key={w} className={clsx("h-7 rounded-full", fetching ? "skeleton" : "bg-canvas-2")} style={{ width: w }} />)}</div>
          )}
        </div>

        {d.interests.length > 0 && (
          <motion.div {...rise(0)} className="mt-4 rounded-[14px] bg-canvas px-3.5 py-2.5 text-[13px] text-ink-2">
            <span className="font-semibold text-ink">Open to:</span> {d.interests.join(", ")}
          </motion.div>
        )}

        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between text-[12.5px]">
            <span className="inline-flex items-center gap-1.5 font-medium text-ink-2"><Sparkles className="h-3.5 w-3.5 text-cobalt" /> Profile strength</span>
            <span className="font-semibold tabular-nums">{strength}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-canvas-2">
            <div className="h-full w-full origin-left rounded-full bg-cobalt transition-transform duration-700 ease-out-expo" style={{ transform: `scaleX(${strength / 100})` }} />
          </div>
        </div>
      </div>
    </article>
  );
}

function CountUpKm({ to }: { to: number }) {
  // Count in the unit that will be displayed (K / M) so the number never jumps format mid-animation.
  if (to >= 1_000_000) return <CountUp to={Math.round(to / 100_000) / 10} decimals={1} suffix="M" />;
  const k = to >= 100_000 ? Math.round(to / 1000) : Math.round(to / 100) / 10;
  return <CountUp to={k} decimals={Number.isInteger(k) ? 0 : 1} suffix="K" />;
}

export function Photo({ url, name, size }: { url: string | null; name: string; size: number }) {
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" width={size} height={size} referrerPolicy="no-referrer" className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return <Avatar name={name} hue={228} size={size} />;
}
