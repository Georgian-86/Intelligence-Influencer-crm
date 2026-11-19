import { Sk } from "@/components/skeletons";

/** Route skeletons that mirror the final layouts (CLS 0). */
function Title({ back = false }: { back?: boolean }) {
  return (
    <div className="mb-8 space-y-3">
      {back && <Sk className="h-4 w-24" />}
      <Sk className="h-4 w-40" />
      <Sk className="h-10 w-80 max-w-full" />
      <Sk className="h-4 w-[520px] max-w-full" />
    </div>
  );
}
const Wrap = ({ children }: { children: React.ReactNode }) => <div role="status" aria-label="Loading">{children}</div>;
const KpiStrip = ({ n }: { n: number }) => (
  <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-line bg-line" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
    {Array.from({ length: n }).map((_, i) => <div key={i} className="space-y-3 bg-surface p-5"><Sk className="h-3 w-20" /><Sk className="h-8 w-24" /><Sk className="h-3 w-28" /></div>)}
  </div>
);

export function BrandHomeSkeleton() {
  return (
    <Wrap>
      <Title />
      <Sk className="mb-3 h-5 w-32" />
      <div className="mb-10 grid gap-4 lg:grid-cols-2"><Sk className="h-[300px] rounded-[28px]" /><Sk className="h-[300px] rounded-[28px]" /></div>
      <Sk className="mb-3 h-5 w-40" />
      <div className="space-y-4"><Sk className="h-[280px] rounded-[20px]" /><Sk className="h-[280px] rounded-[20px]" /></div>
    </Wrap>
  );
}
export function ShortlistSkeleton() {
  return (
    <Wrap>
      <Title back />
      <Sk className="mb-6 h-[76px] rounded-[22px]" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"><Sk className="h-[560px] rounded-[28px]" /><Sk className="h-[560px] rounded-[20px]" /></div>
    </Wrap>
  );
}
export function ReviewSkeleton() {
  return (
    <Wrap>
      <Title back />
      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-[84px] rounded-[16px]" />)}</div>
        <div className="grid gap-6 lg:grid-cols-[340px_minmax(0,1fr)]"><Sk className="aspect-[9/16] w-full max-w-[340px] rounded-[36px]" /><div className="space-y-5"><Sk className="h-14 w-64" /><Sk className="h-[140px] rounded-[20px]" /><Sk className="h-[180px] rounded-[20px]" /></div></div>
      </div>
    </Wrap>
  );
}
export function ReportSkeleton() {
  return (
    <Wrap>
      <Title back />
      <KpiStrip n={4} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]"><Sk className="h-[380px] rounded-[20px]" /><Sk className="h-[380px] rounded-[20px]" /></div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2"><Sk className="h-[340px] rounded-[20px]" /><Sk className="h-[340px] rounded-[20px]" /></div>
    </Wrap>
  );
}
export function BriefSkeleton() {
  return (
    <Wrap>
      <Title />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"><Sk className="h-[560px] rounded-[20px]" /><div className="space-y-4"><Sk className="h-[260px] rounded-[28px]" /><Sk className="h-[160px] rounded-[20px]" /></div></div>
    </Wrap>
  );
}
export function AdminSkeleton() {
  return (
    <Wrap>
      <Title />
      <div className="mb-8"><KpiStrip n={5} /></div>
      <div className="card divide-y divide-line overflow-hidden">
        <div className="flex justify-between p-5"><Sk className="h-5 w-24" /><Sk className="h-9 w-80" /></div>
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex items-center gap-4 px-5 py-4"><Sk className="h-10 w-10 rounded-full" /><Sk className="h-4 flex-1" /><Sk className="h-6 w-32" /><Sk className="h-9 w-48 rounded-full" /></div>)}
      </div>
    </Wrap>
  );
}
export function TalentSkeleton() {
  return (
    <Wrap>
      <Sk className="mb-4 h-4 w-32" />
      <div className="mb-6 flex items-center gap-4"><Sk className="h-16 w-16 rounded-full" /><div className="space-y-2"><Sk className="h-8 w-64" /><Sk className="h-4 w-80" /></div></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"><div className="space-y-6"><Sk className="h-[460px] rounded-[20px]" /><Sk className="h-[140px] rounded-[20px]" /></div><Sk className="h-[640px] rounded-[20px]" /></div>
    </Wrap>
  );
}
export function TeamSkeleton() {
  return (
    <Wrap>
      <Title />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"><Sk className="h-[420px] rounded-[20px]" /><Sk className="h-[360px] rounded-[20px]" /></div>
      <Sk className="mt-6 h-[420px] rounded-[20px]" />
    </Wrap>
  );
}
export function CockpitSkeleton() {
  return (
    <Wrap>
      <Title />
      <KpiStrip n={6} />
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]"><Sk className="h-[380px] rounded-[20px]" /><Sk className="h-[380px] rounded-[20px]" /></div>
      <Sk className="mt-6 h-[320px] rounded-[20px]" />
    </Wrap>
  );
}
