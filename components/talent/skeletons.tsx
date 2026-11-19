import { Sk } from "@/components/skeletons";

/** Skeletons that mirror the final talent layouts (no CLS when content swaps in). */

function HeaderSk({ sub = true }: { sub?: boolean }) {
  return (
    <div className="mb-6 space-y-2 sm:mb-8">
      <Sk className="h-3 w-24" />
      <Sk className="h-8 w-64 max-w-full sm:h-10" />
      {sub && <Sk className="h-4 w-80 max-w-full" />}
    </div>
  );
}

export function BriefCardSk() {
  return (
    <div className="card flex h-full flex-col p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Sk className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2"><Sk className="h-3 w-28" /><Sk className="h-5 w-4/5" /></div>
      </div>
      <Sk className="mt-3 h-4 w-full" />
      <div className="mt-4 grid grid-cols-2 gap-2"><Sk className="h-4 w-28" /><Sk className="h-4 w-24" /><Sk className="h-4 w-20" /><Sk className="h-4 w-24" /></div>
      <div className="mt-3 flex gap-1.5"><Sk className="h-6 w-20 rounded-full" /><Sk className="h-6 w-24 rounded-full" /></div>
      <div className="mt-auto pt-4"><Sk className="h-11 w-28 rounded-xl" /></div>
    </div>
  );
}

export function TrackerCardSk() {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <Sk className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2"><Sk className="h-3 w-24" /><Sk className="h-5 w-3/5" /></div>
        <Sk className="h-6 w-20 rounded-full" />
      </div>
      <div className="mt-5 grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="flex flex-col items-center gap-1.5"><Sk className="h-7 w-7 rounded-full" /><Sk className="h-2.5 w-10" /></div>)}
      </div>
      <Sk className="mt-4 h-10 w-full rounded-xl" />
    </div>
  );
}

function IgSk() {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-center gap-3"><Sk className="h-[52px] w-[52px] rounded-full" /><div className="space-y-2"><Sk className="h-4 w-32" /><Sk className="h-3 w-44" /></div></div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-[72px] rounded-xl" />)}</div>
      <div className="mt-4 grid grid-cols-3 gap-1.5 sm:gap-2">{Array.from({ length: 6 }).map((_, i) => <Sk key={i} className="aspect-square rounded-lg" />)}</div>
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <div role="status" aria-label="Loading your dashboard">
      <HeaderSk />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-6">
          <Sk className="h-[260px] rounded-2xl sm:h-[188px]" />
          <div className="grid grid-cols-3 gap-2 sm:gap-3">{[0, 1, 2].map((i) => <Sk key={i} className="h-[76px] rounded-2xl sm:h-[92px]" />)}</div>
          <div><Sk className="mb-3 h-6 w-48" /><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><BriefCardSk /><BriefCardSk /></div></div>
          <IgSk />
        </div>
        <div className="min-w-0 space-y-6">
          <Sk className="h-56 rounded-2xl" />
          <div><Sk className="mb-3 h-6 w-36" /><Sk className="h-64 rounded-2xl" /></div>
        </div>
      </div>
    </div>
  );
}

export function BriefsSkeleton() {
  return (
    <div role="status" aria-label="Loading briefs">
      <HeaderSk />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <BriefCardSk key={i} />)}</div>
    </div>
  );
}

export function BriefDetailSkeleton() {
  return (
    <div role="status" aria-label="Loading brief" className="mx-auto max-w-3xl">
      <Sk className="mb-4 h-5 w-24" />
      <div className="card p-5 sm:p-7">
        <div className="flex items-start gap-4"><Sk className="h-14 w-14 rounded-2xl" /><div className="flex-1 space-y-2"><Sk className="h-3 w-32" /><Sk className="h-8 w-4/5" /></div></div>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-16 rounded-xl" />)}</div>
        <div className="mt-6 space-y-2"><Sk className="h-4 w-full" /><Sk className="h-4 w-11/12" /><Sk className="h-4 w-3/4" /></div>
        <Sk className="mt-6 h-24 rounded-xl" />
      </div>
      <Sk className="mt-4 h-28 rounded-2xl" />
    </div>
  );
}

export function ApplicationsSkeleton() {
  return (
    <div role="status" aria-label="Loading applications">
      <HeaderSk />
      <div className="mb-5 flex gap-2">{[0, 1, 2].map((i) => <Sk key={i} className="h-11 w-28 rounded-xl" />)}</div>
      <div className="space-y-4">{[0, 1, 2].map((i) => <TrackerCardSk key={i} />)}</div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile">
      <HeaderSk />
      <Sk className="mb-6 h-28 rounded-2xl" />
      <div className="card space-y-5 p-5 sm:p-6">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="space-y-2"><Sk className="h-3 w-24" /><Sk className="h-11 w-full rounded-xl" /></div>)}
      </div>
    </div>
  );
}
