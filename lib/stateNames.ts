// Maps free-text state names as they appear in the 634 report to the
// canonical NAME_1 values used in public/maps/india_states_topo.json.
const ALIASES: Record<string, string> = {
  ORISSA: "Orissa",
  ODISHA: "Orissa",
  UTTARAKHAND: "Uttaranchal",
  UTTARANCHAL: "Uttaranchal",
  "JAMMU AND KASHMIR": "Jammu and Kashmir",
  "JAMMU & KASHMIR": "Jammu and Kashmir",
  PONDICHERRY: "Puducherry",
  PUDUCHERRY: "Puducherry",
  NCT: "Delhi",
  "NEW DELHI": "Delhi",
  DELHI: "Delhi",
};

export function normalizeStateName(raw: string): string {
  const cleaned = raw.trim();
  const upper = cleaned.toUpperCase();
  if (ALIASES[upper]) return ALIASES[upper];
  // Title-case fallback so casing differences ("gujarat" vs "Gujarat") still match.
  return cleaned
    .toLowerCase()
    .split(" ")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}
