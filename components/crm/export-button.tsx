"use client";

import { Download } from "lucide-react";

/** Client-side CSV download for small in-page datasets (reports). */
export function ExportButton({ filename, rows, label = "Export CSV" }: { filename: string; rows: (string | number | null)[][]; label?: string }) {
  const go = () => {
    const esc = (v: string | number | null) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const blob = new Blob(["﻿" + rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  return <button onClick={go} className="btn-ghost btn-sm"><Download className="h-3.5 w-3.5" /> {label}</button>;
}
