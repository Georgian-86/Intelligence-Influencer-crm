"use client";

import { useEffect, useId, useRef, useState } from "react";
import { BadgeCheck, GraduationCap, Loader2, MapPin } from "lucide-react";
import { clsx } from "clsx";
import type { College } from "@/lib/colleges";

export type CollegeValue = { id: string | null; name: string };

const cache = new Map<string, College[]>();

function Highlight({ text, q }: { text: string; q: string }) {
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded-sm bg-brand/20 px-0.5 text-fog">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

/**
 * Accessible college autocomplete (WAI-ARIA combobox). Suggests colleges in `city`'s metro first,
 * then anywhere. Free text is allowed: an unlisted college is kept as a name.
 * Pass `name` to also emit hidden `${name}_id` / `${name}_name` inputs for plain <form> use.
 */
export function CollegePicker({ id, city, value, onChange, name, placeholder = "Start typing your college…", invalid }: {
  id?: string; city?: string | null; value: CollegeValue; onChange: (v: CollegeValue) => void;
  name?: string; placeholder?: string; invalid?: boolean;
}) {
  const autoId = useId();
  const inputId = id ?? `${autoId}-input`;
  const listId = `${autoId}-list`;
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<College[]>([]);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);
  const ctrl = useRef<AbortController | null>(null);
  const q = value.name.trim();

  useEffect(() => {
    if (!open) return;
    const key = `${q.toLowerCase()}|${city ?? ""}`;
    const hit = cache.get(key);
    if (hit) {
      setResults(hit);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      ctrl.current?.abort();
      const c = new AbortController();
      ctrl.current = c;
      fetch(`/api/colleges?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city ?? "")}`, { signal: c.signal })
        .then((r) => r.json())
        .then((d: { results: College[] }) => {
          cache.set(key, d.results ?? []);
          setResults(d.results ?? []);
          setActive(-1);
        })
        .catch(() => {})
        .finally(() => {
          if (!c.signal.aborted) setLoading(false);
        });
    }, q ? 140 : 0);
    return () => clearTimeout(t);
  }, [q, city, open]);

  const pick = (c: College) => {
    onChange({ id: c.id, name: c.name });
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter" && open && active >= 0 && results[active]) {
      e.preventDefault();
      pick(results[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  const showList = open && (results.length > 0 || (!!q && !loading));
  const matched = !!value.id || results.some((r) => r.name.toLowerCase() === q.toLowerCase());

  return (
    <div className="relative">
      <div className="relative">
        <GraduationCap className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-mute" aria-hidden="true" />
        <input
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-invalid={invalid || undefined}
          autoComplete="off"
          spellCheck={false}
          value={value.name}
          placeholder={placeholder}
          onChange={(e) => {
            onChange({ id: null, name: e.target.value });
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className={clsx("input min-h-12 pl-10 pr-10", invalid && "border-bad")}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true">
          {loading && open ? <Loader2 className="h-4 w-4 animate-spin text-mute" /> : value.id ? <BadgeCheck className="h-4 w-4 text-ok" /> : null}
        </span>
      </div>
      {name && (
        <>
          <input type="hidden" name={`${name}_id`} value={value.id ?? ""} />
          <input type="hidden" name={`${name}_name`} value={value.name} />
        </>
      )}
      <ul
        id={listId}
        role="listbox"
        aria-label="Colleges"
        hidden={!showList}
        className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-72 overflow-auto rounded-xl border border-line-2 bg-ink-2 p-1 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.8)]"
      >
        {results.map((c, i) => (
          <li
            key={`${c.id ?? c.name}-${c.city}`}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick(c)}
            onMouseEnter={() => setActive(i)}
            className={clsx(
              "flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm",
              i === active ? "bg-ink-4 text-fog" : "text-fog/90",
            )}
          >
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium"><Highlight text={c.name} q={q} /></span>
              <span className="flex items-center gap-1 text-xs text-mute">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {c.city}{c.type ? ` · ${c.type}` : ""}
              </span>
            </span>
          </li>
        ))}
        {!!q && !loading && !matched && (
          <li role="presentation" className="px-3 py-2 text-xs text-mute">
            {results.length ? "Not in the list? " : "No match yet. "}
            Keep typing your college&apos;s full name — we&apos;ll add it to the directory.
          </li>
        )}
      </ul>
    </div>
  );
}
