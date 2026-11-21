"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, ExternalLink, Link2, MessageSquareText, Upload } from "lucide-react";
import { clsx } from "clsx";
import { submitDraft, submitLiveLink } from "@/app/dashboard/actions";
import type { WorkItemVM } from "@/app/dashboard/_lib/types";

const MAX_MB = 500;
const fmtDue = (d: string | null) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null);

/**
 * Content submission for one deliverable: upload a draft (straight to private storage) or paste a
 * link; after approval, paste the live post link. Without `item` (demo mode) it runs locally.
 */
export function SubmissionBox({ due, what, item }: { due: string | null; what: string | null; item?: WorkItemVM }) {
  const router = useRouter();
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [caption, setCaption] = useState("");
  const [progress, setProgress] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const status = item?.status ?? "brief_sent";
  const label = item ? `${item.kind}${item.title ? ` · ${item.title}` : ""}` : what ?? "Your deliverable";
  const dueText = fmtDue(item ? item.due : due);

  if (done) {
    return (
      <div role="status" className="flex items-center gap-3 rounded-[16px] bg-ok-bg p-4 text-[14px] text-ok">
        <CircleCheck className="h-5 w-5 shrink-0" />
        <span>{done}</span>
      </div>
    );
  }

  if (status === "live") {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[16px] border border-line bg-surface p-4 text-[14px]">
        <CircleCheck className="h-5 w-5 shrink-0 text-ok" />
        <span className="min-w-0 flex-1"><span className="font-semibold">{label}</span> is live.</span>
        {item?.liveUrl && <a href={item.liveUrl} target="_blank" rel="noreferrer" className="btn-ghost btn-sm"><ExternalLink className="h-3.5 w-3.5" /> View post</a>}
      </div>
    );
  }

  if (status === "draft_submitted") {
    return (
      <div className="flex items-center gap-3 rounded-[16px] bg-cobalt-50 p-4 text-[14px] text-cobalt-800">
        <CircleCheck className="h-5 w-5 shrink-0" />
        <span><span className="font-semibold">{label}: v{item?.version ?? 1} is in review.</span> Vigor replies within 24h, here and on WhatsApp.</span>
      </div>
    );
  }

  if (status === "approved") {
    const post = () => {
      if (!/^https?:\/\/(www\.)?(instagram\.com|youtube\.com|youtu\.be)\//i.test(link.trim())) return setErr("Paste the Instagram or YouTube link of your live post.");
      setErr(null);
      start(async () => {
        const r = await submitLiveLink(item!.id, link);
        if (!r.ok) return setErr(r.error);
        setDone(r.message ?? "Live link saved.");
        router.refresh();
      });
    };
    return (
      <div className="rounded-[18px] border border-ok/30 bg-ok-bg/60 p-4">
        <div className="text-[14px] font-semibold text-ok">{label} is approved. Post it now.</div>
        <div className="text-[12.5px] text-ink-2">Use the approved version and caption, then paste the link here so we can track views.</div>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input value={link} onChange={(e) => { setLink(e.target.value); setErr(null); }} inputMode="url" placeholder="https://instagram.com/reel/…" aria-label="Live post link" className="input h-12 flex-1" />
          <button type="button" onClick={post} disabled={pending} className="btn-primary h-12">{pending ? "Saving…" : "Submit live link"}</button>
        </div>
        {err && <p role="alert" className="mt-2 text-[12.5px] font-medium text-bad">{err}</p>}
      </div>
    );
  }

  const submit = () => {
    if (mode === "link" && !/^https?:\/\/\S+\.\S+/.test(link)) return setErr("Paste a full link, e.g. https://drive.google.com/…");
    if (mode === "upload" && !file) return setErr("Choose a video or image first.");
    if (file && file.size > MAX_MB * 1024 * 1024) return setErr(`That file is over ${MAX_MB} MB. Paste a Drive link instead.`);
    setErr(null);
    if (!item) { setDone("Draft submitted. Vigor reviews within 24h and replies here and on WhatsApp."); return; }
    start(async () => {
      let storagePath: string | undefined;
      if (mode === "upload" && file) {
        setProgress("Uploading…");
        const { createBrowserSupabase } = await import("@/lib/supabase/browser");
        const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
        storagePath = `${item.id}/${Date.now()}-${safe}`;
        const { error } = await createBrowserSupabase().storage.from("deliverables").upload(storagePath, file, { contentType: file.type, upsert: false });
        setProgress(null);
        if (error) return setErr(/exceeded|too large/i.test(error.message) ? "That file is too large. Paste a Drive link instead." : "Upload failed. Check your connection, or paste a link instead.");
      }
      const r = await submitDraft(item.id, { caption, link: mode === "link" ? link : undefined, storagePath });
      if (!r.ok) return setErr(r.error);
      setDone(r.message ?? "Draft submitted.");
      router.refresh();
    });
  };

  return (
    <div className="rounded-[18px] border border-dashed border-cobalt/40 bg-cobalt-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-[14px] font-semibold">{status === "changes_requested" ? `Upload v${(item?.version ?? 1) + 1}` : "Submit your draft"}</div>
          <div className="text-[12.5px] text-mute">{label}{dueText ? ` · due ${dueText}` : ""}</div>
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
      {status === "changes_requested" && item?.feedback && (
        <div className="mt-3 flex gap-2 rounded-[12px] bg-warn-bg px-3 py-2.5 text-[13px] text-ink-2">
          <MessageSquareText className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
          <span><span className="font-semibold text-ink">{item.feedback.who} asked for changes:</span> {item.feedback.body}</span>
        </div>
      )}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {mode === "upload" ? (
          <>
            <input ref={input} type="file" accept="video/*,image/*" className="sr-only" onChange={(e) => { setFile(e.target.files?.[0] ?? null); setErr(null); }} aria-label="Choose draft file" />
            <button type="button" onClick={() => input.current?.click()} className="flex h-12 flex-1 items-center gap-2 truncate rounded-[12px] border border-line bg-surface px-3.5 text-left text-[14px] text-mute hover:border-line-2">
              <Upload className="h-4 w-4 shrink-0" /> <span className="truncate">{file?.name ?? `Choose a video or image (max ${MAX_MB} MB)`}</span>
            </button>
          </>
        ) : (
          <input value={link} onChange={(e) => { setLink(e.target.value); setErr(null); }} inputMode="url" placeholder="Google Drive, Instagram or YouTube link" aria-label="Draft link" className="input h-12 flex-1" />
        )}
        <button type="button" onClick={submit} disabled={pending} className="btn-primary h-12">{progress ?? (pending ? "Sending…" : "Submit for review")}</button>
      </div>
      <label className="mt-2 block">
        <span className="sr-only">Caption</span>
        <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2} placeholder="Caption you'll post (tags, hashtags, #ad)" className="textarea resize-none text-[13.5px]" />
      </label>
      {err && <p role="alert" className="mt-2 text-[12.5px] font-medium text-bad">{err}</p>}
    </div>
  );
}
