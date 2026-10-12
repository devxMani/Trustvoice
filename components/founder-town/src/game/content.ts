import type { ChatMsg, Look, Startup, TierId } from "./types";

export type Tier = {
  id: TierId;
  label: string;
  sign: string;
  min: number;
  membersLabel: string;
};

export const TIERS: Tier[] = [
  { id: "sprout", label: "$0", sign: "$0 / MO", min: 0, membersLabel: "Public" },
  { id: "seed", label: "$1–$1K", sign: "$1-$1K/MO", min: 1, membersLabel: "Verified" },
  { id: "tree", label: "$1K–$10K", sign: "$1K-$10K/MO", min: 1_000, membersLabel: "Verified" },
  { id: "rocket", label: "$10K–$100K", sign: "$10K-$100K/MO", min: 10_000, membersLabel: "Verified" },
  { id: "diamond", label: "$100K–$1M", sign: "$100K-$1M/MO", min: 100_000, membersLabel: "Verified" },
  { id: "crown", label: "$1M+", sign: "$1M+/MO", min: 1_000_000, membersLabel: "Verified" },
];

export const HAIR_COLORS = ["#3a2418", "#1c1c1c", "#ead89a", "#e07a32", "#5ea84a", "#f4f4f8", "#6d5bd0", "#3a6ec4"];
export const SKIN_COLORS = ["#f3c7a2", "#e0aa78", "#c68642", "#8d5524", "#f7dcc8"];
export const SHIRT_COLORS = ["#3a6ec4", "#e15a4a", "#f0c84a", "#3aaa68", "#ee7eae", "#5c6573", "#f4f1e8", "#6b4c9a"];
export const HAIR_STYLES = ["Short", "Long", "Buzz", "Spiky", "Bun", "Side"];

export function tierOf(revenue: number): Tier {
  let found = TIERS[0]!;
  for (const tier of TIERS) {
    if (revenue >= tier.min) found = tier;
  }
  return found;
}

export function canEnter(revenue: number, tier: TierId): boolean {
  const row = TIERS.find((t) => t.id === tier)!;
  return revenue >= row.min;
}

