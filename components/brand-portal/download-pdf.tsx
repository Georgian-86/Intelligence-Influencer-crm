"use client";

import { useState } from "react";
import { Check, Download, LoaderCircle } from "lucide-react";

/** Stub: PDF export is generated server-side in v2.2. For now it confirms the request. */
export function DownloadPdf({ email }: { email?: string }) {
  const [state, setState] = useState<"idle" | "working" | "done">("idle");
  return (
    <div className="flex items-center gap-3">
      <span aria-live="polite" className="hidden text-[12.5px] text-mute sm:inline">
        {state === "done" && `PDF on its way to ${email ?? "your inbox"}`}
      </span>
      <button
        onClick={() => { setState("working"); setTimeout(() => setState("done"), 1200); }}
        disabled={state === "working"}
        className="btn-dark"
      >
        {state === "working" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : state === "done" ? <Check className="h-4 w-4" /> : <Download className="h-4 w-4" />}
        {state === "working" ? "Preparing PDF" : state === "done" ? "Sent" : "Download PDF"}
      </button>
    </div>
  );
}
