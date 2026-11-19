"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition, type DragEvent } from "react";
import { clsx } from "clsx";
import { ChevronRight, GripVertical, KanbanSquare, Loader2, Rows3 } from "lucide-react";
import { Badge, fmtINR, fmtNum } from "@/components/ui";
import { Avatar } from "@/components/crm/primitives";
import { FLOW_STAGES, OUT_STAGES, STAGE_DOT, STAGE_LABEL, nextStage } from "@/components/crm/stages";
import { fmtEr, timeAgo } from "@/components/crm/format";
import { STAGES, type Stage } from "@/lib/constants";
import { updateIntent } from "@/app/crm/actions";

export type PipelineIntent = {
  id: string;
  stage: string;
  source: string;
  message: string | null;
  quoted_rate: number | null;
  agreed_rate: number | null;
  created_at: string;
  updated_at?: string | null;
  talent: {
    id: string; display_name: string; city: string | null; rank: string;
    handle: string | null; followers: number | null; engagement_rate: number | null; pic: string | null;
  } | null;
};

const DRAG_TYPE = "application/x-vtn-intent";

export function PipelineBoard({ intents, manage, baseHref, view }: {
  intents: PipelineIntent[]; manage: boolean; baseHref: string; view: "board" | "table";
}) {
  const back = view === "table" ? `${baseHref}?view=table` : baseHref;
  const [pending, startTransition] = useTransition();
  const [items, setOptimistic] = useOptimistic(intents, (state, patch: { id: string; stage: string }) =>
    state.map((i) => (i.id === patch.id ? { ...i, stage: patch.stage } : i)),
  );
  const [over, setOver] = useState<string | null>(null);
  const [announce, setAnnounce] = useState("");

  function move(id: string, stage: string) {
    const cur = items.find((i) => i.id === id);
    if (!cur || cur.stage === stage || !(STAGES as readonly string[]).includes(stage)) return;
    setAnnounce(`Moving ${cur.talent?.display_name ?? "talent"} to ${STAGE_LABEL[stage as Stage]}`);
    startTransition(async () => {
      setOptimistic({ id, stage });
      const fd = new FormData();
      fd.set("id", id);
      fd.set("stage", stage);
      fd.set("back", back);
      await updateIntent(fd);
    });
  }

  const onDrop = (stage: string) => (e: DragEvent) => {
    e.preventDefault();
    setOver(null);
    const id = e.dataTransfer.getData(DRAG_TYPE) || e.dataTransfer.getData("text/plain");
    if (id) move(id, stage);
  };

  const counts = Object.fromEntries(STAGES.map((s) => [s, items.filter((i) => i.stage === s).length])) as Record<Stage, number>;

  return (
    <section aria-label="Pipeline" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Funnel summary */}
        <ol className="flex flex-wrap items-center gap-1 text-xs">
          {FLOW_STAGES.map((s, i) => (
            <li key={s} className="flex items-center gap-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-2 px-2.5 py-1">
                <span aria-hidden className={clsx("h-1.5 w-1.5 rounded-full", STAGE_DOT[s])} />
                <span className="text-mute">{STAGE_LABEL[s]}</span>
                <span className="font-semibold tabular-nums">{counts[s]}</span>
              </span>
              {i < FLOW_STAGES.length - 1 && <ChevronRight aria-hidden className="h-3 w-3 text-line-2" />}
            </li>
          ))}
        </ol>
        <div className="flex items-center gap-3">
          <span aria-live="polite" className="inline-flex min-w-0 items-center gap-1.5 text-xs text-mute">
            {pending && <><Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin" /> <span className="truncate">{announce}</span></>}
          </span>
          <div role="group" aria-label="Pipeline view" className="inline-flex rounded-xl border border-line bg-ink p-1">
            <Link href={baseHref} aria-current={view === "board" ? "page" : undefined} scroll={false}
              className={clsx("inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium", view === "board" ? "bg-ink-3 text-fog" : "text-mute hover:text-fog")}>
              <KanbanSquare aria-hidden className="h-4 w-4" /> Board
            </Link>
            <Link href={`${baseHref}?view=table`} aria-current={view === "table" ? "page" : undefined} scroll={false}
              className={clsx("inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium", view === "table" ? "bg-ink-3 text-fog" : "text-mute hover:text-fog")}>
              <Rows3 aria-hidden className="h-4 w-4" /> Table
            </Link>
          </div>
        </div>
      </div>

      {view === "board" ? (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <div className="flex snap-x snap-mandatory gap-3 sm:snap-none">
            {[...FLOW_STAGES, "out" as const].map((col) => {
              const stages: readonly string[] = col === "out" ? OUT_STAGES : [col];
              const colItems = items.filter((i) => stages.includes(i.stage));
              const dropStage = col === "out" ? "dropped" : col;
              return (
                <div
                  key={col}
                  role="group"
                  aria-label={`${col === "out" ? "Rejected / dropped" : STAGE_LABEL[col]}, ${colItems.length}`}
                  onDragOver={manage ? (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setOver(col); } : undefined}
                  onDragLeave={manage ? (e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(null); } : undefined}
                  onDrop={manage ? onDrop(dropStage) : undefined}
                  className={clsx(
                    "flex w-[78vw] max-w-[288px] shrink-0 snap-start flex-col rounded-2xl border bg-ink-2/60 transition-colors sm:w-[272px]",
                    over === col ? "border-brand/60 bg-brand/5" : "border-line",
                    col === "out" && "opacity-80",
                  )}
                >
                  <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3 text-sm font-semibold">
                    <span className="flex items-center gap-2">
                      <span aria-hidden className={clsx("h-2 w-2 rounded-full", col === "out" ? "bg-bad" : STAGE_DOT[col])} />
                      {col === "out" ? "Rejected / dropped" : STAGE_LABEL[col]}
                    </span>
                    <span className="rounded-full bg-ink-3 px-2 py-0.5 text-[11px] tabular-nums text-mute">{colItems.length}</span>
                  </div>
                  <div className="flex min-h-24 flex-1 flex-col gap-2 px-2 pb-2">
                    {colItems.length === 0 && (
                      <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-line px-3 py-6 text-center text-xs text-mute">
                        {manage ? "Drop here" : "Empty"}
                      </div>
                    )}
                    {colItems.map((i) => <Card key={i.id} i={i} manage={manage} back={back} move={move} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <Table items={items} manage={manage} back={back} move={move} />
      )}
      {manage && view === "board" && (
        <p className="text-xs text-mute">Drag cards between columns, or use the stage menu on each card (keyboard friendly).</p>
      )}
    </section>
  );
}

function StageSelect({ i, move, className }: { i: PipelineIntent; move: (id: string, stage: string) => void; className?: string }) {
  return (
    <>
      <label htmlFor={`stage-${i.id}`} className="sr-only">Stage for {i.talent?.display_name}</label>
      <select id={`stage-${i.id}`} value={i.stage} onChange={(e) => move(i.id, e.target.value)} className={clsx("input py-1.5 text-xs", className)}>
        {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
      </select>
    </>
  );
}

function RateForm({ i, back, compact }: { i: PipelineIntent; back: string; compact?: boolean }) {
  return (
    <form action={updateIntent} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={i.id} />
      <input type="hidden" name="back" value={back} />
      <label htmlFor={`rate-${i.id}`} className="sr-only">Agreed rate for {i.talent?.display_name} (₹)</label>
      <input id={`rate-${i.id}`} name="agreed_rate" defaultValue={i.agreed_rate ?? ""} placeholder="Agreed ₹" inputMode="numeric"
        className={clsx("input min-w-0 flex-1 py-1.5 text-xs", compact && "w-24 flex-none")} />
      <button className="btn-ghost min-h-8 px-2.5 py-1 text-xs">Save</button>
    </form>
  );
}

function Card({ i, manage, back, move }: { i: PipelineIntent; manage: boolean; back: string; move: (id: string, stage: string) => void }) {
  const t = i.talent;
  const next = nextStage(i.stage);
  const [dragging, setDragging] = useState(false);
  return (
    <article
      draggable={manage}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, i.id);
        e.dataTransfer.setData("text/plain", i.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={clsx(
        "group rounded-xl border border-line bg-ink p-3 text-sm shadow-[inset_0_1px_0_0_rgb(255_255_255/0.03)] transition-[opacity,border-color]",
        manage && "cursor-grab active:cursor-grabbing hover:border-line-2",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Avatar src={t?.pic} name={t?.display_name} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <Link href={`/crm/talent/${t?.id}`} className="truncate font-medium hover:text-brand" draggable={false}>{t?.display_name}</Link>
            {manage && <GripVertical aria-hidden className="h-4 w-4 shrink-0 text-line-2 group-hover:text-mute" />}
          </div>
          <div className="truncate text-xs text-mute">{t?.handle ? `@${t.handle}` : t?.city ?? "—"}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-mute">
        <span><span className="text-fog">{fmtNum(t?.followers)}</span> fol.</span>
        <span><span className="text-fog">{fmtEr(t?.engagement_rate)}</span> ER</span>
        {t?.city && t.handle && <span>{t.city}</span>}
        {i.source === "invited" && <span className="chip px-1.5 py-0 text-[10px]">Invited</span>}
        {(i.stage === "rejected" || i.stage === "dropped") && <Badge value={i.stage} />}
      </div>
      {i.message && <p className="mt-2 line-clamp-3 text-xs text-mute">“{i.message}”</p>}
      <div className="mt-2 text-xs">
        <span className="text-mute">Quote</span> {fmtINR(i.quoted_rate)}
        {i.agreed_rate ? <> · <span className="text-mute">Agreed</span> <span className="text-ok">{fmtINR(i.agreed_rate)}</span></> : null}
      </div>
      {manage && (
        <div className="mt-3 space-y-1.5 border-t border-line pt-3">
          <div className="flex items-center gap-1.5">
            <StageSelect i={i} move={move} className="flex-1" />
            {next && (
              <button type="button" onClick={() => move(i.id, next)} className="btn-ghost min-h-8 shrink-0 px-2 py-1 text-xs"
                aria-label={`Move ${t?.display_name} to ${STAGE_LABEL[next]}`} title={`Move to ${STAGE_LABEL[next]}`}>
                <ChevronRight aria-hidden className="h-4 w-4" />
              </button>
            )}
          </div>
          <RateForm i={i} back={back} />
        </div>
      )}
    </article>
  );
}

function Table({ items, manage, back, move }: { items: PipelineIntent[]; manage: boolean; back: string; move: (id: string, stage: string) => void }) {
  const order = (s: string) => (STAGES as readonly string[]).indexOf(s);
  const rows = [...items].sort((a, b) => order(a.stage) - order(b.stage) || a.created_at.localeCompare(b.created_at));
  if (!rows.length) return <div className="card p-8 text-center text-sm text-mute">No talent in the pipeline yet.</div>;
  return (
    <div className="card overflow-x-auto">
      <table className="table w-full min-w-[920px]">
        <thead>
          <tr><th>Talent</th><th>City</th><th className="text-right!">Followers</th><th className="text-right!">Eng.</th><th>Source</th><th className="text-right!">Quote</th><th>{manage ? "Agreed rate" : "Agreed"}</th><th>Stage</th><th>Updated</th></tr>
        </thead>
        <tbody>
          {rows.map((i) => {
            const t = i.talent;
            return (
              <tr key={i.id}>
                <td>
                  <Link href={`/crm/talent/${t?.id}`} className="group flex items-center gap-2.5">
                    <Avatar src={t?.pic} name={t?.display_name} size="xs" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium group-hover:text-brand">{t?.display_name}</span>
                      {t?.handle && <span className="block truncate text-xs text-mute">@{t.handle}</span>}
                    </span>
                  </Link>
                </td>
                <td className="text-mute">{t?.city ?? "—"}</td>
                <td className="text-right tabular-nums">{fmtNum(t?.followers)}</td>
                <td className="text-right tabular-nums">{fmtEr(t?.engagement_rate)}</td>
                <td className="capitalize text-mute">{i.source}</td>
                <td className="text-right tabular-nums">{fmtINR(i.quoted_rate)}</td>
                <td>{manage ? <RateForm i={i} back={back} compact /> : fmtINR(i.agreed_rate)}</td>
                <td>
                  {manage ? (
                    <div className="flex items-center gap-2">
                      <span aria-hidden className={clsx("h-2 w-2 shrink-0 rounded-full", STAGE_DOT[i.stage as Stage])} />
                      <StageSelect i={i} move={move} className="w-36" />
                    </div>
                  ) : <Badge value={i.stage} />}
                </td>
                <td suppressHydrationWarning className="whitespace-nowrap text-xs text-mute">{timeAgo(i.updated_at ?? i.created_at)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