export function formatMoney(n: number): string {
  if (n >= 1_000_000) {
    const v = n / 1_000_000;
    return `$${v >= 10 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 10_000) return `$${Math.round(n / 1000)}K`;
  if (n >= 1_000) {
    const v = n / 1000;
    return `$${v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${Math.round(n)}`;
}

export function formatMo(n: number): string {
  const tier = tierOf(n);
  if (tier.id === "sprout") return "$0/mo";
  if (tier.id === "seed") return "<$1K/mo";
  if (n >= 1_000_000) return `${formatMoney(n)}/mo`;
  if (n >= 1_000) return `${formatMoney(n)}/mo`;
  return `${formatMoney(n)}/mo`;
}

export type NpcDef = {
  id: string;
  name: string;
  revenue: number;
  look: Look;
  x: number;
  y: number;
  outside: boolean;
  lines: string[];
  startups: Startup[];
};

const L = (hair: number, hairColor: number, skin: number, shirt: number): Look => ({
  hair,
  hairColor,
  skin,
  shirt,
});

export const NPCS: NpcDef[] = [
  {
    id: "matt",
    name: "Matt",
    revenue: 840,
    look: L(0, 3, 0, 1),
    x: 15 * 16,
    y: 16 * 16,
    outside: true,
    lines: [
      "yea can you buy them based on your MRR?",
      "the door checks last 30 days, not a vibe",
      "seed room is loud in a good way",
    ],
    startups: [
      { name: "Formmail", mrr: "$840", blurb: "Waitlists for agencies who hate spreadsheets." },
    ],
  },
  {
    id: "june",
    name: "June Park",
    revenue: 52_000,
    look: L(1, 5, 1, 0),
    x: 26 * 16,
    y: 14 * 16,
    outside: true,
    lines: [
      "yes it helps. also it's in the name of the chat",
      "rocket room is where pricing arguments go to die",
      "bring a number, not a deck",
    ],
    startups: [
      { name: "Northwind", mrr: "$52K", blurb: "Analytics for subscription boxes." },
      { name: "Lane", mrr: "$0", blurb: "A side project she refuses to kill." },
    ],
  },
  {
    id: "priya",
    name: "Priya",
    revenue: 4_200,
    look: L(4, 1, 2, 3),
    x: 6 * 16,
    y: 18 * 16,
    outside: true,
    lines: [
      "tree tier is $1k to $10k. the pet is not subtle",
      "we compare churn like it's weather",
      "the fountain does not count as revenue",
    ],
    startups: [{ name: "Lumenboard", mrr: "$4.2K", blurb: "Status pages founders actually update." }],
  },
  {
    id: "noah",
    name: "Noah",
    revenue: 0,
    look: L(2, 2, 0, 2),
    x: 20 * 16,
    y: 6 * 16,
    outside: true,
    lines: [
      "first week. the $0 room is the loud one",
      "I will wave when the first dollar lands",
      "public meadow. no lock, no secrets",
    ],
    startups: [{ name: "Unnamed", mrr: "$0", blurb: "Still picking the one sentence." }],
  },
  {
    id: "hana",
    name: "Hana",
    revenue: 220_000,
    look: L(1, 0, 3, 7),
    x: 40 * 16,
    y: 15 * 16,
    outside: true,
    lines: [
      "diamond room is quieter. fewer people, bigger problems",
      "if your pet is a rocket you are close",
      "please do not pitch me at the fountain",
    ],
    startups: [{ name: "Parcelstack", mrr: "$220K", blurb: "Returns logistics for indie brands." }],
  },
  {
    id: "omar",
    name: "Omar",
    revenue: 1_400_000,
    look: L(0, 1, 2, 6),
    x: 10 * 16,
    y: 24 * 16,
    outside: true,
    lines: [
      "crown is a small room on purpose",
      "the pet follows you. so does the number",
      "what happens in there stays in there",
    ],
    startups: [{ name: "Kingsroad", mrr: "$1.4M", blurb: "Payments for marketplaces that outgrew Stripe's defaults." }],
  },
  {
    id: "bea",
    name: "Bea",
    revenue: 8_800,
    look: L(5, 4, 4, 4),
    x: 5 * 16,
    y: 13 * 16,
    outside: false,
    lines: ["cottage smells like coffee and churn", "tree room, come in if the sign lets you"],
    startups: [{ name: "Campfire", mrr: "$8.8K", blurb: "Weekly metrics for bootstrapped teams." }],
  },
  {
    id: "luis",
    name: "Luis",
    revenue: 15_000,
    look: L(3, 3, 1, 0),
    x: 18 * 16,
    y: 15 * 16,
    outside: true,
    lines: [
      "walk up and hit space. I'll show you the startup",
      "ads on the billboard are free. dignity is not",
      "I hid nothing. the duck hid itself",
    ],
    startups: [{ name: "Dockbird", mrr: "$15K", blurb: "Changelog pages that don't look like 2014." }],
  },
  {
    id: "sable",
    name: "Sable",
    revenue: 640,
    look: L(0, 7, 3, 5),
    x: 11 * 16,
    y: 16 * 16,
    outside: true,
    lines: ["under $1k and extremely online", "seed room unlocked yesterday. I refreshed twice"],
    startups: [{ name: "Pagemail", mrr: "$640", blurb: "Newsletters rendered from a markdown folder." }],
  },
  {
    id: "kenji",
    name: "Kenji",
    revenue: 91_000,
    look: L(2, 1, 1, 1),
    x: 30 * 16,
    y: 12 * 16,
    outside: true,
    lines: ["almost diamond. the pet knows", "rocket room: we argue about annual plans"],
    startups: [{ name: "Shiftlog", mrr: "$91K", blurb: "On-call schedules for teams of three." }],
  },
  {
    id: "rosa",
    name: "Rosa",
    revenue: 3_300,
    look: L(4, 3, 0, 2),
    x: 8 * 16,
    y: 18 * 16,
    outside: true,
    lines: ["flowers are not a business model. I checked", "tree tier feels like the first real room"],
    startups: [{ name: "Clayqueue", mrr: "$3.3K", blurb: "Support inbox for ceramic studios. Really." }],
  },
  {
    id: "theo",
    name: "Theo",
    revenue: 0,
    look: L(2, 5, 0, 3),
    x: 22 * 16,
    y: 10 * 16,
    outside: true,
    lines: ["lurking until the first dollar", "the gazebo is public. sit anyway"],
    startups: [{ name: "Still shipping", mrr: "$0", blurb: "A keyboard for people who write release notes." }],
  },
  {
    id: "imani",
    name: "Imani",
    revenue: 27_000,
    look: L(1, 0, 3, 4),
    x: 27 * 16,
    y: 12 * 16,
    outside: false,
    lines: ["bench by the office is the real rocket room", "yes the solar panels are decorative"],
    startups: [{ name: "Brightpath", mrr: "$27K", blurb: "Onboarding checklists sold as a product." }],
  },
  {
    id: "quinn",
    name: "Quinn",
    revenue: 510_000,
    look: L(0, 6, 1, 0),
    x: 44 * 16,
    y: 12 * 16,
    outside: false,
    lines: ["diamond hall. knock with a number", "we do not do intros in the wheat"],
    startups: [{ name: "Glacier", mrr: "$510K", blurb: "Usage billing that finance will actually open." }],
  },
  {
    id: "ada",
    name: "Ada",
    revenue: 2_100,
    look: L(5, 2, 4, 7),
    x: 7 * 16,
    y: 12 * 16,
    outside: true,
    lines: ["the white house is not a room. the signs are", "I found the duck. you can too"],
    startups: [{ name: "Fieldnote", mrr: "$2.1K", blurb: "Customer interviews, tagged and searchable." }],
  },
  {
    id: "jules",
    name: "Jules",
    revenue: 120,
    look: L(3, 4, 0, 3),
    x: 13 * 16,
    y: 17 * 16,
    outside: true,
    lines: ["$120 still opens the seed door", "tinycron pays for coffee. almost"],
    startups: [{ name: "Tinycron", mrr: "$120", blurb: "Cron monitoring with fewer emails." }],
  },
  {
    id: "rin",
    name: "Rin",
    revenue: 0,
    look: L(4, 6, 1, 6),
    x: 18 * 16,
    y: 9 * 16,
    outside: false,
    lines: ["$0 room: say what you're building in one line", "no revenue required. manners are"],
    startups: [{ name: "Draft", mrr: "$0", blurb: "A landing page that is still a landing page." }],
  },
  {
    id: "cole",
    name: "Cole",
    revenue: 400,
    look: L(0, 0, 2, 5),
    x: 12 * 16,
    y: 15 * 16,
    outside: false,
    lines: ["seed room snacks are imaginary", "ask me about the billboard"],
    startups: [{ name: "Kitlist", mrr: "$400", blurb: "Packing lists for people who ship hardware." }],
  },
  {
    id: "nia",
    name: "Nia",
    revenue: 6_000,
    look: L(1, 1, 3, 1),
    x: 4 * 16,
    y: 12 * 16,
    outside: false,
    lines: ["cottage chat deletes nothing for a year. be nice", "tree pet means four figures"],
    startups: [{ name: "Harbor", mrr: "$6K", blurb: "Uptime for side projects that grew up." }],
  },
  {
    id: "wes",
    name: "Wes",
    revenue: 40_000,
    look: L(2, 5, 0, 0),
    x: 28 * 16,
    y: 13 * 16,
    outside: false,
    lines: ["office windows are occupied. come inside", "we talk pricing before features"],
    startups: [{ name: "Paperlane", mrr: "$40K", blurb: "Proposals that sign themselves. Almost." }],
  },
  {
    id: "gail",
    name: "Gail",
    revenue: 300_000,
    look: L(5, 2, 1, 7),
    x: 46 * 16,
    y: 14 * 16,
    outside: false,
    lines: ["if the gem follows you, this door opens", "shorter calls. larger invoices"],
    startups: [{ name: "Northglass", mrr: "$300K", blurb: "BI for finance teams who hated the last BI." }],
  },
  {
    id: "idris",
    name: "Idris",
    revenue: 2_200_000,
    look: L(0, 1, 3, 2),
    x: 12 * 16,
    y: 26 * 16,
    outside: false,
    lines: ["crown room is small because it should be", "leave the pitch on the billboard"],
    startups: [{ name: "Regal", mrr: "$2.2M", blurb: "Treasury for multi-entity SaaS groups." }],
  },
];

const day = (month: number, date: number, h: number, min: number) =>
  Date.UTC(2026, month, date, h, min);

export const SEED_MESSAGES: ChatMsg[] = [
  { id: "s1", room: "sprout", author: "Noah", text: "is the $0 room just people launching this week?", ts: day(8, 23, 13, 44), revenue: 0 },
  { id: "s2", room: "sprout", author: "Rin", text: "yes. no revenue yet still counts. say what you're building", ts: day(8, 23, 16, 31), revenue: 0, hearts: 1 },
  { id: "s3", room: "sprout", author: "Theo", text: "please someone join me", ts: day(9, 12, 8, 10), revenue: 0 },
  { id: "e1", room: "seed", author: "Matt", text: "yea can you buy them based on your MRR?", ts: day(8, 28, 15, 2), revenue: 840 },
  { id: "e2", room: "seed", author: "Sable", text: "only rooms at or under your last 30 days. the $10k door stays shut", ts: day(8, 28, 15, 9), revenue: 640 },
  { id: "e3", room: "seed", author: "Jules", text: "$120 and I still got a plant. respect the plant", ts: day(9, 2, 11, 20), revenue: 120 },
  { id: "t1", room: "tree", author: "Priya", text: "a tree means $1k to $10k. it follows you everywhere", ts: day(8, 20, 9, 12), revenue: 4200 },
  { id: "t2", room: "tree", author: "Bea", text: "cottage rules: no decks, no 'quick question' that is a demo", ts: day(8, 20, 9, 40), revenue: 8800, hearts: 2 },
  { id: "t3", room: "tree", author: "Rosa", text: "who else is hiring their first support person?", ts: day(9, 11, 18, 4), revenue: 3300 },
  { id: "r1", room: "rocket", author: "June Park", text: "yes it helps. also it's in the name of the chat", ts: day(8, 28, 14, 12), revenue: 52000 },
  { id: "r2", room: "rocket", author: "Kenji", text: "annual vs monthly. fight in here, not on the timeline", ts: day(8, 29, 17, 48), revenue: 91000, hearts: 3 },
  { id: "r3", room: "rocket", author: "Wes", text: "the solar panels do not generate MRR. I asked", ts: day(9, 10, 12, 2), revenue: 40000 },
  { id: "d1", room: "diamond", author: "Hana", text: "smaller room. say the number first", ts: day(8, 15, 10, 5), revenue: 220000 },
  { id: "d2", room: "diamond", author: "Quinn", text: "if you can see this, your last 30 days cleared $100k", ts: day(8, 15, 10, 22), revenue: 510000 },
  { id: "d3", room: "diamond", author: "Gail", text: "what are you cutting this quarter?", ts: day(9, 8, 16, 16), revenue: 300000, hearts: 1 },
  { id: "c1", room: "crown", author: "Omar", text: "what happens in this room stays in this room", ts: day(7, 2, 8, 30), revenue: 1400000 },
  { id: "c2", room: "crown", author: "Idris", text: "two seats. don't waste them on a pitch", ts: day(7, 2, 8, 44), revenue: 2200000, hearts: 4 },
];

export const TIER_THEME: Record<TierId, { floor: string; floor2: string; wall: string; trim: string; rug: string; ink: string }> = {
  sprout: { floor: "#d7c096", floor2: "#c9b184", wall: "#f6f3ea", trim: "#6aaa48", rug: "#9ed67a", ink: "#2a2418" },
  seed: { floor: "#e4d0a4", floor2: "#d4be90", wall: "#f7f4ec", trim: "#3aaa68", rug: "#b7e6a0", ink: "#243024" },
  tree: { floor: "#e0c088", floor2: "#cda86e", wall: "#f4ead8", trim: "#2f7a32", rug: "#6aaa48", ink: "#1e2a18" },
  rocket: { floor: "#d7d2c6", floor2: "#c8c2b4", wall: "#f4f7fb", trim: "#2f5ea8", rug: "#3a6ec4", ink: "#1a2438" },
  diamond: { floor: "#d4dee8", floor2: "#c4d0dc", wall: "#f5fbff", trim: "#2a90b8", rug: "#7ed0e8", ink: "#163040" },
  crown: { floor: "#e6d6a8", floor2: "#d4c290", wall: "#fbf6ea", trim: "#e2b340", rug: "#a32020", ink: "#3a2a10" },
};

export const ROOM_BLURB: Record<TierId, string> = {
  sprout: "Public meadow. Anyone can walk in.",
  seed: "Last 30 days cleared $1.",
  tree: "A tree means $1K–$10K.",
  rocket: "Rockets only. $10K and up.",
  diamond: "Quiet room. $100K last 30 days.",
  crown: "What happens here stays here.",
};
