import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Inbox, ListChecks, Megaphone, RefreshCw, Trophy } from "lucide-react";
import { IgCard } from "@/components/ig-card";
import { InstagramIcon } from "@/components/brand/icons";
import { CountUp } from "@/components/motion/reveal";
import { Banner, EmptyState, SectionTitle, TalentHeader } from "@/components/talent/bits";
import { StatusCard } from "@/components/talent/status-card";
import { BriefCard } from "@/components/talent/brief-card";
import { ApplicationUpdateRow, type TalentApplication } from "@/components/talent/application-card";
import { profileCompletion, type TalentBrief } from "@/components/talent/model";
import { createClient } from "@/lib/supabase/server";
import { getMyTalent } from "@/lib/session";
import { mismatches } from "@/lib/match";
import { refreshMyInstagram } from "./actions";

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(new Date()));
  return h < 5 ? "Hey" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ welcome?: string; saved?: string; refresh?: string }> }) {
  const sp = await searchParams;
  const talent = await getMyTalent();
  if (!talent) redirect("/onboarding");
  const approved = talent.status === "approved";
  const supabase = await createClient();
  const [{ data: ig }, { data: intents }, { data: briefs }, { data: contact }, { count: mediaCount }] = await Promise.all([
    supabase.from("social_accounts").select("*").eq("talent_id", talent.id).eq("platform", "instagram").maybeSingle(),
    supabase
      .from("intents")
      .select("id, stage, source, quoted_rate, agreed_rate, created_at, updated_at, brief_id, briefs(title, brand_display, event_date)")
      .eq("talent_id", talent.id)
      .order("updated_at", { ascending: false }),
    approved
      ? supabase.from("briefs").select("*").eq("status", "open").order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as never[] }),
    supabase.from("talent_contacts").select("phone, whatsapp").eq("talent_id", talent.id).maybeSingle(),
    supabase.from("talent_media").select("id", { count: "exact", head: true }).eq("talent_id", talent.id),
  ]);
  const { data: posts } = ig
    ? await supabase.from("social_posts").select("id, shortcode, post_type, url, caption, thumbnail_url, likes, comments, views")
      .eq("account_id", ig.id).order("posted_at", { ascending: false }).limit(6)
    : { data: null };

  const apps: TalentApplication[] = (intents ?? []).map((i) => ({ ...i, brief: i.briefs as unknown as TalentApplication["brief"] }));
  const applied = new Map(apps.map((a) => [a.brief_id, a.stage]));
  const eligible = ((briefs ?? []) as (TalentBrief & Parameters<typeof mismatches>[0])[])
    .filter((b) => mismatches(b, { ...talent, ...(ig ?? {}) }).length === 0);
  const fresh = eligible.filter((b) => !applied.has(b.id));
  const active = apps.filter((i) => !["rejected", "dropped", "delivered"].includes(i.stage)).length;
  const confirmed = apps.filter((i) => i.stage === "confirmed" || i.stage === "delivered").length;

  const completion = profileCompletion({
    ...talent,
    igOk: ig?.fetch_status === "ok",
    mediaCount: mediaCount ?? 0,
    hasPhone: !!(contact?.phone || contact?.whatsapp),
  });

  const first = talent.display_name.split(" ")[0];
  const kind = [talent.is_influencer && "Creator", talent.is_event_talent && "Event talent"].filter(Boolean).join(" · ");

  return (
    <>
      <TalentHeader
        eyebrow={[kind, talent.city].filter(Boolean).join(" · ") || undefined}
        title={`${greeting()}, ${first}`}
        subtitle={approved
          ? fresh.length ? `${fresh.length} new brief${fresh.length === 1 ? "" : "s"} match your profile.` : "You're all caught up — we'll surface new briefs as they land."
          : "Here's where your profile stands."}
      />

      {(sp.welcome || sp.saved || sp.refresh === "wait") && (
        <div className="mb-6 space-y-2">
          {sp.welcome && <Banner kind="ok">Profile submitted! We&apos;re fetching your Instagram data and the team will review you shortly.</Banner>}
          {sp.saved && <Banner kind="ok">Profile saved.</Banner>}
          {sp.refresh === "wait" && <Banner>Metrics were refreshed less than an hour ago — try again later.</Banner>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <StatusCard status={talent.status} rank={talent.rank} />

          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              { label: "Matching briefs", value: approved ? eligible.length : null, icon: Megaphone, href: "/dashboard/briefs" },
              { label: "Active", value: active, icon: ListChecks, href: "/dashboard/applications" },
              { label: "Confirmed", value: confirmed, icon: Trophy, href: "/dashboard/applications" },
            ].map(({ label, value, icon: Icon, href }) => (
              <Link key={label} href={href} className="card card-hover block p-3 sm:p-4">
                <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-mute">
                  <Icon className="h-3.5 w-3.5 max-sm:hidden" aria-hidden />{label}
                </dt>
                <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-fog sm:text-3xl">
                  {value == null ? <span className="text-mute" title="Visible after approval">—</span> : <CountUp to={value} />}
                </dd>
              </Link>
            ))}
          </dl>

          {approved && (
            <section aria-labelledby="matching-title">
              <SectionTitle id="matching-title" title="Briefs matching you" href={eligible.length ? "/dashboard/briefs" : undefined} count={fresh.length || undefined} />
              {fresh.length === 0 ? (
                <EmptyState icon={Megaphone} title={eligible.length ? "You've raised your hand on every match" : "No matching briefs right now"}
                  action={<Link href="/dashboard/profile" className="btn-ghost min-h-11">Broaden your profile</Link>}>
                  New campaigns are posted every week. Adding more categories and cities widens what you match.
                </EmptyState>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {fresh.slice(0, 2).map((b) => <BriefCard key={b.id} b={b} compact />)}
                </div>
              )}
            </section>
          )}

          {ig ? (
            <IgCard acc={ig} posts={posts} action={
              <form action={refreshMyInstagram}>
                <input type="hidden" name="account_id" value={ig.id} />
                <button className="btn-ghost min-h-11 px-3 text-xs" aria-label="Refresh Instagram stats">
                  <RefreshCw className="h-3.5 w-3.5" aria-hidden /><span className="max-sm:sr-only">Refresh</span>
                </button>
              </form>
            } />
          ) : talent.is_influencer ? (
            <EmptyState icon={InstagramIcon} title="Connect your Instagram"
              action={<Link href="/dashboard/profile" className="btn-primary min-h-11">Add Instagram handle</Link>}>
              We pull your followers and engagement automatically so brands see real numbers — no screenshots needed.
            </EmptyState>
          ) : null}
        </div>

        <aside className="min-w-0 space-y-6">
          {/* ProfileStrength slot — the profile-strength meter component drops in here and replaces the hint below. */}
          <section aria-labelledby="completion-title" className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="completion-title" className="font-bold text-fog">Profile completeness</h2>
              <span className="font-display text-lg font-bold tabular-nums text-brand-2">{completion.pct}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-4" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.pct} aria-labelledby="completion-title">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand-2" style={{ width: `${completion.pct}%` }} />
            </div>
            {completion.missing.length ? (
              <>
                <p className="mt-3 text-sm text-mute">Complete profiles get matched to more briefs. Next up:</p>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {completion.missing.slice(0, 3).map((m) => (
                    <li key={m} className="flex items-center gap-2 text-fog/90"><span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand" />{m}</li>
                  ))}
                </ul>
                <Link href="/dashboard/profile" className="btn-ghost mt-4 min-h-11 w-full">Finish profile <ArrowRight className="h-4 w-4" aria-hidden /></Link>
              </>
            ) : (
              <p className="mt-3 text-sm text-mute">Your profile is complete — nice. Keep rates and samples fresh.</p>
            )}
          </section>

          <section aria-labelledby="updates-title">
            <SectionTitle id="updates-title" title="Latest updates" href={apps.length ? "/dashboard/applications" : undefined} />
            {apps.length === 0 ? (
              <EmptyState icon={Inbox} title="No applications yet" className="py-8 sm:py-10"
                action={approved ? <Link href="/dashboard/briefs" className="btn-ghost min-h-11">Browse briefs</Link> : undefined}>
                {approved ? "Tap “I'm in” on a brief and every status change shows up here." : "Once you're approved, every application update shows up here."}
              </EmptyState>
            ) : (
              <ul className="card divide-y divide-line overflow-hidden">
                {apps.slice(0, 4).map((a) => <ApplicationUpdateRow key={a.id} a={a} />)}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
