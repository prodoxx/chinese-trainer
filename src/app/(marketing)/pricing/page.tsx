import { Check, X, Zap, Crown, Users, ArrowRight, Sparkles, TrendingUp, Shield, Globe, CheckCircle, Star } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"
import PricingClient from "./pricing-client"

export const metadata = {
  title: "Pricing - Danbing AI Chinese Learning | Simple, Transparent Pricing",
  description: "Start learning Chinese free forever or unlock unlimited characters with Pro. Save 20% with annual billing. No hidden fees, cancel anytime.",
  keywords: "Chinese learning app pricing, language learning subscription, Chinese flashcard app cost, spaced repetition software pricing, Taiwan Mandarin learning price",
};

export default async function PricingPage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated();

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center mb-6 sm:mb-8 bg-gradient-to-r from-[#f7cc48]/20 to-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/30 text-xs sm:text-sm px-4 py-2 rounded-full font-medium">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Simple, Transparent Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Invest in your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">Chinese fluency</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Start free and learn 100 characters. Upgrade to Pro when you're ready for unlimited learning. That's it.
            </p>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-[#7d8590]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>50,000+ active learners</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#f7cc48]" />
                <span>4.9/5 average rating</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>85% retention rate</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-10 border-b border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-2">$0</div>
                <div className="text-sm text-[#7d8590]">to start learning</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">100</div>
                <div className="text-sm text-[#7d8590]">free characters forever</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">20%</div>
                <div className="text-sm text-[#7d8590]">savings with annual</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">$0</div>
                <div className="text-sm text-[#7d8590]">cancellation fees</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <PricingClient />
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Compare Plans</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Every plan includes our core learning system. Pro unlocks unlimited potential.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#30363d]">
                    <th className="text-left py-4 px-4 text-white font-semibold">Features</th>
                    <th className="text-center py-4 px-4 text-white font-semibold">Free</th>
                    <th className="text-center py-4 px-4 text-white font-semibold bg-[#f7cc48]/10">Pro</th>
                    <th className="text-center py-4 px-4 text-white font-semibold">Team</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Pricing */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590]">Price</td>
                    <td className="text-center py-4 px-4 text-white">$0/mo</td>
                    <td className="text-center py-4 px-4 text-white bg-[#f7cc48]/10 font-semibold">$14-17.50/mo</td>
                    <td className="text-center py-4 px-4 text-white">Custom</td>
                  </tr>
                  
                  {/* Core Learning Features */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Core Learning</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Characters Limit</td>
                    <td className="text-center py-4 px-4 text-white">100</td>
                    <td className="text-center py-4 px-4 text-white bg-[#f7cc48]/10 font-semibold">Unlimited</td>
                    <td className="text-center py-4 px-4 text-white">Unlimited</td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Dual-Phase Flash Sessions</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Smart Mini-Quizzes</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">SM-2 Spaced Repetition</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Daily Reminders</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Cross-Device Sync</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Interactive Demo</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  
                  {/* AI Features */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">AI Enrichment</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Dictionary Lookup (CC-CEDICT)</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">AI-Generated Images</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Taiwan Mandarin Audio (TTS)</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Basic Mnemonics</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Daily Enrichment Limit</td>
                    <td className="text-center py-4 px-4 text-white">20 cards</td>
                    <td className="text-center py-4 px-4 text-white bg-[#f7cc48]/10 font-semibold">Unlimited</td>
                    <td className="text-center py-4 px-4 text-white">Unlimited</td>
                  </tr>
                  
                  {/* Character Insights */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Character Insights</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Complexity Analysis</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">AI Etymology & Evolution</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">AI Memory Aids</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Confusion Pattern Analysis</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Personalized Learning Tips</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  
                  {/* Analytics */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Analytics & Progress</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Basic Statistics</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Learning Curve Tracking</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Session Performance Metrics</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Cognitive Load Analysis</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Heat Map Calendar</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Progress Export (PDF)</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  
                  {/* Deck Management */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Deck Management</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">CSV Deck Import</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Multiple Decks</td>
                    <td className="text-center py-4 px-4">3 decks</td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10 font-semibold">Unlimited</td>
                    <td className="text-center py-4 px-4 text-white">Unlimited</td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Deck Sharing (Coming Soon)</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  
                  {/* Study Modes */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Study Modes</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">New Card Mode (8-card sessions)</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Review Mode (SM-2 scheduled)</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Practice Mode (unlimited)</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  
                  {/* Accessibility */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Accessibility</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Dark Theme</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Reduce Motion Option</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Brightness Control</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Mobile Responsive</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  
                  {/* Support & Team Features */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Support</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Community Support</td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Priority Email Support</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Dedicated Support Manager</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  
                  {/* Team Features */}
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] font-semibold">Team Features</td>
                    <td className="text-center py-4 px-4"></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"></td>
                    <td className="text-center py-4 px-4"></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Admin Dashboard</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Student Progress Tracking</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">Shared Team Decks</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                  <tr className="border-b border-[#30363d]/50">
                    <td className="py-4 px-4 text-[#7d8590] pl-8">API Access</td>
                    <td className="text-center py-4 px-4"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4 bg-[#f7cc48]/10"><X className="w-5 h-5 text-[#7d8590] mx-auto" /></td>
                    <td className="text-center py-4 px-4"><CheckCircle className="w-5 h-5 text-green-500 mx-auto" /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Common Questions</h2>
              <p className="text-xl text-[#7d8590]">
                Quick answers to help you choose the right plan
              </p>
            </div>

            <div className="space-y-6">
              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                  <h4 className="text-lg font-semibold text-white">What happens after my 7-day free trial?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590]">
                    After your 7-day trial, you'll be automatically enrolled in the Pro plan. You can cancel anytime during the trial with no charges. If you continue, you'll be billed monthly or annually based on your selection.
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                  <h4 className="text-lg font-semibold text-white">Can I switch between monthly and annual billing?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590]">
                    Yes! You can switch from monthly to annual billing anytime to save 20%. The change takes effect at your next billing cycle, and we'll prorate any unused time.
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                  <h4 className="text-lg font-semibold text-white">Do you offer refunds?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590]">
                    We offer a 30-day money-back guarantee for annual plans. If you're not satisfied within the first 30 days, contact support for a full refund. Monthly plans can be cancelled anytime.
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                  <h4 className="text-lg font-semibold text-white">What payment methods do you accept?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590]">
                    We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal. All payments are processed securely through Stripe.
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                  <h4 className="text-lg font-semibold text-white">Is my data safe with Danbing?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590]">
                    Absolutely. We use industry-standard encryption for all data transmission and storage. Your learning data is private and never shared with third parties. We're GDPR compliant and take privacy seriously.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Start Your Chinese Journey Today</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              Join 50,000+ learners mastering Chinese characters with science-based methods and AI assistance.
            </p>

            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-8 mb-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-lg text-white mb-6">
                Average user learns <span className="text-[#f7cc48] font-bold">300 characters</span> in their first month
              </p>
              
              <Link href="/auth/signup?plan=pro" className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mb-4">
                Start 7-Day Free Trial
              </Link>
              
              <p className="text-sm text-[#7d8590]">
                No credit card required • Cancel anytime
              </p>
            </div>

            <div className="flex items-center justify-center gap-6 text-sm text-[#7d8590]">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>Works everywhere</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Instant access</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}