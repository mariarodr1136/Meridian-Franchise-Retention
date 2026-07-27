import { NetworkPageHero } from "@/components/NetworkPageHero";
import { ChurnContent } from "./ChurnContent";

export default function ChurnPage() {
  return (
    <div className="min-h-screen" style={{ background: "#F0F5FB" }}>
      <NetworkPageHero title="Retention AI" />
      <ChurnContent />
    </div>
  );
}
