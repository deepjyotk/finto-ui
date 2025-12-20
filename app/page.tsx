import React from "react"
import Header from "@/components/layout/header"
import Hero from "@/components/landing/Hero"
import LogoCloud from "@/components/landing/LogoCloud"
import Features from "@/components/landing/Features"
import HowItWorks from "@/components/landing/HowItWorks"
// import Showcase from "@/components/landing/Showcase"
import Testimonials from "@/components/landing/Testimonials"
import FAQ from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"

export default function HomePage() {
  return (
    <div className="relative">
      <Header />
      <Hero />
      <LogoCloud />
      <Features />
      <HowItWorks />
      {/* <Showcase /> */}
      <Testimonials />
      <FAQ />
      <Footer />
    </div>
  )
}
