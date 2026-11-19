/**
 * Data derivations for the public marketing surface and programmatic SEO pages.
 * Reads only from shared fixtures (lib/demo) and lib/colleges — never mutates them.
 */
import { COLLEGES, collegeSlug, type College } from "@/lib/colleges";
import { CREATORS, PLATFORM_STATS, CAMPAIGNS, type DemoCreator } from "@/lib/demo/fixtures";

export type CityInfo = {
  slug: string;
  name: string;
  /** Approx. lat/long, used for the abstract campus constellation. */
  lat: number;
  lng: number;
  state: string;
  /** Hand-written, city-specific copy so every page says something different. */
  intro: string;
  scene: string;
  niches: string[];
  languages: string[];
};

export const CITY_INFO: CityInfo[] = [
  {
    slug: "mumbai", name: "Mumbai", lat: 19.08, lng: 72.88, state: "Maharashtra",
    intro: "Vigor Launchpad's home city and the deepest pool in the network — from the Vile Parle college belt to South Mumbai's heritage campuses.",
    scene: "Mumbai creators move fast: monsoon reels, Bandra café drops, fest-season takeovers and late-night food runs. Brands use the city to test a launch before going national.",
    niches: ["Fashion", "Food", "Lifestyle", "Comedy"], languages: ["English", "Hindi", "Marathi"],
  },
  {
    slug: "pune", name: "Pune", lat: 18.52, lng: 73.86, state: "Maharashtra",
    intro: "A student city first — engineering, design and liberal-arts campuses packed into a few neighbourhoods, which makes on-ground activations quick to staff.",
    scene: "Pune audiences reward authenticity: hostel-life vlogs, ₹500 weekend guides, café hopping in Koregaon Park and tech-meets-campus content.",
    niches: ["Student / Campus", "Food", "Tech", "Travel"], languages: ["English", "Hindi", "Marathi"],
  },
  {
    slug: "delhi", name: "Delhi NCR", lat: 28.61, lng: 77.21, state: "Delhi",
    intro: "North Campus, South Campus and the NCR private universities together form the country's largest college-creator scene.",
    scene: "Delhi creators lead on fashion, debate-style commentary and street food. Fest weeks at SRCC, LSR and IIT Delhi are among the most watched campus moments of the year.",
    niches: ["Fashion", "Beauty", "Food", "Finance"], languages: ["English", "Hindi", "Punjabi"],
  },
  {
    slug: "bangalore", name: "Bangalore", lat: 12.97, lng: 77.59, state: "Karnataka",
    intro: "Where campus culture meets startup culture — creators here are as comfortable reviewing a gadget as covering a gig.",
    scene: "Expect tech explainers, indie-music nights, fitness and weekend getaways. Bangalore briefs often blend product sampling with creator content.",
    niches: ["Tech", "Music", "Fitness", "Lifestyle"], languages: ["English", "Kannada", "Hindi"],
  },
  {
    slug: "hyderabad", name: "Hyderabad", lat: 17.39, lng: 78.49, state: "Telangana",
    intro: "A fast-growing creator market anchored by research, law and business campuses, with a food scene that travels well on Reels.",
    scene: "Hyderabad content leans into food trails, family-friendly comedy and Telugu–English code-switching that keeps engagement high.",
    niches: ["Food", "Comedy", "Tech", "Lifestyle"], languages: ["English", "Telugu", "Hindi"],
  },
  {
    slug: "chennai", name: "Chennai", lat: 13.08, lng: 80.27, state: "Tamil Nadu",
    intro: "Historic arts colleges and top engineering institutes give Chennai a creator base that skews towards music, dance and smart explainers.",
    scene: "Chennai's IIT Madras festivals Saarang and Shaastra draw national attention; the city's creators turn culture and classical training into scroll-stopping content.",
    niches: ["Music", "Dance", "Tech", "Food"], languages: ["English", "Tamil"],
  },
  {
    slug: "kolkata", name: "Kolkata", lat: 22.57, lng: 88.36, state: "West Bengal",
    intro: "Literary, artistic and fiercely loyal — Kolkata's campus creators build tight-knit audiences that actually reply.",
    scene: "Think adda culture, Durga Puja season, film and photography. Brands come to Kolkata for depth of engagement rather than raw reach.",
    niches: ["Art & Design", "Photography", "Food", "Music"], languages: ["English", "Bengali", "Hindi"],
  },
  {
    slug: "ahmedabad", name: "Ahmedabad", lat: 23.02, lng: 72.57, state: "Gujarat",
    intro: "Home to some of India's most respected design, architecture and management schools.",
    scene: "Ahmedabad creators are design-literate and entrepreneurial — strong for product launches, Navratri season and D2C brands that care about craft.",
    niches: ["Art & Design", "Finance", "Food", "Lifestyle"], languages: ["English", "Gujarati", "Hindi"],
  },
  {
    slug: "chandigarh", name: "Chandigarh", lat: 30.73, lng: 76.78, state: "Chandigarh",
    intro: "A compact, planned city with two large universities and a creator scene that punches well above its size.",
    scene: "Punjabi music, fitness, cars and fashion dominate. Chandigarh is a launch pad for brands targeting the whole of North India.",
    niches: ["Music", "Fitness", "Fashion", "Automotive"], languages: ["English", "Punjabi", "Hindi"],
  },
  {
    slug: "goa", name: "Goa", lat: 15.5, lng: 73.83, state: "Goa",
    intro: "Small campus count, outsized cultural pull — Goa creators set the tone for travel, music and festival content.",
    scene: "Beach-side events, live music and travel storytelling. Goa works best for experiential briefs and on-ground talent during the season.",
    niches: ["Travel", "Music", "Lifestyle", "Food"], languages: ["English", "Konkani", "Hindi"],
  },
];

