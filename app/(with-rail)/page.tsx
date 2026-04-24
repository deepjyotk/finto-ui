import React from "react"
import Hero from "@/components/landing/Hero"
import TickerSearchSection from "@/components/landing/TickerSearchSection"
import DailyContestBanner from "@/components/landing/DailyContestBanner"
import LogoCloud from "@/components/landing/LogoCloud"
import Features from "@/components/landing/Features"
import HowItWorks from "@/components/landing/HowItWorks"
import Testimonials from "@/components/landing/Testimonials"
import FAQ from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"

export default function HomePage() {
  return (
    <div className="relative">
      <Hero />
      <TickerSearchSection />
      <DailyContestBanner />
      <LogoCloud />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  )
}
