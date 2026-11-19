/** Matches OnboardingFlow's geometry: progress header, question, input, preview card, action bar. */
export default function Loading() {
  return (
    <>
      <div aria-hidden="true" className="h-16 border-b border-white/[0.07]" />
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col" role="status" aria-label="Loading">
        <div className="mx-auto w-full max-w-xl px-4 pt-6 sm:pt-10" aria-hidden="true">
          <div className="flex justify-between"><div className="skeleton h-3.5 w-20" /><div className="skeleton h-3.5 w-24" /></div>
          <div className="skeleton mt-3 h-1.5 w-full rounded-full" />
          <div className="mt-3 hidden gap-1.5 sm:flex">{[0, 1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-8 w-20 rounded-full" />)}</div>
        </div>
        <div className="mx-auto w-full max-w-xl flex-1 px-4 pb-6 pt-8" aria-hidden="true">
          <div className="skeleton h-9 w-4/5" />
          <div className="skeleton mt-3 h-4 w-full" />
          <div className="mt-6 space-y-5">
            <div className="skeleton h-14 w-full rounded-2xl" />
            <div className="skeleton h-[13.5rem] w-full rounded-2xl" />
          </div>
        </div>
        <div className="mx-auto w-full max-w-xl px-4 pb-10 pt-3" aria-hidden="true">
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    </>
  );
}
