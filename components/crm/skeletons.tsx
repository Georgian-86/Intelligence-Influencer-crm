import { Sk } from "@/components/skeletons";

/** Route-shaped skeletons for CRM/admin screens (match final layouts to avoid shift). */

function Wrap({ children, label = "Loading" }: { children: React.ReactNode; label?: string }) {
  return <div role="status" aria-label={label} aria-busy="true" className="space-y-6">{children}<span className="sr-only">{label}…</span></div>;
}

export function HeaderSk({ actions = 1, back = false }: { actions?: number; back?: boolean }) {
  return (
    <div className="mb-6">
      {back && <Sk className="mb-3 h-4 w-28" />}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2"><Sk className="h-3 w-20" /><Sk className="h-8 w-64" /><Sk className="h-4 w-80 max-w-full" /></div>
        <div className="flex gap-2">{Array.from({ length: actions }).map((_, i) => <Sk key={i} className="h-10 w-32 rounded-xl" />)}</div>
      </div>
    </div>
  );
}

export function KpiRowSk({ n = 4 }: { n?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="card p-4">
          <div className="flex items-center justify-between"><Sk className="h-3 w-24" /><Sk className="h-8 w-8 rounded-lg" /></div>
          <Sk className="mt-3 h-8 w-16" /><Sk className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

export function RowsSk({ rows = 6, avatar = true, className }: { rows?: number; avatar?: boolean; className?: string }) {
  return (
    <div className={`card divide-y divide-line ${className ?? ""}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          {avatar && <Sk className="h-9 w-9 rounded-full" />}
          <div className="flex-1 space-y-1.5"><Sk className="h-4 w-48 max-w-full" /><Sk className="h-3 w-32" /></div>
          <Sk className="hidden h-4 w-16 sm:block" /><Sk className="h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function TabsSk({ n = 5 }: { n?: number }) {
  return <div className="flex gap-4 border-b border-line pb-3">{Array.from({ length: n }).map((_, i) => <Sk key={i} className="h-5 w-20" />)}</div>;
}

export function CrmHomeSkeleton() {
  return (
    <Wrap>
      <HeaderSk actions={2} />
      <KpiRowSk />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <RowsSk rows={8} avatar={false} />
        <div className="space-y-6"><RowsSk rows={4} avatar={false} /><RowsSk rows={3} avatar={false} /></div>
      </div>
    </Wrap>
  );
}

export function PoolSkeleton() {
  return (
    <Wrap label="Loading talent">
      <HeaderSk />
      <div className="grid gap-6 lg:grid-cols-[272px_minmax(0,1fr)]">
        <div className="card space-y-5 p-4">
          <Sk className="hidden h-5 w-24 lg:block" />
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="space-y-2"><Sk className="h-3 w-20" /><Sk className="h-10 w-full rounded-xl" /></div>)}
        </div>
        <div className="space-y-3">
          <div className="flex justify-end"><Sk className="h-9 w-48 rounded-xl" /></div>
          <RowsSk rows={10} />
        </div>
      </div>
    </Wrap>
  );
}

export function TalentDetailSkeleton() {
  return (
    <Wrap label="Loading profile">
      <Sk className="h-4 w-28" />
      <div className="card p-5 sm:p-6">
        <div className="flex items-start gap-5"><Sk className="h-20 w-20 rounded-full" /><div className="flex-1 space-y-2"><Sk className="h-8 w-56" /><Sk className="h-4 w-72 max-w-full" /><Sk className="h-6 w-40 rounded-full" /></div></div>
        <div className="mt-5 grid grid-cols-2 gap-px sm:grid-cols-4">{[0, 1, 2, 3].map((i) => <Sk key={i} className="h-16 rounded-none" />)}</div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6"><Sk className="h-48 rounded-2xl" /><Sk className="h-40 rounded-2xl" /><Sk className="h-56 rounded-2xl" /></div>
        <div className="space-y-6"><Sk className="h-36 rounded-2xl" /><Sk className="h-40 rounded-2xl" /><Sk className="h-52 rounded-2xl" /></div>
      </div>
    </Wrap>
  );
}

export function CampaignListSkeleton() {
  return (
    <Wrap label="Loading campaigns">
      <HeaderSk actions={0} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <TabsSk />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card flex items-center gap-4 p-4"><Sk className="h-11 w-11 rounded-xl" /><div className="flex-1 space-y-1.5"><Sk className="h-4 w-56 max-w-full" /><Sk className="h-3 w-32" /></div><Sk className="h-8 w-32" /></div>
          ))}
        </div>
        <div className="card space-y-4 p-5">{Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-10 w-full rounded-xl" />)}<Sk className="h-10 w-full rounded-xl" /></div>
      </div>
    </Wrap>
  );
}

export function CampaignSkeleton() {
  return (
    <Wrap label="Loading campaign">
      <HeaderSk actions={2} back />
      <KpiRowSk />
      <RowsSk rows={5} avatar={false} />
    </Wrap>
  );
}

export function FormSkeleton() {
  return (
    <Wrap label="Loading form">
      <div className="mx-auto max-w-4xl space-y-5">
        <HeaderSk actions={0} back />
        {[3, 2, 4, 1].map((n, i) => (
          <div key={i} className="card space-y-4 p-6">
            <div className="flex items-center gap-3"><Sk className="h-7 w-7 rounded-full" /><Sk className="h-5 w-48" /></div>
            {Array.from({ length: n }).map((_, j) => <Sk key={j} className="h-10 w-full rounded-xl" />)}
          </div>
        ))}
      </div>
    </Wrap>
  );
}

export function BriefSkeleton() {
  return (
    <Wrap label="Loading pipeline">
      <HeaderSk back />
      <div className="flex flex-wrap gap-2">{Array.from({ length: 5 }).map((_, i) => <Sk key={i} className="h-7 w-28 rounded-lg" />)}</div>
      <div className="flex items-center justify-between"><Sk className="h-7 w-96 max-w-[60%] rounded-full" /><Sk className="h-11 w-40 rounded-xl" /></div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-[272px] shrink-0 space-y-2 rounded-2xl border border-line bg-ink-2/60 p-2">
            <Sk className="m-1 h-5 w-28" />
            {Array.from({ length: 3 - (i % 3) }).map((_, j) => <Sk key={j} className="h-36 rounded-xl" />)}
          </div>
        ))}
      </div>
      <RowsSk rows={4} />
    </Wrap>
  );
}

export function InboxSkeleton() {
  return (
    <Wrap label="Loading enquiries">
      <HeaderSk actions={0} />
      <TabsSk n={5} />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card space-y-3 p-5">
          <div className="flex items-start gap-3"><Sk className="h-10 w-10 rounded-xl" /><div className="flex-1 space-y-1.5"><Sk className="h-5 w-48" /><Sk className="h-3 w-64 max-w-full" /></div><Sk className="h-9 w-36 rounded-xl" /></div>
          <Sk className="h-16 w-full rounded-xl" />
        </div>
      ))}
    </Wrap>
  );
}

export function TriageSkeleton() {
  return (
    <Wrap label="Loading screening queue">
      <HeaderSk actions={0} />
      <KpiRowSk />
      <TabsSk />
      <RowsSk rows={8} />
    </Wrap>
  );
}

export function AdminTalentSkeleton() {
  return (
    <Wrap label="Loading talent">
      <Sk className="h-4 w-32" />
      <div className="card flex items-center gap-4 p-6"><Sk className="h-14 w-14 rounded-full" /><div className="flex-1 space-y-2"><Sk className="h-7 w-56" /><Sk className="h-4 w-64 max-w-full" /></div></div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6"><Sk className="h-48 rounded-2xl" /><Sk className="h-72 rounded-2xl" /></div>
        <Sk className="h-[460px] rounded-2xl" />
      </div>
    </Wrap>
  );
}

export function TeamSkeleton() {
  return (
    <Wrap label="Loading team">
      <HeaderSk actions={0} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6"><RowsSk rows={3} /><RowsSk rows={4} /></div>
        <Sk className="h-80 rounded-2xl" />
      </div>
    </Wrap>
  );
}
