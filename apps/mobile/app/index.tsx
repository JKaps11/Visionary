import { PageStack } from "@/components/page-stack";

// The capture↔archive page-turn lives inside PageStack. Both surfaces are
// layers in a single Reanimated container; this route is the only entry
// point and the gesture system handles the rest.
export default function Index() {
  return <PageStack />;
}
