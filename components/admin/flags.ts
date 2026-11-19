/** Auto-screening signals. Pure functions so demo and live data share one rulebook. */
export type Flag = { key: "fake" | "private" | "college" | "fetch" | "ratio"; label: string; detail: string; severity: "high" | "medium" };

/** Typical engagement rate for an Instagram account of this size (India, 2026). */
export function expectedEr(followers: number) {
  if (followers < 10_000) return 4.5;
  if (followers < 50_000) return 3.2;
  if (followers < 250_000) return 2.2;
  return 1.4;
}

export function computeFlags(i: {
  followers: number | null; following?: number | null; er: number | null; isPrivate?: boolean | null;
  inCollege?: boolean; collegeEmail?: string | null; collegeDomains?: string[]; idUploaded?: boolean; fetchStatus?: string | null;
}): Flag[] {
  const f: Flag[] = [];
  if (i.fetchStatus === "error") f.push({ key: "fetch", label: "Instagram fetch failed", detail: "Stats couldn't be refreshed. Refetch or ask the creator to make the account public.", severity: "medium" });
  if (i.isPrivate) f.push({ key: "private", label: "Private account", detail: "Brands can't view content. Ask the creator to switch to public or professional.", severity: "high" });
  if (i.followers != null && i.er != null && i.followers >= 5_000) {
    const exp = expectedEr(i.followers);
    if (i.er < exp * 0.5) f.push({ key: "fake", label: "Fake-follower risk", detail: `ER ${i.er}% vs ~${exp}% expected for this size. Check comment quality and follower growth spikes.`, severity: "high" });
  }
  if (i.followers != null && i.following != null && i.followers < 20_000 && i.following > i.followers * 0.8) {
    f.push({ key: "ratio", label: "Follow-back pattern", detail: `Follows ${i.following.toLocaleString("en-IN")} accounts with ${i.followers.toLocaleString("en-IN")} followers.`, severity: "medium" });
  }
  if (i.inCollege) {
    const domain = i.collegeEmail?.split("@")[1]?.toLowerCase();
    const match = !!domain && (i.collegeDomains ?? []).some((d) => domain === d || domain.endsWith("." + d));
    if (!match && !i.idUploaded) f.push({ key: "college", label: "No college proof", detail: "Email domain doesn't match the college and no ID was uploaded.", severity: "medium" });
  }
  return f;
}

export function emailMatchesCollege(email: string | null | undefined, domains: string[] = []) {
  const domain = email?.split("@")[1]?.toLowerCase();
  return !!domain && domains.some((d) => domain === d || domain.endsWith("." + d));
}
