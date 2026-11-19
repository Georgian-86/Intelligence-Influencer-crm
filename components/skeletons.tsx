import { clsx } from "clsx";

export function Sk({ className }: { className?: string }) {
  return <div aria-hidden className={clsx("skeleton", className)} />;
}

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <div className="space-y-2"><Sk className="h-7 w-56" /><Sk className="h-4 w-80" /></div>
      <div className="grid gap-4 sm:grid-cols-3">{[0, 1, 2].map((i) => <Sk key={i} className="h-24 rounded-2xl" />)}</div>
      <div className="card divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4"><Sk className="h-9 w-9 rounded-full" /><Sk className="h-4 flex-1" /><Sk className="h-4 w-20" /></div>
        ))}
      </div>
    </div>
  );
}
