import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

const options = [
  {
    href: "/register?type=influencer",
    title: "Influencer / Content creator",
    desc: "Instagram creators of any size. Paste your profile link and we fetch followers and engagement automatically.",
    tag: "Creators",
  },
  {
    href: "/register?type=event",
    title: "Event talent",
    desc: "Promoters, hosts & anchors, technical crew, musicians, DJs, dancers, comics and specialty performers.",
    tag: "Vigor Talent Network",
  },
];

export default function JoinPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-14">
        <h1 className="text-3xl font-black tracking-tight">How do you want to join?</h1>
        <p className="mt-2 text-mute">You can add the other role to your profile later.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {options.map((o) => (
            <Link key={o.href} href={o.href} className="card group p-6 transition hover:border-brand">
              <span className="chip border-brand/40 text-brand">{o.tag}</span>
              <div className="mt-3 text-lg font-bold group-hover:text-brand">{o.title}</div>
              <p className="mt-2 text-sm text-mute">{o.desc}</p>
              <div className="mt-4 text-sm font-semibold text-brand">Continue →</div>
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-mute">
          Representing a brand? <Link href="/brands" className="text-brand hover:underline">Send us your requirement</Link>.
        </p>
      </main>
    </>
  );
}
