"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Client mirror of lib/instagram parseInstagramHandle (that module is server-only). */
export function parseHandle(input: string): string | null {
  const raw = input.trim();
  if (!raw) return null;
  let handle = raw;
  const m = raw.match(/instagram\.com\/([^/?#]+)/i);
  if (m) handle = m[1];
  handle = handle.replace(/^@/, "").toLowerCase();
  if (["p", "reel", "reels", "stories", "explore"].includes(handle)) return null;
  return /^[a-z0-9._]{1,30}$/.test(handle) ? handle : null;
}

export type IgPreview = {
  handle: string;
  fullName: string | null;
  biography: string | null;
  profilePicUrl: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  verified: boolean;
  isPrivate: boolean;
  category: string | null;
  engagementRate: number | null;
  thumbnails: string[];
};

export type PreviewState =
  | { status: "idle" }
  | { status: "loading"; handle: string }
  | { status: "ok" | "private"; handle: string; preview: IgPreview }
  | { status: "notfound" | "unavailable" | "taken"; handle: string }
  | { status: "invalid" };

/** Fetches /api/ig-preview for a handle; dedupes, caches per session and aborts stale lookups. */
export function useIgPreview() {
  const [state, setState] = useState<PreviewState>({ status: "idle" });
  const cache = useRef(new Map<string, PreviewState>());
  const ctrl = useRef<AbortController | null>(null);
  const current = useRef<string | null>(null);

  const lookup = useCallback((input: string) => {
    const handle = parseHandle(input);
    if (!input.trim()) {
      ctrl.current?.abort();
      current.current = null;
      setState({ status: "idle" });
      return;
    }
    if (!handle) {
      setState({ status: "invalid" });
      return;
    }
    if (current.current === handle) return;
    current.current = handle;
    const hit = cache.current.get(handle);
    if (hit) {
      setState(hit);
      return;
    }
    ctrl.current?.abort();
    const c = new AbortController();
    ctrl.current = c;
    setState({ status: "loading", handle });
    fetch(`/api/ig-preview?handle=${encodeURIComponent(handle)}`, { signal: c.signal })
      .then((r) => r.json())
      .then((d: { status: string; preview?: IgPreview }) => {
        const next: PreviewState =
          (d.status === "ok" || d.status === "private") && d.preview
            ? { status: d.status, handle, preview: d.preview }
            : d.status === "taken" || d.status === "notfound"
              ? { status: d.status, handle }
              : { status: "unavailable", handle };
        if (next.status !== "unavailable") cache.current.set(handle, next);
        if (current.current === handle) setState(next);
      })
      .catch((e) => {
        if (e?.name !== "AbortError" && current.current === handle) setState({ status: "unavailable", handle });
      });
  }, []);

  useEffect(() => () => ctrl.current?.abort(), []);
  return { state, lookup };
}
