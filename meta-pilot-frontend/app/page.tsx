import CTASection from "@/components/Landing/CTASection";
import FeatureSection from "@/components/Landing/FeatureSection";
import MetaPilotHero from "@/components/Landing/Hero/Hero";
import HowItWorksSection from "@/components/Landing/HowItWorks/HowItWorksSection";

export default function Home() {
  return (
    <>
      <MetaPilotHero />
      <FeatureSection />
      <HowItWorksSection />
      <CTASection />
    </>
  );
}
