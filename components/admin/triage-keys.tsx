"use client";

import { useEffect } from "react";

/**
 * Keyboard triage for the screening queue:
 * j / k = next / previous row, Enter = open, a = approve, s = move to screening, x = reject.
 * Rows are elements with [data-triage-row]; their primary link has [data-triage-link];
 * action buttons carry data-triage-key="a|s|x".
 */
export function TriageKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-triage-row]"));
      if (!rows.length) return;
      const current = rows.findIndex((r) => r.contains(document.activeElement));
      const focusRow = (i: number) => {
        const row = rows[Math.max(0, Math.min(rows.length - 1, i))];
        row.querySelector<HTMLElement>("[data-triage-link]")?.focus();
        row.scrollIntoView({ block: "nearest" });
      };
      if (e.key === "j") { e.preventDefault(); focusRow(current + 1); }
      else if (e.key === "k") { e.preventDefault(); focusRow(current < 0 ? 0 : current - 1); }
      else if (current >= 0 && ["a", "s", "x"].includes(e.key)) {
        const btn = rows[current].querySelector<HTMLButtonElement>(`button[data-triage-key="${e.key}"]`);
        if (btn) { e.preventDefault(); btn.click(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  return null;
}