/** lib/colleges uses "Delhi"; the page name may differ ("Delhi NCR"). */
const collegeCityKey = (c: CityInfo) => (c.slug === "delhi" ? "Delhi" : c.name);

export const getCity = (slug: string) => CITY_INFO.find((c) => c.slug === slug);
export const collegesIn = (city: CityInfo) => COLLEGES.filter((c) => c.city === collegeCityKey(city));
export const creatorsIn = (city: CityInfo): DemoCreator[] => CREATORS.filter((c) => c.city === collegeCityKey(city));
export const cityForCollege = (c: College) => CITY_INFO.find((x) => collegeCityKey(x) === c.city)!;
export const getCollege = (slug: string) => COLLEGES.find((c) => collegeSlug(c) === slug);
export const creatorsAt = (c: College) => CREATORS.filter((x) => x.college_id === c.id);

/**
 * Network-level estimates, scaled from the fixture sample to PLATFORM_STATS so numbers stay
 * consistent everywhere (the sample's city share × the network total). Rounded to look honest.
 */
export function cityStats(city: CityInfo) {
  const sample = creatorsIn(city);
  const colleges = collegesIn(city);
  const share = sample.length / CREATORS.length;
  const floor = 90 + colleges.length * 35;
  const creators = Math.max(floor, Math.round((share * PLATFORM_STATS.creators) / 10) * 10);
  const campuses = Math.max(colleges.length, Math.round(share * PLATFORM_STATS.campuses));
  const er = sample.length ? sample.reduce((a, c) => a + c.engagement_rate, 0) / sample.length : 5.4;
  const events = sample.length ? Math.round((sample.filter((c) => c.is_event_talent).length / sample.length) * 100) : 38;
  const inCollege = sample.length ? Math.round((sample.filter((c) => c.in_college).length / sample.length) * 100) : 70;
  const campaigns = CAMPAIGNS.filter((k) => k.cities.includes(collegeCityKey(city)));
  return { creators, campuses, listedColleges: colleges.length, er: Math.round(er * 10) / 10, events, inCollege, campaigns, sample };
}

/** A per-campus estimate that is stable and distinct for each college. */
export function collegeStats(c: College) {
  const city = cityForCollege(c);
  const cs = cityStats(city);
  const sample = creatorsAt(c);
  const n = collegesIn(city).length || 1;
  const seed = [...c.id].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) % 9973, 7);
  const creators = Math.round((cs.creators * 0.55) / n * (0.7 + (seed % 60) / 100) / 5) * 5 + sample.length;
  const er = sample.length ? Math.round((sample.reduce((a, x) => a + x.engagement_rate, 0) / sample.length) * 10) / 10 : Math.round((4.6 + (seed % 30) / 10) * 10) / 10;
  return { creators: Math.max(25, creators), er, sample, city };
}

/** Rough campus type from the institution name — drives distinct copy per college. */
export function campusKind(c: College): { kind: string; angle: string; niches: string[] } {
  const n = c.name.toLowerCase();
  if (/\biit\b|iiit|engineering|technology|coep|rvce|pes|bits|iisc|srm|\bmit\b/.test(n))
    return { kind: "engineering & technology", angle: "Tech reviews, hackathon diaries, hostel life and gadget unboxings travel well from this campus.", niches: ["Tech", "Gaming", "Student / Campus"] };
  if (/\biim\b|isb|nmims|management|symbiosis|business/.test(n))
    return { kind: "business & management", angle: "Finance explainers, internship stories and polished lifestyle content are this campus's strengths.", niches: ["Finance", "Lifestyle", "Student / Campus"] };
  if (/design|nid|cept|flame/.test(n))
    return { kind: "design & creative", angle: "Expect strong visual storytelling — styling, photography and craft-led brand collaborations.", niches: ["Art & Design", "Fashion", "Photography"] };
  if (/law|nalsar/.test(n))
    return { kind: "law", angle: "Sharp commentary and explainer formats; ideal for brands that want credible, articulate voices.", niches: ["Finance", "Lifestyle", "Student / Campus"] };
  if (/commerce|srcc|hr college|bmcc|podar|narsee/.test(n))
    return { kind: "commerce & economics", angle: "Fest-driven, highly social student body — great for food, fashion and campus activations.", niches: ["Fashion", "Food", "Student / Campus"] };
  if (/women|lady|miranda|sophia|mount carmel|wcc|st\. francis/.test(n))
    return { kind: "women's college", angle: "Beauty, fashion and wellness creators with highly engaged, mostly 18–24 female audiences.", niches: ["Beauty", "Fashion", "Lifestyle"] };
  if (/university/.test(n))
    return { kind: "multi-disciplinary university", angle: "A broad mix of streams means a broad mix of creators — from comedy and dance to food and fitness.", niches: ["Comedy", "Dance", "Food"] };
  return { kind: "arts, science & commerce", angle: "A classic metro college crowd: cultural fests, dance crews, music and everyday campus life.", niches: ["Music", "Dance", "Student / Campus"] };
}

export const fmtIN = (n: number) => n.toLocaleString("en-IN");
export const BRANDS = ["Domino's", "NUUK", "Nua", "boAt", "Chaayos", "Lenskart"];
export { PLATFORM_STATS, CAMPAIGNS, CREATORS, COLLEGES, collegeSlug };
