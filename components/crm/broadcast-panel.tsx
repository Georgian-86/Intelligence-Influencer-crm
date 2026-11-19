"use client";

import { clsx } from "clsx";
import { CheckCheck, Loader2, Send } from "lucide-react";
import { useState, useTransition } from "react";
import { WhatsAppIcon } from "@/components/brand/icons";
import { sendBroadcast } from "@/app/crm/actions";
import { toast } from "./toast";

type Aud = { key: string; label: string; ids: string[] };

export function BroadcastPanel({ briefId, brand, title, deliverables, budget, applyBy, audiences, costPer }: {
  briefId: string; brand: string; title: string; deliverables: string; budget: string; applyBy: string; audiences: Aud[]; costPer: number;
}) {
  const [aud, setAud] = useState((audiences.find((x) => x.ids.length) ?? audiences[0])?.key ?? "");
  const [sent, setSent] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const a = audiences.find((x) => x.key === aud) ?? audiences[0];
  const n = a?.ids.length ?? 0;
  const cost = n * costPer;

  const send = () => start(async () => {
    const res = await sendBroadcast(briefId, a.ids);
    if (res.ok) { setSent(res.queued); toast(`Brief sent to ${res.queued} creators on WhatsApp`); }
    else toast(res.error ?? "Couldn't send", { tone: "error" });
  });

  return (
    <section className="card overflow-hidden" aria-labelledby="wa-h">
      <header className="flex items-center gap-2 border-b border-line px-5 py-3.5">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-[#e4f6ea] text-[#128C4B]"><WhatsAppIcon className="h-4 w-4" /></span>
        <h2 id="wa-h" className="font-display text-[16px] font-semibold">WhatsApp broadcast</h2>
        <span className="ml-auto whitespace-nowrap rounded-full bg-canvas-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2" title="Template brief_match">Marketing template</span>
      </header>
      <div className="bg-[#efeae2] px-4 py-5" aria-label="Template preview">
        <div className="relative ml-auto max-w-[300px] rounded-[14px] rounded-tr-[4px] bg-white p-3 text-[13px] leading-[1.5] text-ink shadow-xs">
          <p><strong>New brief that matches you ✨</strong></p>
          <p className="mt-1">Hi {"{{1}}"}, <strong>{brand}</strong> is looking for creators for “{title}”.</p>
          <p className="mt-1">📦 {deliverables || "Deliverables on the brief"}<br />💰 {budget}<br />🗓 Apply by {applyBy}</p>
          <div className="mt-1.5 text-right text-[10.5px] text-mute">10:02 <CheckCheck className="inline h-3 w-3 text-[#34B7F1]" /></div>
          <div className="-mx-3 -mb-3 mt-2 grid grid-cols-2 divide-x divide-line border-t border-line text-center text-[13px] font-semibold text-[#0a84c1]">
            <span className="py-2">I&apos;m in</span><span className="py-2">Not this time</span>
          </div>
        </div>
      </div>
      <div className="space-y-4 p-5">
        <fieldset>
          <legend className="label">Audience</legend>
          <div className="space-y-1.5">
            {audiences.map((x) => (
              <label key={x.key} className={clsx("flex cursor-pointer items-center gap-3 rounded-[12px] border px-3 py-2.5 text-[13.5px] transition-colors", aud === x.key ? "border-cobalt bg-cobalt-50/60" : "border-line hover:border-line-2")}>
                <input type="radio" name="aud" value={x.key} checked={aud === x.key} onChange={() => setAud(x.key)} className="accent-[var(--color-cobalt)]" />
                <span className="flex-1 font-medium">{x.label}</span>
                <span className="font-semibold tabular-nums">{x.ids.length}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-[12px] bg-canvas px-3 py-2.5"><dt className="text-[11.5px] text-mute">Audience size</dt><dd className="font-display text-[20px] font-semibold tabular-nums">{n}</dd></div>
          <div className="rounded-[12px] bg-canvas px-3 py-2.5"><dt className="text-[11.5px] text-mute">Est. cost</dt><dd className="font-display text-[20px] font-semibold tabular-nums">₹{cost.toFixed(2)}</dd></div>
        </dl>
        <p className="text-[12px] text-mute">₹{costPer.toFixed(2)} per marketing conversation (Meta India). Only creators who opted in to WhatsApp are messaged.</p>
        {sent != null ? (
          <div className="flex items-center gap-2 rounded-[12px] bg-ok-bg px-3 py-2.5 text-[13.5px] font-semibold text-ok"><CheckCheck className="h-4 w-4" /> Sent to {sent} creators · replies land in the pipeline</div>
        ) : (
          <button onClick={send} disabled={!n || pending} className="btn w-full bg-[#128C4B] text-white hover:bg-[#0f7a41]">
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send to {n} creators
          </button>
        )}
      </div>
    </section>
  );
}
