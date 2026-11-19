"use client";

import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { clsx } from "clsx";
import { COURSE_SUGGESTIONS, graduationYears } from "@/lib/colleges";
import { CollegePicker, type CollegeValue } from "@/components/onboarding/college-picker";

export type EducationDefaults = {
  college_id?: string | null; college_name?: string | null; course?: string | null;
  graduation_year?: number | null; college_email?: string | null; verified_at?: string | null;
};

/** Education block for the full profile form (plain <form>, named inputs read by saveTalentProfile). */
export function EducationFields({ initial, city }: { initial: EducationDefaults | null; city?: string | null }) {
  const [inCollege, setInCollege] = useState<"yes" | "no">(initial ? "yes" : "no");
  const [college, setCollege] = useState<CollegeValue>({ id: initial?.college_id ?? null, name: initial?.college_name ?? "" });
  const years = graduationYears();
  const y = initial?.graduation_year;
  const yearOptions = y && !years.includes(y) ? [y, ...years] : years;

  return (
    <div className="space-y-4">
      <input type="hidden" name="edu_present" value="1" />
      <fieldset>
        <legend className="label">Are you in college?</legend>
        <div className="flex flex-wrap gap-2">
          {(["yes", "no"] as const).map((v) => (
            <label
              key={v}
              className={clsx(
                "flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-brand/30",
                inCollege === v ? "border-brand/60 bg-brand/10 text-fog" : "border-line text-mute hover:text-fog",
              )}
            >
              <input type="radio" name="in_college" value={v} checked={inCollege === v} onChange={() => setInCollege(v)} className="accent-brand" />
              {v === "yes" ? "Yes" : "No"}
            </label>
          ))}
        </div>
      </fieldset>
      {inCollege === "yes" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="profile-college" className="label">College</label>
            <CollegePicker id="profile-college" city={city} value={college} onChange={setCollege} name="college" />
          </div>
          <div>
            <label htmlFor="profile-course" className="label">Course</label>
            <input id="profile-course" name="course" list="profile-course-list" defaultValue={initial?.course ?? ""} className="input" placeholder="e.g. BMS" />
            <datalist id="profile-course-list">{COURSE_SUGGESTIONS.map((c) => <option key={c} value={c} />)}</datalist>
          </div>
          <div>
            <label htmlFor="profile-grad" className="label">Graduation year</label>
            <select id="profile-grad" name="graduation_year" defaultValue={y ?? ""} className="input">
              <option value="">Select year</option>
              {yearOptions.map((yy) => <option key={yy} value={yy}>{yy}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="profile-college-email" className="label">College email (optional)</label>
            <input id="profile-college-email" name="college_email" type="email" defaultValue={initial?.college_email ?? ""} className="input" placeholder="you@college.edu.in" autoComplete="off" />
            <span className="mt-1 flex items-center gap-1 text-xs text-mute">
              {initial?.verified_at ? (
                <><BadgeCheck className="h-3.5 w-3.5 text-ok" aria-hidden="true" /> Verified student</>
              ) : (
                "Used for the verified-student badge. Never shown to brands."
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
