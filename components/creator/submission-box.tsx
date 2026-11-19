"use client";

import { useRef, useState } from "react";
import { CircleCheck, Link2, Upload } from "lucide-react";
import { clsx } from "clsx";

/** Content submission placeholder: upload a draft or paste a link (storage wiring ships with A8). */
export function SubmissionBox({ due, what }: { due: string | null; what: string | null }) {
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  if (sent) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-[16px] bg-ok-bg p-4 text-[14px] text-ok">
        <CircleCheck className="h-5 w-5 shrink-0" />
        <span><span className="font-semibold">Draft submitted.</span> Vigor reviews within 24h and replies here and on WhatsApp.</span>
      </div>
    );
  }
  const submit = () => {
    if (mode === "link" && !/^https?:\/\/\S+\.\S+/.test(link)) return setErr("Paste a full link, e.g. https://drive.google.com/…");
    if (mode === "upload" && !file) return setErr("Choose a video or image first.");
    setErr(null); setSent(true);
  };
  return (
    <div className="rounded-[18px] border border-dashed border-cobalt/40 bg-cobalt-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[14px] font-semibold">Submit your draft</div>
          <div className="text-[12.5px] text-mute">{what ?? "Your deliverable"}{due ? ` · due ${new Date(due).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : ""}</div>
        </div>
        <div role="tablist" className="inline-flex rounded-full border border-line bg-surface p-1">
          {(["upload", "link"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={mode === m} type="button" onClick={() => { setMode(m); setErr(null); }}
              className={clsx("inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium", mode === m ? "bg-ink text-white" : "text-mute hover:text-ink")}>
              {m === "upload" ? <><Upload className="h-3.5 w-3.5" /> Upload draft</> : <><Link2 className="h-3.5 w-3.5" /> Paste link</>}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {mode === "upload" ? (
          <>
            <input ref={input} type="file" accept="video/*,image/*" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0]?.name ?? null); setErr(null); }} aria-label="Choose draft file" />
            <button type="button" onClick={() => input.current?.click()} className="flex h-12 flex-1 items-center gap-2 truncate rounded-[12px] border border-line bg-surface px-3.5 text-left text-[14px] text-mute hover:border-line-2">
              <Upload className="h-4 w-4 shrink-0" /> <span className="truncate">{file ?? "Choose a video or image (max 500 MB)"}</span>
            </button>
          </>
        ) : (
          <input value={link} onChange={(e) => { setLink(e.target.value); setErr(null); }} inputMode="url" placeholder="Google Drive, Instagram or YouTube link" aria-label="Draft link" className="input h-12 flex-1" />
        )}
        <button type="button" onClick={submit} className="btn-primary h-12">Submit for review</button>
      </div>
      {err && <p role="alert" className="mt-2 text-[12.5px] font-medium text-bad">{err}</p>}
    </div>
  );
}
