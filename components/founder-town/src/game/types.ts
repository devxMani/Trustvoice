export const TILE = 16;
export const COLS = 56;
export const ROWS = 42;

export type TierId = "sprout" | "seed" | "tree" | "rocket" | "diamond" | "crown";

export type Look = {
  hair: number;
  hairColor: number;
  skin: number;
  shirt: number;
};

export type Startup = { name: string; mrr: string; blurb: string };

export type ChatMsg = {
  id: string;
  room: TierId;
  author: string;
  text: string;
  ts: number;
  revenue: number;
  mine?: boolean;
  hearts?: number;
};

export type BuildingKind =
  | "office"
  | "shop"
  | "cottage"
  | "house"
  | "diamond"
  | "crown"
  | "gazebo";

export type Building = {
  id: string;
  kind: BuildingKind;
  tier: TierId | null;
  tx: number;
  ty: number;
  tw: number;
  th: number;
  door: "n" | "s";
};

export type PropKind =
  | "bush"
  | "tree"
  | "lamp"
  | "fountain"
  | "bench"
  | "billboard"
  | "blimp";

export type Prop = {
  kind: PropKind;
  x: number;
  y: number;
  variant: number;
};

export type Egg = {
  id: string;
  x: number;
  y: number;
  r: number;
  auto: boolean;
  line: string;
};

export type WorldMap = {
  cells: Uint8Array;
  solid: Uint8Array;
  buildings: Building[];
  props: Prop[];
  flowers: { x: number; y: number; hue: number }[];
  eggs: Egg[];
  spawn: { x: number; y: number };
};

export type MenuId = "main" | "settings" | "about";

export type Bubble = {
  id: string;
  anchor: string;
  name: string;
  meta: string;
  text: string;
  until: number;
};

export type Hit = { id: string; x: number; y: number; w: number; h: number };

export type Actor = {
  id: string;
  name: string;
  revenue: number;
  look: Look;
  x: number;
  y: number;
  facing: 0 | 1 | 2 | 3;
  frame: number;
  frameT: number;
  moving: boolean;
  home: TierId;
  outside: boolean;
  lines: string[];
  lineI: number;
  startups: Startup[];
  wanderT: number;
  path: { x: number; y: number }[] | null;
  pathI: number;
  petX: number;
  petY: number;
  phase: number;
  outX: number;
  outY: number;
  slotX: number;
  slotY: number;
};

export type Town = {
  time: number;
  map: WorldMap;
  player: Actor;
  npcs: Actor[];
  cam: { x: number; y: number };
  keys: Set<string>;
  qaKeys: Set<string> | null;
  just: Set<string>;
  touch: { x: number; y: number };
  mode: "out" | "in";
  room: TierId | null;
  fade: number;
  fadeDir: 0 | 1 | -1;
  pending: null | { kind: "enter"; tier: TierId } | { kind: "exit" };
  menu: MenuId | null;
  menuIndex: number;
  inspectId: string | null;
  bubbles: Bubble[];
  toast: { text: string; until: number } | null;
  eggs: string[];
  dest: { x: number; y: number } | null;
  autoEnter: TierId | null;
  autoInspect: string | null;
  chatOpen: boolean;
  adMode: boolean;
  muted: boolean;
  showNames: boolean;
  showBubbles: boolean;
  anonymous: boolean;
  startupName: string;
  blurb: string;
  ad: string;
  messages: ChatMsg[];
  hearted: Set<string>;
  shake: number;
  prompt: string;
  hits: Hit[];
  viewW: number;
  viewH: number;
  hudLift: number;
  createOpen: boolean;
  textOpen: boolean;
  narrow: boolean;
  seen: boolean;
  speed: number;
  chatter: number;
  returnX: number;
  returnY: number;
  displaced: boolean;
  audio: AudioContext | null;
  onRequest: ((r: "profile" | "text" | "create") => void) | null;
};
