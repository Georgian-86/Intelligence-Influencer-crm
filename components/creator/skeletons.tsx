import { clsx } from "clsx";

const S = ({ className }: { className?: string }) => <div aria-hidden className={clsx("skeleton", className)} />;
const Wrap = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div role="status" aria-label="Loading" className={className}>{children}<span className="sr-only">Loading…</span></div>
);

export function MatchCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={clsx("card flex h-[286px] flex-col p-5", className)}>
      <div className="flex gap-3"><S className="h-11 w-11 rounded-[14px]" /><div className="flex-1 space-y-2"><S className="h-3.5 w-24" /><S className="h-5 w-4/5" /></div></div>
      <div className="mt-4 flex gap-2"><S className="h-7 w-24 rounded-full" /><S className="h-7 w-24 rounded-full" /></div>
      <div className="mt-4 space-y-2"><S className="h-4 w-3/4" /><S className="h-4 w-2/3" /><S className="h-4 w-1/2" /></div>
      <div className="mt-auto flex items-end justify-between"><div className="space-y-1.5"><S className="h-3 w-12" /><S className="h-6 w-28" /></div><S className="h-11 w-36 rounded-full" /></div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <Wrap className="space-y-10">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card space-y-3 p-6 sm:p-8"><S className="h-4 w-28" /><S className="h-12 w-56" /><S className="h-5 w-full max-w-md" /><S className="h-5 w-2/3 max-w-sm" /><div className="flex gap-2.5 pt-3"><S className="h-13 w-48 rounded-full" /><S className="h-13 w-40 rounded-full" /></div></div>
        <div className="card p-6"><div className="flex items-center gap-5"><S className="h-28 w-28 rounded-full" /><div className="flex-1 space-y-2"><S className="h-5 w-32" /><S className="h-4 w-40" /></div></div><S className="mt-5 h-[72px] rounded-[12px]" /></div>
      </div>
      <div><S className="mb-4 h-7 w-48" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <MatchCardSkeleton key={i} className={i ? "hidden sm:flex" : ""} />)}</div></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="card space-y-6 p-6"><S className="h-7 w-40" />{[0, 1, 2].map((i) => <div key={i} className="flex gap-4"><S className="h-11 w-11 rounded-[14px]" /><div className="flex-1 space-y-2"><S className="h-4 w-1/2" /><S className="h-3 w-1/3" /><S className="h-11 w-full rounded-[14px]" /></div></div>)}</div>
        <div className="space-y-6"><S className="h-[170px] rounded-[14px]" /><S className="h-[250px] rounded-[14px]" /></div>
      </div>
    </Wrap>
  );
}

export function BriefsSkeleton() {
  return (
    <Wrap>
      <S className="h-10 w-40" /><S className="mt-2 h-4 w-64" />
      <div className="mb-6 mt-6 flex gap-2 overflow-hidden">{["w-[118px]", "w-[128px]", "w-[118px]", "w-[92px]", "w-[104px]"].map((w, i) => <S key={i} className={`h-11 shrink-0 rounded-full ${w}`} />)}</div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <MatchCardSkeleton key={i} />)}</div>
    </Wrap>
  );
}

export function BriefDetailSkeleton() {
  return (
    <Wrap>
      <S className="h-5 w-24" />
      <div className="mt-6 flex flex-col gap-5 sm:flex-row"><S className="h-16 w-16 rounded-[14px]" /><div className="flex-1 space-y-3"><S className="h-4 w-28" /><S className="h-10 w-3/4" /><div className="flex gap-2"><S className="h-7 w-24 rounded-full" /><S className="h-7 w-28 rounded-full" /><S className="h-7 w-24 rounded-full" /></div></div></div>
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">{["h-[220px]", "h-[180px]", "h-[260px]"].map((h, i) => <S key={i} className={`rounded-[14px] ${h}`} />)}</div>
        <S className="hidden h-[200px] rounded-[14px] lg:block" />
      </div>
    </Wrap>
  );
}

export function ApplicationsSkeleton() {
  return (
    <Wrap>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div className="space-y-2"><S className="h-10 w-52" /><S className="h-4 w-72" /></div><div className="flex gap-3"><S className="h-[66px] w-28 rounded-[12px]" /><S className="h-[66px] w-32 rounded-[12px]" /></div></div>
      <S className="mb-3 h-4 w-24" />
      <div className="space-y-4">{[0, 1, 2].map((i) => (
        <div key={i} className="card p-6"><div className="flex gap-4"><S className="h-12 w-12 rounded-[14px]" /><div className="flex-1 space-y-2"><S className="h-5 w-1/2" /><S className="h-3.5 w-1/3" /></div></div>
          <div className="mt-5 grid grid-cols-5 gap-1.5">{[0, 1, 2, 3, 4].map((k) => <S key={k} className="h-1.5 rounded-full" />)}</div><S className="mt-6 h-12 rounded-[14px]" /><S className="mt-4 h-5 w-56" /></div>
      ))}</div>
    </Wrap>
  );
}

export function ProfileSkeleton() {
  return (
    <Wrap className="space-y-6">
      <div className="panel overflow-hidden p-0"><S className="h-36 rounded-none sm:h-44" /><div className="px-5 pb-6 sm:px-8"><S className="-mt-12 h-[116px] w-[116px] rounded-full ring-4 ring-surface" /><S className="mt-4 h-10 w-64" /><S className="mt-3 h-4 w-72" /><div className="mt-4 flex gap-1.5"><S className="h-7 w-20 rounded-full" /><S className="h-7 w-24 rounded-full" /><S className="h-7 w-20 rounded-full" /></div><S className="mt-6 h-[78px] rounded-[14px]" /></div></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <S key={i} className="h-[150px] rounded-[14px]" />)}</div><S className="h-[420px] rounded-[14px]" /></div>
        <div className="space-y-6"><S className="h-[300px] rounded-[14px]" /><S className="h-[170px] rounded-[14px]" /></div>
      </div>
    </Wrap>
  );
}
