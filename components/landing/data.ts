import { CITIES, EVENT_CATEGORIES, INFLUENCER_NICHES, LANGUAGES } from "@/lib/constants";

/** Real product taxonomy counts (not usage metrics) — safe to show as numbers. */
export const FACTS = [
  { value: CITIES.length, label: "Launch cities" },
  { value: EVENT_CATEGORIES.length, label: "Event talent roles" },
  { value: INFLUENCER_NICHES.length, label: "Creator niches" },
  { value: LANGUAGES.length, label: "Languages" },
] as const;

export const CAMPUS_TYPES = ["Engineering", "Commerce", "Design", "Mass media", "Management", "Arts"] as const;

export const TRUST_ITEMS = [
  "Mumbai", "Engineering colleges", "Pune", "Design schools", "Delhi", "Commerce colleges",
  "Bangalore", "Mass media institutes", "Hyderabad", "B-schools", "Chennai", "College fests",
  "Kolkata", "Arts & humanities", "Ahmedabad", "Hotel management", "Chandigarh", "Goa",
];

export const FAQS: { q: string; a: string }[] = [
  {
    q: "What is Vigor Talent Network?",
    a: "A talent network by Vigor Launchpad, a Mumbai youth and college marketing agency. College creators, influencers and event talent register once; Vigor posts campaign briefs, matching talent express interest, the team shortlists and brands approve — then posts are tracked automatically.",
  },
  {
    q: "Who can join?",
    a: "Instagram creators of any size (including college creators), and event talent such as brand promoters, hosts and anchors, DJs, musicians, dancers, comics, technical crew and specialty performers.",
  },
  {
    q: "Do I need a big following to join as a creator?",
    a: "No. Briefs are matched on niche, city, campus and engagement — not follower count alone — so nano and micro creators are welcome.",
  },
  {
    q: "How are Instagram metrics collected?",
    a: "When you add your Instagram handle, public profile metrics such as followers and engagement are fetched automatically and refreshed over time, so brands see current numbers instead of screenshots.",
  },
  {
    q: "How do brands hire talent?",
    a: "Send your requirement through the brand enquiry form. Vigor's team turns it into a brief, matches talent from the network and shares a shortlist through a review link you can approve from your phone. Live posts are tracked and summarised in a report.",
  },
  {
    q: "Which cities do you cover?",
    a: `We are launching in ${CITIES.slice(0, -1).join(", ")} and ${CITIES[CITIES.length - 1]}, with campaigns that can run pan-India.`,
  },
  {
    q: "How will I hear about campaigns?",
    a: "Matching briefs appear in your dashboard, and you get WhatsApp updates at each stage — from shortlisted to confirmed to live.",
  },
];
