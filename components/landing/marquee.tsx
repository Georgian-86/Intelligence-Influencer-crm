/** CSS-only infinite strip. Pauses on hover; the global reduced-motion rule stops it. */
export function Marquee({ items }: { items: string[] }) {
  return (
    <div className="group relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <ul className="sr-only">
        {items.map((t) => <li key={t}>{t}</li>)}
      </ul>
      <div aria-hidden="true" className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {[...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center pr-3">
            <span className="whitespace-nowrap rounded-full border border-line bg-ink-2/60 px-3.5 py-1.5 text-sm text-mute">{t}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
