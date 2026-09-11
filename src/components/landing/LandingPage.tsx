import { LandingNavbar } from "./LandingNavbar";
import { HeroSection } from "./HeroSection";
import { TrustStrip } from "./TrustStrip";
import { ProblemSection } from "./ProblemSection";
import { ConversationDemo } from "./ConversationDemo";
import { HowItWorksSection } from "./HowItWorksSection";
import { ProductShowcaseSection } from "./ProductShowcaseSection";
import { AIWorkflowSection } from "./AIWorkflowSection";
import { AutomationSection } from "./AutomationSection";
import { OmnichannelSection } from "./OmnichannelSection";
import { ComparisonSection } from "./ComparisonSection";
import { SecuritySection } from "./SecuritySection";
import { FAQSection } from "./FAQSection";
import { DemoCTASection } from "./DemoCTASection";
import { LandingFooter } from "./LandingFooter";

export function LandingPage() {
  return (
    <div className="landing-page min-h-screen bg-[var(--landing-bg)] text-[var(--landing-ink)]">
      <LandingNavbar />
      <main>
        <HeroSection />
        <TrustStrip />
        <ProblemSection />
        <ConversationDemo />
        <HowItWorksSection />
        <ProductShowcaseSection />
        <AIWorkflowSection />
        <AutomationSection />
        <OmnichannelSection />
        <ComparisonSection />
        <SecuritySection />
        <FAQSection />
        <DemoCTASection />
      </main>
      <LandingFooter />
    </div>
  );
}
