'use client'

import Header from '@/components/header'
import HeroSection from '@/components/hero-section'
import TrendingTracks from '@/components/trending-tracks'
import TrendingArtists from '@/components/trending-artists'
import HowItWorks from '@/components/how-it-works'
import Footer from '@/components/footer'

export default function Home() {

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <Header />
      <HeroSection />
      <TrendingTracks isRecent={true} />
      <TrendingArtists />
      <HowItWorks />
      <Footer />
    </div>
  )
}
