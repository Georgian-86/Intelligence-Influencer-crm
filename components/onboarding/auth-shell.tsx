import type { ReactNode } from "react";

/** Centered auth layout with the brand glow used on /join. Server component. */
export function AuthShell({ eyebrow, title, subtitle, children, footer }: {
  eyebrow?: ReactNode; title: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode;
}) {
  return (
    <main id="main" className="relative overflow-x-clip">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[30rem] overflow-hidden">
        <div className="absolute left-1/2 top-[-14rem] h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(255_106_26/0.18),transparent)]" />
      </div>
      <div className="relative mx-auto max-w-md px-4 pb-16 pt-10 sm:pt-16">
        {eyebrow}
        <h1 className="mt-3 text-balance text-3xl font-extrabold tracking-[-0.03em] text-fog sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-pretty text-[15px] text-mute">{subtitle}</p>}
        <div className="card mt-7 space-y-5 p-5 sm:p-7">{children}</div>
        {footer && <div className="mt-5 text-center text-sm text-mute">{footer}</div>}
      </div>
    </main>
  );
}

/** Skeleton that matches AuthShell's geometry (no layout shift). */
export function AuthShellSkeleton({ fields = 2 }: { fields?: number }) {
  return (
    <main className="mx-auto max-w-md px-4 pb-16 pt-10 sm:pt-16" role="status" aria-label="Loading">
      <div aria-hidden="true" className="skeleton h-5 w-24 rounded-full" />
      <div aria-hidden="true" className="skeleton mt-3 h-9 w-64" />
      <div aria-hidden="true" className="skeleton mt-3 h-4 w-72" />
      <div className="card mt-7 space-y-5 p-5 sm:p-7">
        <div aria-hidden="true" className="skeleton h-12 w-full rounded-xl" />
        <div aria-hidden="true" className="skeleton mx-auto h-3 w-28" />
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div aria-hidden="true" className="skeleton h-3 w-16" />
            <div aria-hidden="true" className="skeleton h-11 w-full rounded-xl" />
          </div>
        ))}
        <div aria-hidden="true" className="skeleton h-12 w-full rounded-xl" />
      </div>
    </main>
  );
}
