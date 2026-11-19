/** Route skeletons that mirror each CRM layout's final geometry (no layout shift on load). */
import { Sk } from "@/components/skeletons";

const Head = () => <div className="mb-6 space-y-2"><Sk className="h-8 w-56" /><Sk className="h-4 w-80" /></div>;

export function TodaySkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2"><Sk className="h-4 w-40" /><Sk className="h-10 w-80" /><Sk className="h-4 w-96" /></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-[170px] rounded-[20px]" />)}</div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8"><Sk className="h-[460px] rounded-[20px]" /><div className="grid gap-3 sm:grid-cols-2">{[0, 1].map((i) => <Sk key={i} className="h-40 rounded-[20px]" />)}</div></div>
        <div className="space-y-6 lg:col-span-4"><Sk className="h-[340px] rounded-[20px]" /><Sk className="h-[420px] rounded-[20px]" /></div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading">
      <Head />
      <div className="mb-4 flex gap-1.5">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-8 w-32 rounded-full" />)}</div>
      <Sk className="mb-4 h-[118px] rounded-[20px]" />
      <div className="card overflow-hidden">
        <div className="h-10 bg-canvas-2/70" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex h-[52px] items-center gap-3 border-t border-line px-4"><Sk className="h-4 w-4" /><Sk className="h-8 w-8 rounded-full" /><Sk className="h-4 w-40" /><Sk className="ml-auto h-4 w-16" /><Sk className="h-4 w-12" /><Sk className="h-5 w-16 rounded-full" /><Sk className="h-4 w-20" /></div>
        ))}
      </div>
    </div>
  );
}

export function CardsSkeleton({ n = 6, h = "h-[330px]" }: { n?: number; h?: string }) {
  return (
    <div role="status" aria-label="Loading">
      <Head />
      <Sk className="mb-5 h-10 w-80 rounded-full" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: n }).map((_, i) => <Sk key={i} className={`${h} rounded-[20px]`} />)}</div>
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Loading">
      <Sk className="h-4 w-24" />
      <div className="flex gap-4"><Sk className="h-13 w-13 rounded-[12px]" /><div className="flex-1 space-y-2"><Sk className="h-4 w-24" /><Sk className="h-8 w-72" /><Sk className="h-5 w-96" /></div></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-[120px] rounded-[20px]" />)}</div>
      <Sk className="h-11 w-full rounded-none" />
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="h-[420px] rounded-[18px]" />)}</div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Sk className="h-4 w-16" />
      <Sk className="h-[220px] rounded-[20px]" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{Array.from({ length: 5 }).map((_, i) => <Sk key={i} className="h-[104px] rounded-[20px]" />)}</div>
      <div className="grid gap-6 lg:grid-cols-12"><Sk className="h-[520px] rounded-[20px] lg:col-span-8" /><Sk className="h-[520px] rounded-[20px] lg:col-span-4" /></div>
    </div>
  );
}

export function SplitSkeleton({ cols = "lg:grid-cols-12", left = "lg:col-span-5", right = "lg:col-span-7" }: { cols?: string; left?: string; right?: string }) {
  return (
    <div role="status" aria-label="Loading">
      <Head />
      <div className={`grid gap-6 ${cols}`}><Sk className={`h-[560px] rounded-[20px] ${left}`} /><Sk className={`h-[560px] rounded-[20px] ${right}`} /></div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div className="space-y-4" role="status" aria-label="Loading">
      <Sk className="h-4 w-40" /><div className="flex gap-3"><Sk className="h-10 w-10 rounded-[12px]" /><div className="space-y-2"><Sk className="h-6 w-48" /><Sk className="h-4 w-80" /></div></div>
      <div className="grid gap-4 lg:h-[calc(100dvh-210px)] lg:min-h-[560px] lg:grid-cols-[280px_minmax(0,1fr)_340px]"><Sk className="h-full min-h-40 rounded-[20px]" /><Sk className="h-full min-h-96 rounded-[24px]" /><Sk className="h-full min-h-60 rounded-[20px]" /></div>
    </div>
  );
}
