import { ArrowRight, Info } from "lucide-react";
import { demoSignIn } from "@/app/auth-actions";
import { DEMO_PERSONAS, PERSONA_USERS } from "@/lib/demo/persona";

/** Demo mode only: pick who to sign in as. Each persona opens just its own area. */
export function DemoPersonas({ next }: { next: string }) {
  return (
    <section aria-labelledby="demo-as" className="mt-8 border-t border-line pt-6">
      <h2 id="demo-as" className="flex items-center gap-1.5 text-[13px] font-medium text-ink-2"><Info className="h-3.5 w-3.5 text-mute" /> Demo mode: explore as</h2>
      <p className="mt-0.5 text-[12.5px] text-mute">Sample data, no real accounts. Each role sees only its own area.</p>
      <ul className="mt-3 grid grid-cols-2 gap-2">
        {DEMO_PERSONAS.map((p) => (
          <li key={p}>
            <form action={demoSignIn}>
              <input type="hidden" name="persona" value={p} />
              <input type="hidden" name="next" value={next} />
              <button title={PERSONA_USERS[p].blurb} className="group flex h-10 w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-surface px-3 text-left text-[13.5px] font-medium transition-colors hover:border-cobalt/50 hover:text-cobalt-700">
                {PERSONA_USERS[p].label}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-faint group-hover:text-cobalt" />
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
