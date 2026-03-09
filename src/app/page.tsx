import AboutSection from "./components/AboutSection/AboutSection";
import ContactCtaSection from "./components/ContactCtaSection/ContactCtaSection";
import Footer from "./components/Footer/Footer";
import FloatingExploreButton from "./components/FloatingExploreButton/FloatingExploreButton";
import Header from "./components/Header/Header";
import Hero from "./components/Hero/Hero";
import HowWeWork from "./components/HowWeWorkSection/HowWeWork";
import InitialLoader from "./components/InitialLoader/InitialLoader";
import OurValuesSection from "./components/OurValuesSection/OurValuesSection";
import StepSectionContainer from "./components/StepSectionContainer/StepSectionContainer";
import TestimonialsSection from "./components/TestimonialsSection/TestimonialsSection";
import WorksSection from "./components/WorksSection/WorksSection";

export default function Home() {
  return (
    <>
      <InitialLoader />
      <div data-app-shell>
        <Header />
        <Hero />
        <AboutSection />
        <TestimonialsSection />
        <HowWeWork />
        <StepSectionContainer />
        <WorksSection />
        <OurValuesSection />
        <ContactCtaSection />
        <Footer />
      </div>
      <FloatingExploreButton />
    </>
  );
}
