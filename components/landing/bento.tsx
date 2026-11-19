import type { ReactNode } from "react";
import { clsx } from "clsx";
import { BadgeCheck, Check, CircleDollarSign, GraduationCap, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Avatar, MediaTile, Sparkline, km } from "@/components/kit";
import { InstagramIcon, WhatsAppIcon } from "@/components/brand/icons";
import { ME } from "@/lib/demo/fixtures";

function Tile({ title, body, className, children, tone = "light" }: { title: string; body: string; className?: string; children: ReactNode; tone?: "light" | "night" | "cobalt" }) {
  const dark = tone !== "light";
  return (
    <article className={clsx("group relative flex flex-col overflow-hidden rounded-[28px] border p-6 transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 sm:p-7",
      tone === "night" ? "border-white/10 bg-night text-white hover:shadow-lg" : tone === "cobalt" ? "border-cobalt-600 bg-cobalt text-white hover:shadow-glow" : "border-line bg-surface shadow-sm hover:shadow-md", className)}>
      <div aria-hidden className="relative flex-1">{children}</div>
      <h3 className={clsx("relative mt-6 font-display text-[22px] font-semibold leading-tight tracking-[-0.025em]", dark ? "text-white" : "text-ink")}>{title}</h3>
      <p className={clsx("relative mt-2 max-w-md text-[15px] leading-relaxed", dark ? "text-white/72" : "text-ink-2")}>{body}</p>
    </article>
  );
}

