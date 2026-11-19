/**
 * Seed list of colleges by city for the "Are you in college?" step and programmatic SEO pages.
 * Production source: AISHE (All India Survey on Higher Education) institution list, imported into
 * a `colleges` table; this seed covers Vigor's priority campuses so autocomplete works offline/demo.
 */
export type College = { id: string; name: string; short?: string; city: string; domains?: string[] };

const C = (city: string, list: [string, string?, string[]?][]): College[] =>
  list.map(([name, short, domains]) => ({
    id: `${city}-${(short ?? name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}`.toLowerCase(),
    name, short, city, domains,
  }));

export const COLLEGES: College[] = [
  ...C("Mumbai", [
    ["Narsee Monjee College of Commerce & Economics", "NM College", ["nmcollege.in"]],
    ["Mithibai College", "Mithibai", ["mithibai.ac.in"]],
    ["St. Xavier's College, Mumbai", "Xavier's", ["xaviers.edu"]],
    ["Jai Hind College", "Jai Hind", ["jaihindcollege.com"]],
    ["H.R. College of Commerce & Economics", "HR College", ["hrcollege.edu"]],
    ["K.C. College", "KC College", ["kccollege.edu.in"]],
    ["SVKM's NMIMS", "NMIMS", ["nmims.edu"]],
    ["IIT Bombay", "IITB", ["iitb.ac.in"]],
    ["Wilson College", "Wilson"],
    ["Sophia College for Women", "Sophia"],
    ["Ruia College", "Ruia", ["ruiacollege.edu"]],
    ["Podar College", "Podar"],
    ["D.G. Ruparel College", "Ruparel"],
    ["Kishinchand Chellaram College", "KC"],
    ["Somaiya Vidyavihar University", "Somaiya", ["somaiya.edu"]],
    ["Thakur College of Science & Commerce", "Thakur"],
    ["Rizvi College", "Rizvi"],
    ["Mumbai University (Kalina)", "MU", ["mu.ac.in"]],
  ]),
  ...C("Pune", [
    ["Symbiosis International University", "Symbiosis", ["symbiosis.ac.in", "siu.edu.in"]],
    ["Fergusson College", "Fergusson", ["fergusson.edu"]],
    ["MIT World Peace University", "MIT-WPU", ["mitwpu.edu.in"]],
    ["Flame University", "FLAME", ["flame.edu.in"]],
    ["College of Engineering Pune", "COEP", ["coep.ac.in"]],
    ["Brihan Maharashtra College of Commerce", "BMCC"],
    ["Christ University, Lavasa", "Christ Lavasa"],
  ]),
  ...C("Delhi", [
    ["Shri Ram College of Commerce", "SRCC", ["srcc.edu"]],
    ["St. Stephen's College", "Stephen's", ["ststephens.edu"]],
    ["Lady Shri Ram College for Women", "LSR", ["lsr.edu.in"]],
    ["Hindu College", "Hindu", ["hinducollege.ac.in"]],
    ["Miranda House", "Miranda", ["mirandahouse.ac.in"]],
    ["Hansraj College", "Hansraj", ["hansrajcollege.ac.in"]],
    ["Kirori Mal College", "KMC"],
    ["IIT Delhi", "IITD", ["iitd.ac.in"]],
    ["Jamia Millia Islamia", "Jamia", ["jmi.ac.in"]],
    ["Indraprastha Institute of Information Technology", "IIIT-D", ["iiitd.ac.in"]],
    ["Ashoka University", "Ashoka", ["ashoka.edu.in"]],
    ["Amity University, Noida", "Amity", ["amity.edu"]],
  ]),
  ...C("Bangalore", [
    ["Christ University", "Christ", ["christuniversity.in"]],
    ["St. Joseph's University", "St. Joseph's", ["sju.edu.in"]],
    ["Mount Carmel College", "MCC", ["mccblr.edu.in"]],
    ["Indian Institute of Science", "IISc", ["iisc.ac.in"]],
    ["RV College of Engineering", "RVCE", ["rvce.edu.in"]],
    ["PES University", "PES", ["pes.edu"]],
    ["Jain University", "Jain", ["jainuniversity.ac.in"]],
    ["IIM Bangalore", "IIMB", ["iimb.ac.in"]],
  ]),
  ...C("Hyderabad", [
    ["Osmania University", "OU", ["osmania.ac.in"]],
    ["IIIT Hyderabad", "IIIT-H", ["iiit.ac.in"]],
    ["St. Francis College for Women", "St. Francis"],
    ["NALSAR University of Law", "NALSAR", ["nalsar.ac.in"]],
    ["ISB Hyderabad", "ISB", ["isb.edu"]],
  ]),
  ...C("Chennai", [
    ["Loyola College", "Loyola", ["loyolacollege.edu"]],
    ["IIT Madras", "IITM", ["iitm.ac.in"]],
    ["SRM Institute of Science and Technology", "SRM", ["srmist.edu.in"]],
    ["Women's Christian College", "WCC"],
    ["Madras Christian College", "MCC Chennai", ["mcc.edu.in"]],
  ]),
  ...C("Kolkata", [
    ["St. Xavier's College, Kolkata", "SXC Kolkata", ["sxccal.edu"]],
    ["Jadavpur University", "JU", ["jadavpuruniversity.in"]],
    ["Presidency University", "Presidency", ["presiuniv.ac.in"]],
  ]),
  ...C("Ahmedabad", [
    ["CEPT University", "CEPT", ["cept.ac.in"]],
    ["Nirma University", "Nirma", ["nirmauni.ac.in"]],
    ["IIM Ahmedabad", "IIMA", ["iima.ac.in"]],
    ["NID Ahmedabad", "NID", ["nid.edu"]],
  ]),
  ...C("Chandigarh", [
    ["Panjab University", "PU", ["puchd.ac.in"]],
    ["Chandigarh University", "CU", ["cumail.in"]],
  ]),
  ...C("Goa", [["Goa University", "GU", ["unigoa.ac.in"]], ["BITS Pilani, Goa", "BITS Goa", ["goa.bits-pilani.ac.in"]]]),
];

/** City-first, prefix-then-contains search across name and short name. */
export function searchColleges(q: string, city?: string | null, limit = 8): College[] {
  const s = q.trim().toLowerCase();
  const pool = city ? [...COLLEGES.filter((c) => c.city === city), ...COLLEGES.filter((c) => c.city !== city)] : COLLEGES;
  if (!s) return pool.slice(0, limit);
  const score = (c: College) => {
    const n = c.name.toLowerCase(), sh = (c.short ?? "").toLowerCase();
    if (sh.startsWith(s) || n.startsWith(s)) return 0;
    if (n.split(/\W+/).some((w) => w.startsWith(s))) return 1;
    if (n.includes(s) || sh.includes(s)) return 2;
    return 9;
  };
  return pool.map((c) => [score(c), c] as const).filter(([x]) => x < 9).sort((a, b) => a[0] - b[0]).slice(0, limit).map(([, c]) => c);
}

/** Guess a college from an email domain (e.g. name@nmims.edu → NMIMS). */
export function collegeFromEmail(email?: string | null): College | null {
  const d = email?.split("@")[1]?.toLowerCase();
  if (!d) return null;
  return COLLEGES.find((c) => c.domains?.some((x) => d === x || d.endsWith(`.${x}`))) ?? null;
}

export const collegeSlug = (c: College) => c.id;
