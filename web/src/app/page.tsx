import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import SiteFooter from "./SiteFooter";

export default function Home() {
  return (
    <div className="flex flex-col">
      <Hero />
      <HowItWorks />
      <SiteFooter />
    </div>
  );
}
