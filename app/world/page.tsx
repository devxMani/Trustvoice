// app/world/page.tsx — Server component: direct entry (no forced auth roadblocks)

import { FounderTown } from "@/components/founder-town/src/components/FounderTown";

export default function WorldPage() {
  return <FounderTown />;
}
