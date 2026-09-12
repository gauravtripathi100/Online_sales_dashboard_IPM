// Product classification for the "Product Dashboard" (1 Year / 2 Year / Dropper / Test
// Series / Self Paced / etc). This is a completely separate lens from the Online/Offline
// Revenue dashboards — those classify by *who sold it* (POS + Centre Name columns).
// This classifies by *what was sold* (the Course Name text itself), because a physical
// center can sell an "online" product and vice versa. The two systems are intentionally
// independent.

export type ProductRow = {
  product: string;
  channel: "online" | "offline" | null; // null = channel-agnostic product
  net: number;
  date: Date | null;
};

// Checked first, in order. Channel-agnostic — no Online/Offline split.
const CHANNEL_AGNOSTIC_RULES: [string, RegExp][] = [
  ["GMB", /GMB/],
  ["Study Material", /ABHYAS/],
  ["Interview Prep Batch", /ADMITSURE|INTERVIEW PREP/],
  ["Test Series", /TEST SERIES/],
  ["Self Paced", /SWAYAM/],
  ["Early Bird", /EARLY BIRD/],
];

// Checked after the above. Each splits into Online/Offline based on whether the
// course name contains a center reference.
const SPLIT_RULES: [string, RegExp][] = [
  ["Crash", /CRASH/],
  ["IIM B/IIM K", /IIM BANGALORE|IIM KOZHIKODE/],
  ["Dropper", /DROPPER/],
  ["1 Year", /2027/],
  ["2 Year", /2028/],
];

// Canonical display order matching the original manual sheet, plus an "Others" catch-all
// for anything that matches none of the rules above (kept visible for auditability rather
// than silently dropped).
export const PRODUCT_DISPLAY_ORDER: { product: string; channel: "online" | "offline" | null }[] = [
  { product: "1 Year", channel: "online" },
  { product: "2 Year", channel: "online" },
  { product: "Dropper", channel: "online" },
  { product: "Self Paced", channel: null },
  { product: "Study Material", channel: null },
  { product: "GMB", channel: null },
  { product: "Test Series", channel: null },
  { product: "Interview Prep Batch", channel: null },
  { product: "Crash", channel: "online" },
  { product: "IIM B/IIM K", channel: "online" },
  { product: "Early Bird", channel: null },
  { product: "1 Year", channel: "offline" },
  { product: "Dropper", channel: "offline" },
  { product: "2 Year", channel: "offline" },
  { product: "Crash", channel: "offline" },
  { product: "IIM B/IIM K", channel: "offline" },
  { product: "Others", channel: "online" },
  { product: "Others", channel: "offline" },
];

export function classifyProduct(courseNameRaw: string): { product: string; channel: "online" | "offline" | null } {
  const cn = courseNameRaw.toUpperCase();

  for (const [product, re] of CHANNEL_AGNOSTIC_RULES) {
    if (re.test(cn)) return { product, channel: null };
  }

  const channel: "online" | "offline" = cn.includes("CENT") ? "offline" : "online";

  for (const [product, re] of SPLIT_RULES) {
    if (re.test(cn)) return { product, channel };
  }

  return { product: "Others", channel };
}

export function productLabel(product: string, channel: "online" | "offline" | null): string {
  if (channel === null) return product;
  const channelWord = channel === "online" ? "Online" : "Offline";
  if (product === "IIM B/IIM K") return `IIM B/IIM K ${channelWord} Batch`;
  if (product === "Others") return `Others (${channelWord})`;
  return `${product} ${channelWord}`;
}
