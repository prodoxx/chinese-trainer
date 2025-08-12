import { Sparkles, Shield, Globe, CheckCircle } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"
import PricingClient from "./pricing-client"
import ComparisonTable from "./comparison-table"

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
              Choose the plan that fits your learning journey. Start with Pro or commit to lifetime mastery.
            </p>

          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-10 border-b border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <div className="text-3xl font-bold text-white mb-2">14</div>
                <div className="text-sm text-[#7d8590]">day free trial</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white mb-2">Unlimited</div>
                <div className="text-sm text-[#7d8590]">characters to learn</div>
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

            <ComparisonTable />
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
                  <h4 className="text-lg font-semibold text-white">What happens after my 14-day free trial?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590]">
                    After your 14-day free trial ends, your account switches to Lite access. You can still review your existing cards and track progress, but you won't be able to add new characters or use AI features. To continue learning new characters and access all features, simply upgrade to Pro, Student Pro (with .edu verification), or Lifetime. No credit card is required for the trial, and there are no surprise charges.
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
                  <h4 className="text-lg font-semibold text-white">What are AI enrichment credits?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590] mb-4">
                    AI enrichment credits are only used for new vocabulary or characters that need fresh content and analysis. Danbing AI already has 5,000+ pre-enriched characters in its database with images, audio, and insights ready to use - these don't require any credits.
                  </p>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Credit allocations:</strong><br/>
                    • Student Pro & Pro: 2,000 credits/month (~50 new characters)<br/>
                    • Lifetime: 4,000 credits/month (~100 new characters)<br/>
                    • Team: 2,000 credits per user/month
                  </p>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Credit usage:</strong><br/>
                    • Each new character enrichment costs approximately 40 credits<br/>
                    • This includes AI analysis, image generation, and audio synthesis<br/>
                    • Looking up existing characters is always free
                  </p>
                  <p className="text-[#7d8590]">
                    <strong>Rollover & overflow:</strong><br/>
                    • Pro plans: Credits roll over for 2 months (max 4,000 banked)<br/>
                    • Lifetime: Credits roll over for 3 months (max 12,000 banked)<br/>
                    • Need more? Purchase additional credits at $4.99 per 1,000 credits<br/>
                    • Bulk packages available for teams and heavy users
                  </p>
                </div>
              </details>

              <details className="group">
                <summary className="flex justify-between items-center cursor-pointer list-none bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                  <h4 className="text-lg font-semibold text-white">What happens if I run out of credits?</h4>
                  <svg className="w-5 h-5 text-[#7d8590] group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="mt-4 px-6 pb-6">
                  <p className="text-[#7d8590]">
                    If you use all your monthly credits, you have several options:<br/>
                    • Use characters from our 5,000+ pre-enriched database (always free)<br/>
                    • Purchase additional credits at $4.99 per 1,000 credits (~25 characters)<br/>
                    • Wait for your credits to refresh at the start of your next billing cycle<br/>
                    • Check if you have rollover credits from previous months<br/><br/>
                    Most users never run out - 2,000 credits covers ~50 new characters per month, which aligns with typical learning pace for serious students.
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
                Start 14-Day Free Trial
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