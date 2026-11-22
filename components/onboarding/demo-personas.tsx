import { ArrowRight, Info } from "lucide-react";
import { demoSignIn } from "@/app/auth-actions";
import { DEMO_PERSONAS, PERSONA_USERS } from "@/lib/demo/persona";

/** Demo mode only: pick who to sign in as. Each persona opens just its own area. */
export function DemoPersonas({ next }: { next: string }) {
  return (
    <section aria-labelledby="demo-as" className="mt-8 rounded-[18px] border border-line bg-surface p-4">
      <h2 id="demo-as" className="flex items-center gap-2 text-[13px] font-semibold text-info"><Info className="h-4 w-4" /> Demo mode: sample data, no real accounts</h2>
      <p className="mt-1 text-[12.5px] leading-relaxed text-mute">This copy of the app isn&apos;t connected to Supabase, so pick who to sign in as. Each one only sees their own area.</p>
      <ul className="mt-3 space-y-2">
        {DEMO_PERSONAS.map((p) => (
          <li key={p}>
            <form action={demoSignIn}>
              <input type="hidden" name="persona" value={p} />
              <input type="hidden" name="next" value={next} />
              <button className="group flex w-full items-center gap-3 rounded-[12px] border border-line px-3 py-2.5 text-left hover:border-cobalt hover:bg-cobalt-50">
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold">{PERSONA_USERS[p].label}</span>
                  <span className="block text-[12.5px] text-mute">{PERSONA_USERS[p].blurb}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-mute group-hover:text-cobalt" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
