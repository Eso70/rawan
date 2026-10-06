import { HomeHero } from "../components/home-hero";
import { ToolkitSection } from "../components/toolkit-section";
import { CommunitySection } from "../components/community-section";
import { ManifestoSection } from "../components/manifesto-section";
import { CreatorsSection } from "../components/creators-section";
import { ClosingSection } from "../components/closing-section";
import { LandingScroll } from "../components/landing-scroll";
import { LandingNavigation } from "../components/landing-navigation";

export default function HomePage() {
  return (
    <LandingScroll>
      <LandingNavigation />
      <main>
        <HomeHero />
        <div className="landing-surface">
          <ToolkitSection />
          <CommunitySection />
        </div>
        <ManifestoSection />
        <div className="landing-surface">
          <CreatorsSection />
          <ClosingSection />
        </div>
      </main>
    </LandingScroll>
  );
}
