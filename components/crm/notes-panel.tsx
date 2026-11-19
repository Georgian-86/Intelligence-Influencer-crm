"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Avatar } from "@/components/kit";
import { addNote } from "@/app/crm/actions";
import { ago } from "./format";
import { toast } from "./toast";

type Note = { id: string; body: string; author: string; at: string };

/** Team notes. Live: posts to the addNote action. Demo: kept in local state. */
export function NotesPanel({ talentId, notes, demo, now, canWrite, me }: { talentId: string; notes: Note[]; demo: boolean; now: number; canWrite: boolean; me: string }) {
  const [list, setList] = useState(notes);
  const [body, setBody] = useState("");
  return (
    <div>
      {canWrite && (
        <form
          action={demo ? undefined : addNote}
          onSubmit={(e) => {
            if (!demo) return;
            e.preventDefault();
            if (!body.trim()) return;
            setList((l) => [{ id: `local-${l.length}`, body: body.trim(), author: me, at: new Date(now).toISOString() }, ...l]);
            setBody("");
            toast("Note added");
          }}
          className="mb-4"
        >
          <input type="hidden" name="talent_id" value={talentId} />
          <label htmlFor="note-body" className="sr-only">Add a note</label>
          <textarea id="note-body" name="body" rows={2} value={body} onChange={(e) => setBody(e.target.value)} required
            placeholder="Rates discussed, reliability, what the brand liked…" className="textarea text-[14px]" />
          <div className="mt-2 flex justify-end"><button className="btn-ghost btn-sm" disabled={!body.trim()}>Add note</button></div>
        </form>
      )}
      {list.length === 0 ? <p className="text-[13px] text-mute">No notes yet. Notes stay private to your agency.</p> : (
        <ul className="space-y-3">
          <AnimatePresence initial={false}>
            {list.map((n) => (
              <motion.li key={n.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2.5">
                <Avatar name={n.author} hue={(n.author.length * 47) % 360} size={26} />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] text-mute"><span className="font-semibold text-ink">{n.author}</span> · {ago(n.at, now)} ago</div>
                  <p className="mt-0.5 whitespace-pre-line text-[13.5px] leading-[1.5] text-ink-2">{n.body}</p>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
