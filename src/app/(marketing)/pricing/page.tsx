import { Check, X, Zap, Crown, Users, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center mb-8 bg-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/20 text-sm px-4 py-2 rounded-full">
              Simple Pricing
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
              Choose your
              <br />
              <span className="text-[#f7cc48]">learning plan</span>
            </h1>
            <p className="text-xl text-[#7d8590] mb-12 max-w-3xl mx-auto leading-relaxed">
              Start with a free account and upgrade when you're ready. All plans include cross-device sync and our core
              AI-powered learning system.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 bg-[#21262d]/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Free Plan */}
              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Zap className="w-8 h-8 text-[#f7cc48]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Free</h3>
                    <div className="text-4xl font-bold text-white mb-2">$0</div>
                    <div className="text-[#7d8590]">Forever</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Up to 100 characters</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">AI-powered enrichment</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Dual-phase flash system</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Spaced repetition (SM-2)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Basic analytics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Cross-device sync</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <X className="w-5 h-5 text-[#7d8590]" />
                      <span className="text-[#7d8590]">Advanced analytics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <X className="w-5 h-5 text-[#7d8590]" />
                      <span className="text-[#7d8590]">Custom mnemonics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <X className="w-5 h-5 text-[#7d8590]" />
                      <span className="text-[#7d8590]">Priority support</span>
                    </div>
                  </div>

                  <Link href="/auth/signup" className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium py-2 px-4 rounded-md text-center transition-colors cursor-pointer">
                    Get Started Free
                  </Link>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 border border-purple-500 relative rounded-lg">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">Most Popular</div>
                </div>
                <div className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-purple-600/30 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Crown className="w-8 h-8 text-purple-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Pro</h3>
                    <div className="text-4xl font-bold text-white mb-2">$9.99</div>
                    <div className="text-[#7d8590]">per month</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">Unlimited characters</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">Everything in Free</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">Advanced analytics dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">AI-generated mnemonics</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">Learning curve predictions</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">Custom session lengths</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">Export progress reports</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-green-400" />
                      <span className="text-[#7d8590]">Priority email support</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <X className="w-5 h-5 text-[#7d8590]" />
                      <span className="text-[#7d8590]">Team collaboration</span>
                    </div>
                  </div>

                  <Link href="/auth/signup?plan=pro" className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md text-center transition-colors cursor-pointer">
                    Start Pro Trial
                  </Link>
                  <div className="text-center text-sm text-[#7d8590] mt-2">14-day free trial</div>
                </div>
              </div>

              {/* Team Plan */}
              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-[#f7cc48]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Class</h3>
                    <div className="text-4xl font-bold text-white mb-2">$29.99</div>
                    <div className="text-[#7d8590]">per month</div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Up to 10 students</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Everything in Pro</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Shared deck libraries</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Student progress tracking</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Teacher dashboard</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Bulk deck management</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Class assignments</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">Priority support</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Check className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#e6edf3]">SLA guarantee</span>
                    </div>
                  </div>

                  <Link href="mailto:sales@danbing.ai?subject=Class%20Plan%20Inquiry" className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium py-2 px-4 rounded-md text-center transition-colors cursor-pointer">
                    Contact Sales
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-[#0d1117]">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <p className="text-xl text-[#7d8590]">
                Everything you need to know about Danbing AI pricing and features.
              </p>
            </div>

            <div className="space-y-8">
              <div className="bg-[#21262d] border border-[#30363d] cursor-pointer rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Is the free plan really free forever?</h4>
                  <p className="text-[#7d8590]">
                    Yes! Our free plan includes all core features with a limit of 100 characters. This is perfect for
                    beginners or casual learners who want to try our system.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] cursor-pointer rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Can I cancel my subscription anytime?</h4>
                  <p className="text-[#7d8590]">
                    Absolutely. You can cancel your subscription at any time from your account settings. Your data will
                    remain accessible, but you'll be limited to free plan features after cancellation.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] cursor-pointer rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Do you offer student discounts?</h4>
                  <p className="text-[#7d8590]">
                    Yes! Students with valid .edu email addresses receive 50% off Pro plans. Contact our support team
                    with your student ID for verification.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] cursor-pointer rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-3">What happens to my data if I downgrade?</h4>
                  <p className="text-[#7d8590]">
                    Your learning progress and character data are always preserved. If you exceed the free plan's
                    100-character limit, you'll still have access to all your data but won't be able to add new
                    characters until you upgrade again.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] cursor-pointer rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Is there a mobile app?</h4>
                  <p className="text-[#7d8590]">
                    Danbing AI is a web-based application that works perfectly on mobile browsers. We're considering
                    native mobile apps for the future based on user demand.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] cursor-pointer rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-3">Do you offer enterprise plans?</h4>
                  <p className="text-[#7d8590]">
                    Yes! For organizations with more than 10 users, we offer custom enterprise plans with additional
                    features like SSO, advanced reporting, and dedicated support. Contact our sales team for details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/50 to-purple-900/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
            Join thousands of learners who have transformed their Chinese character mastery with Danbing AI.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black text-lg px-8 py-4 rounded-md font-medium transition-colors cursor-pointer">
              Start Free Today
            </Link>
            <Link href="/auth/signup?plan=pro" className="inline-flex items-center justify-center border border-[#7d8590] text-[#7d8590] hover:bg-[#21262d] text-lg px-8 py-4 bg-transparent rounded-md font-medium transition-colors cursor-pointer">
              Try Pro Free for 14 Days
            </Link>
          </div>

          <div className="mt-6 text-sm text-[#7d8590]">
            Free account signup • Cancel anytime • Cross-device sync included
          </div>
        </div>
      </section>
    </>
  )
}