"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";
import { BarChart3, Check, CircleCheck, Eye, FileText, MessageSquareText, Play, Send, Sparkles, Users } from "lucide-react";
import { Avatar, MediaTile, Sparkline } from "@/components/kit";
import { WhatsAppIcon } from "@/components/brand/icons";

type Step = { key: string; title: string; body: string; icon: typeof FileText; frame: (on: boolean) => ReactNode };

const STEPS: Step[] = [
  { key: "brief", title: "Brief in", body: "A brand sends goals, cities, talent mix and budget — in two minutes, from a phone.", icon: FileText, frame: () => <BriefFrame /> },
  { key: "match", title: "AI match", body: "Every creator is scored on niche, city, campus, engagement and past reliability. Not follower count alone.", icon: Sparkles, frame: (on) => <MatchFrame on={on} /> },
  { key: "shortlist", title: "Shortlist", body: "Vigor's team hand-checks the top matches and sends a review link. The brand approves from their phone.", icon: Users, frame: (on) => <ShortlistFrame on={on} /> },
  { key: "whatsapp", title: "WhatsApp brief", body: "Confirmed talent gets the brief, dates and deliverables on WhatsApp — where they actually reply.", icon: MessageSquareText, frame: (on) => <ChatFrame on={on} /> },
  { key: "review", title: "Content review", body: "Drafts land in a review room with time-stamped comments. One click to approve or ask for changes.", icon: Play, frame: () => <ReviewFrame /> },
  { key: "live", title: "Live", body: "Posts go live on schedule. Views, likes and comments are tracked automatically at 24h, 72h and 7 days.", icon: Eye, frame: (on) => <LiveFrame on={on} /> },
  { key: "report", title: "Report", body: "One shareable report: reach, views, engagement and cost per view, by city and by campus.", icon: BarChart3, frame: () => <ReportFrame /> },
];