export function Bento() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6 lg:gap-5">
      <Tile className="md:col-span-2 lg:col-span-3 lg:row-span-2" title="Instagram stats, fetched for you" body="Followers, engagement, average views and recent posts are pulled from the public profile and refreshed every few days. No screenshots, no stale media kits.">
        <div className="relative min-h-[300px] rounded-[20px] bg-canvas p-5">
          <div className="flex items-center gap-3">
            <Avatar name={ME.display_name} hue={ME.hue} size={48} />
            <div>
              <div className="flex items-center gap-1 text-[15px] font-semibold text-ink">{ME.display_name} <BadgeCheck className="h-4 w-4 text-cobalt" /></div>
              <div className="flex items-center gap-1 text-[13px] text-mute"><InstagramIcon className="h-3.5 w-3.5" /> {ME.handle}</div>
            </div>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[12px] font-medium text-ink-2 shadow-xs">
              <RefreshCw className="h-3.5 w-3.5 text-cobalt transition-transform duration-700 ease-out-expo group-hover:rotate-180" /> 2h ago
            </span>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {[["Followers", km(ME.followers)], ["Eng. rate", `${ME.engagement_rate}%`], ["Avg views", km(ME.avg_views)]].map(([k, v]) => (
              <div key={k} className="rounded-2xl bg-surface p-3 shadow-xs"><div className="text-[12px] text-mute">{k}</div><div className="mt-1 font-display text-[24px] font-bold tracking-[-0.035em] text-ink tabular-nums">{v}</div></div>
            ))}
          </div>
          <Sparkline data={[38, 39, 40.2, 41, 41.8, 43, 43.6, 44.9, 45.8, 46.5, 47.4, 48.2]} className="mt-5 h-16" />
          <div className="mt-4 grid grid-cols-4 gap-2">
            {ME.posts.slice(0, 4).map((p, i) => (
              <div key={p.id} className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-1" style={{ transitionDelay: `${i * 40}ms` }}>
                <MediaTile hue={p.hue} type={p.type} />
              </div>
            ))}
          </div>
        </div>
      </Tile>

      <Tile className="lg:col-span-3" tone="night" title="WhatsApp-first ops" body="Briefs, confirmations, reminders and payout updates go where talent actually replies.">
        <div className="space-y-2">
          <div className="w-fit max-w-[78%] rounded-2xl rounded-bl-md bg-white/10 px-3.5 py-2.5 text-[13.5px] text-white transition-transform duration-500 ease-out-expo group-hover:translate-x-1">
            <span className="mb-0.5 flex items-center gap-1 text-[11.5px] font-semibold text-mint"><WhatsAppIcon className="h-3.5 w-3.5" /> Vigor Ops</span>
            Draft due tomorrow, 6 pm. Upload link inside.
          </div>
          <div className="ml-auto w-fit max-w-[60%] rounded-2xl rounded-br-md bg-[#d9fdd3] px-3.5 py-2.5 text-[13.5px] text-ink transition-transform duration-500 ease-out-expo group-hover:-translate-x-1">
            Uploaded! <span className="inline-flex translate-y-0.5 text-cobalt"><Check className="h-3.5 w-3.5" /><Check className="-ml-2 h-3.5 w-3.5" /></span>
          </div>
        </div>
      </Tile>

      <Tile className="lg:col-span-3" title="A review room, not an email thread" body="Brands comment at the exact second of a reel. Creators see one clear list of changes.">
        <div className="flex items-center gap-3">
          <MediaTile hue={226} type="reel" className="w-20 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-1.5 overflow-hidden rounded-full bg-canvas-2"><div className="h-full w-full origin-left scale-x-[.35] rounded-full bg-cobalt transition-transform duration-1000 ease-out-expo group-hover:scale-x-[.8]" /></div>
            <div className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-[13px] text-ink-2"><MessageCircle className="h-3.5 w-3.5 text-cobalt" /> <b className="text-ink">0:07</b> Hold the product a beat longer</div>
            <div className="inline-flex items-center gap-1 rounded-full bg-ok-bg px-2.5 py-1 text-[12px] font-semibold text-ok"><Check className="h-3.5 w-3.5" /> Approved v3</div>
          </div>
        </div>
      </Tile>

      <Tile className="lg:col-span-2" title="Payouts you can track" body="Every deliverable shows its rate, approval and payment status — no chasing.">
        <ul className="space-y-2 text-[13px]">
          {[["Reel · Domino's", "₹9,000", "Paid", "bg-ok-bg text-ok"], ["Stories · NUUK", "₹4,500", "Processing", "bg-info-bg text-info"], ["Event · boAt", "₹12,000", "Scheduled", "bg-canvas-2 text-ink-2"]].map(([k, v, s, c]) => (
            <li key={k} className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2">
              <CircleDollarSign className="h-4 w-4 text-cobalt" /><span className="flex-1 text-ink-2">{k}</span><b className="font-display text-ink tabular-nums">{v}</b>
              <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-semibold", c)}>{s}</span>
            </li>
          ))}
        </ul>
      </Tile>

      <Tile className="lg:col-span-2" tone="cobalt" title="Campus targeting" body="Target by city, campus and graduation year — reach a batch, not just a pincode.">
        <div className="flex flex-wrap gap-2">
          {["NMIMS", "Mithibai", "Xavier's", "SRCC", "Christ", "Symbiosis", "IIT Bombay"].map((c, i) => (
            <span key={c} className={clsx("inline-flex h-8 items-center gap-1 rounded-full px-3 text-[13px] font-medium transition-transform duration-500 ease-out-expo group-hover:-translate-y-0.5",
              i < 3 ? "bg-white text-cobalt" : "bg-white/15 text-white")} style={{ transitionDelay: `${i * 30}ms` }}>
              {i < 3 && <GraduationCap className="h-3.5 w-3.5" />}{c}
            </span>
          ))}
        </div>
      </Tile>

      <Tile className="md:col-span-2 lg:col-span-2" title="Verified insights" body="Creators can connect Instagram insights for audience age, gender and city — marked verified for brands.">
        <div className="space-y-2.5">
          {[["18–24 yrs", 68], ["Female", 61], ["Mumbai", 41]].map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 text-[13px]">
              <span className="w-16 text-mute">{k}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-canvas-2"><span className="block h-full origin-left rounded-full bg-cobalt transition-transform duration-700 ease-out-expo group-hover:scale-x-105" style={{ width: `${v}%` }} /></span>
              <b className="w-9 text-right font-display tabular-nums text-ink">{v}%</b>
            </div>
          ))}
          <span className="inline-flex items-center gap-1 rounded-full bg-cobalt-50 px-2.5 py-1 text-[12px] font-semibold text-cobalt"><ShieldCheck className="h-3.5 w-3.5" /> Verified via Instagram</span>
        </div>
      </Tile>
    </div>
  );
}