/** Sticky scroll storytelling: the frame sticks while steps scroll past; a rail shows progress. */
export function LaunchStory() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i)); }),
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-16">
      {/* sticky frame (desktop) */}
      <div className="hidden lg:block">
        <div className="sticky top-28">
          <div className="relative aspect-[5/4] overflow-hidden rounded-[36px] bg-night shadow-lg">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_20%,rgb(43_75_255/.5),transparent_70%),radial-gradient(50%_40%_at_10%_90%,rgb(195_181_255/.25),transparent_70%)]" />
            <div className="absolute left-6 top-6 flex items-center gap-2 text-[13px] font-medium text-white/70">
              <span className="font-display text-[15px] font-bold text-white tabular-nums">{String(active + 1).padStart(2, "0")}</span>
              <span className="text-white/40">/ 07</span>
              <span className="ml-2">{STEPS[active].title}</span>
            </div>
            <div aria-hidden className="absolute inset-0 grid place-items-center p-10 pt-16">
              {STEPS.map((s, i) => (
                <div key={s.key} className={clsx("absolute inset-0 grid place-items-center p-10 pt-16 transition-[opacity,transform] duration-500 ease-out-expo",
                  i === active ? "translate-y-0 scale-100 opacity-100" : i < active ? "-translate-y-6 scale-[.97] opacity-0" : "translate-y-6 scale-[.97] opacity-0")}>
                  {s.frame(i === active)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* steps + rail */}
      <ol className="relative">
        <span aria-hidden className="absolute bottom-6 left-[19px] top-6 w-px bg-line" />
        <span aria-hidden className="absolute left-[19px] top-6 w-px origin-top bg-cobalt transition-transform duration-500 ease-out-expo" style={{ height: "calc(100% - 3rem)", transform: `scaleY(${(active + 1) / STEPS.length})` }} />
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const on = i === active;
          return (
            <li key={s.key} ref={(el) => { refs.current[i] = el; }} data-i={i} className="relative flex gap-5 pb-12 lg:min-h-[44vh] lg:pb-0" aria-current={on ? "step" : undefined}>
              <span className={clsx("relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-full border transition-[background-color,border-color,color] duration-300",
                on ? "border-cobalt bg-cobalt text-white" : i < active ? "border-cobalt-200 bg-cobalt-50 text-cobalt" : "border-line bg-surface text-mute")}>
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-1.5">
                <div className="text-[13px] font-medium text-mute tabular-nums">Step {i + 1} of {STEPS.length}</div>
                <h3 className={clsx("mt-1 font-display text-[clamp(1.6rem,2.6vw,2.25rem)] font-bold leading-[1.05] tracking-[-0.035em] transition-colors duration-300", on ? "text-ink" : "text-ink/45 max-lg:text-ink")}>{s.title}</h3>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-ink-2">{s.body}</p>
                <div aria-hidden className="relative mt-6 grid aspect-[5/4] w-full max-w-[520px] place-items-center overflow-hidden rounded-[28px] bg-night p-5 lg:hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_70%_20%,rgb(43_75_255/.5),transparent_70%)]" />
                  <div className="relative w-full">{s.frame(true)}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ---------- frames (white UI on night) ---------- */
function Frame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("relative mx-auto w-full max-w-[400px] rounded-[22px] bg-surface p-4 text-ink shadow-lg sm:p-5", className)}>{children}</div>;
}

function BriefFrame() {
  return (
    <Frame>
      <div className="flex items-center justify-between"><span className="text-[12px] font-semibold text-cobalt">New brief</span><span className="chip border-flame/30 bg-flame-50 text-flame-700">Received 2m ago</span></div>
      <div className="mt-2 font-display text-[20px] font-bold tracking-[-0.03em]">Campus Fest Takeover &apos;26</div>
      <div className="text-[13px] text-mute">Domino&apos;s · QSR</div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-[13px]">
        {[["Talent", "50 creators + 20 promoters"], ["Cities", "Mumbai, Pune, Delhi"], ["Window", "30 days"], ["Budget", "₹18.5 lakh"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-canvas p-2.5"><dt className="text-[11.5px] text-mute">{k}</dt><dd className="mt-0.5 font-semibold text-ink">{v}</dd></div>
        ))}
      </dl>
    </Frame>
  );
}

function MatchFrame({ on }: { on: boolean }) {
  const rows = [["Riya Shah", 14, 96], ["Kabir Malhotra", 210, 93], ["Saanvi Rao", 330, 89], ["Om Kulkarni", 90, 84]] as const;
  return (
    <Frame>
      <div className="flex items-center gap-2 text-[13px] font-semibold"><Sparkles className="h-4 w-4 text-cobalt" /> Scoring 12,480 profiles</div>
      <ul className="mt-3 space-y-2.5">
        {rows.map(([n, h, m], i) => (
          <li key={n} className="flex items-center gap-3">
            <Avatar name={n} hue={h} size={30} />
            <div className="min-w-0 flex-1">
              <div className="flex justify-between text-[13px]"><span className="font-semibold">{n}</span><span className="font-display font-bold tabular-nums text-cobalt">{m}%</span></div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas-2">
                <div className="h-full origin-left rounded-full bg-cobalt transition-transform duration-700 ease-out-expo" style={{ width: `${m}%`, transform: `scaleX(${on ? 1 : 0})`, transitionDelay: `${i * 90}ms` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function ShortlistFrame({ on }: { on: boolean }) {
  return (
    <Frame>
      <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Review link · 15 creators</span><span className="text-[12px] text-mute">brand view</span></div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[24, 300, 160, 48, 210, 330].map((h, i) => (
          <div key={h} className="relative">
            <MediaTile hue={h} className="aspect-square rounded-xl" />
            <span className={clsx("absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-ok text-white shadow transition-[opacity,transform] duration-300 ease-spring", on && i < 5 ? "scale-100 opacity-100" : "scale-50 opacity-0")} style={{ transitionDelay: `${i * 120 + 200}ms` }}>
              <Check className="h-3.5 w-3.5" />
            </span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[13px]"><span className="text-mute">Approved</span><b className="font-display tabular-nums">12 / 15</b></div>
    </Frame>
  );
}

function ChatFrame({ on }: { on: boolean }) {
  const msgs = [
    { me: false, t: "Hi Riya! You're confirmed for Campus Fest Takeover." },
    { me: false, t: "1 Reel + 3 Stories · draft due Fri · ₹9,000" },
    { me: true, t: "YES — locking it in!" },
  ];
  return (
    <Frame className="bg-[#efeae2]">
      <div className="-mx-4 -mt-4 mb-3 flex items-center gap-2 rounded-t-[22px] bg-[#075e54] px-4 py-3 text-white sm:-mx-5 sm:-mt-5">
        <WhatsAppIcon className="h-4 w-4" /><span className="text-[13px] font-semibold">Vigor Ops</span><span className="ml-auto text-[11px] text-white/70">online</span>
      </div>
      <div className="space-y-2">
        {msgs.map((m, i) => (
          <div key={i} className={clsx("max-w-[85%] rounded-2xl px-3 py-2 text-[13px] leading-snug shadow-xs transition-[opacity,transform] duration-500 ease-out-expo",
            m.me ? "ml-auto rounded-br-md bg-[#d9fdd3]" : "rounded-bl-md bg-white", on ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0")} style={{ transitionDelay: `${i * 260}ms` }}>
            {m.t}
          </div>
        ))}
      </div>
    </Frame>
  );
}

function ReviewFrame() {
  return (
    <Frame>
      <div className="grid grid-cols-[110px_1fr] gap-3">
        <div className="relative"><MediaTile hue={18} type="reel" className="rounded-xl" /><span className="absolute inset-x-2 bottom-2 h-1 overflow-hidden rounded-full bg-white/40"><span className="block h-full w-2/3 bg-white" /></span></div>
        <div className="space-y-2 text-[12.5px]">
          <div className="text-[13px] font-semibold">Draft v2 · Reel</div>
          <div className="rounded-xl bg-canvas p-2"><b className="text-cobalt">0:04</b> Show the box earlier</div>
          <div className="rounded-xl bg-canvas p-2"><b className="text-cobalt">0:11</b> Love this transition</div>
          <div className="flex gap-1.5 pt-1">
            <span className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-ok text-[12px] font-semibold text-white"><CircleCheck className="h-3.5 w-3.5" /> Approve</span>
            <span className="inline-flex h-8 items-center rounded-full border border-line px-2.5 text-[12px] font-medium">Changes</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

function LiveFrame({ on }: { on: boolean }) {
  return (
    <Frame>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold"><span className="h-2 w-2 animate-pulse rounded-full bg-flame" /> 61 of 100 posts live</span>
        <span className="text-[12px] text-mute">updated 4m ago</span>
      </div>
      <div className="mt-3 font-display text-[34px] font-bold leading-none tracking-[-0.04em] tabular-nums">74.0L <span className="text-[14px] font-medium tracking-normal text-mute">views</span></div>
      <Sparkline data={[3, 6, 9, 14, 22, 31, 39, 47, 55, 62, 69, 74]} className={clsx("mt-3 h-14 transition-opacity duration-700", on ? "opacity-100" : "opacity-0")} />
      <div className="mt-2 grid grid-cols-3 gap-2 text-center text-[12px]">
        {[["24h", "18.2L"], ["72h", "46.9L"], ["7d", "74.0L"]].map(([k, v]) => <div key={k} className="rounded-lg bg-canvas py-1.5"><div className="text-mute">{k}</div><b className="font-display text-[14px]">{v}</b></div>)}
      </div>
    </Frame>
  );
}

function ReportFrame() {
  return (
    <Frame>
      <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">Campaign report</span><span className="inline-flex items-center gap-1 text-[12px] font-semibold text-cobalt"><Send className="h-3.5 w-3.5" /> Share</span></div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {[["Reach", "48.2L"], ["Views", "74.0L"], ["Eng. rate", "5.8%"], ["Cost / view", "₹0.15"]].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-canvas p-3"><div className="text-[11.5px] text-mute">{k}</div><div className="font-display text-[22px] font-bold tracking-[-0.03em] tabular-nums">{v}</div></div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5 text-[12px]">
        {[["Mumbai", 52], ["Pune", 28], ["Delhi", 20]].map(([c, v]) => (
          <div key={c} className="flex items-center gap-2"><span className="w-14 text-mute">{c}</span><span className="h-2 rounded-full bg-cobalt" style={{ width: `${v}%` }} /><b className="tabular-nums">{v}%</b></div>
        ))}
      </div>
    </Frame>
  );
}
