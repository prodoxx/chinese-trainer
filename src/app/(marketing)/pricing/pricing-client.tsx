"use client"

import { useState } from "react"
import { CheckCircle, GraduationCap, Trophy, Zap, Users, Crown, Info } from "lucide-react"
import Link from "next/link"

export default function PricingClient() {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual')

  return (
    <>
      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-lg font-medium ${billingPeriod === 'monthly' ? 'text-white' : 'text-[#7d8590]'}`}>Monthly</span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
          className="relative inline-flex h-8 w-14 items-center rounded-full bg-[#30363d] transition-colors hover:bg-[#30363d]/80"
          aria-label="Toggle billing period"
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-[#f7cc48] transition-transform ${
              billingPeriod === 'annual' ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
        <span className={`text-lg font-medium ${billingPeriod === 'annual' ? 'text-white' : 'text-[#7d8590]'}`}>
          Annual
          {billingPeriod === 'annual' && <span className="ml-2 text-sm text-green-400">Save 20%</span>}
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid lg:grid-cols-3 gap-6 max-w-6xl mx-auto">

        {/* Student Pro Plan */}
        <div className="bg-[#21262d] border border-[#30363d] rounded-2xl hover:border-[#30363d]/80 transition-all">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-[#f7cc48]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Student Pro</h3>
              <div className="mb-2">
                <div className="text-5xl font-bold text-white">
                  ${billingPeriod === 'annual' ? '8.25' : '9'}
                  <span className="text-2xl font-normal text-[#7d8590]">/mo</span>
                </div>
                {billingPeriod === 'annual' && (
                  <div className="text-sm text-[#7d8590] line-through">$9/mo</div>
                )}
              </div>
              <div className="text-[#f7cc48]">
                {billingPeriod === 'annual' ? 'Billed $99 annually' : 'Billed monthly'}
              </div>
              <div className="mt-4 text-sm text-[#7d8590]">Full Pro features for students</div>
              <div className="mt-2 inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-400/10 px-3 py-1 rounded-full">
                <Info className="w-3 h-3" />
                Student verification required
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Everything in Pro</p>
                  <p className="text-xs text-[#7d8590]">Same unlimited features</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Academic email required</p>
                  <p className="text-xs text-[#7d8590]">.edu email verification</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">40% discount</p>
                  <p className="text-xs text-[#7d8590]">Support your studies</p>
                </div>
              </div>
            </div>

            <Link 
              href={`/auth/signup?plan=student-${billingPeriod}`} 
              className="block w-full bg-[#30363d] hover:bg-[#30363d]/80 text-white font-semibold py-3 px-6 rounded-lg transition-all text-center mb-3"
            >
              Verify Student Status
            </Link>
            <p className="text-xs text-center text-[#7d8590]">14-day free trial included</p>
          </div>
        </div>

        {/* Pro Plan */}
        <div className="bg-[#21262d] border-2 border-[#f7cc48] rounded-2xl relative transform lg:scale-105 hover:scale-105 transition-transform">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-[#f7cc48] text-black px-4 py-1 rounded-full text-sm font-semibold">MOST POPULAR</div>
          </div>
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Pro</h3>
              <div className="mb-2">
                <div className="text-5xl font-bold text-white">
                  ${billingPeriod === 'annual' ? '14' : '17.50'}
                  <span className="text-2xl font-normal text-[#7d8590]">/mo</span>
                </div>
                {billingPeriod === 'annual' && (
                  <div className="text-sm text-[#7d8590] line-through">$17.50/mo</div>
                )}
              </div>
              <div className="text-[#f7cc48]">
                {billingPeriod === 'annual' ? 'Billed $168 annually' : 'Billed monthly'}
              </div>
              <div className="mt-4 text-sm text-[#7d8590]">Everything you need to master Chinese</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Unlimited characters</p>
                  <p className="text-xs text-[#7d8590]">Learn as much as you want</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">2,000 AI credits/month</p>
                  <p className="text-xs text-[#7d8590]">~50 new characters (5,000+ pre-enriched)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Dual-phase flash system</p>
                  <p className="text-xs text-[#7d8590]">Science-based learning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Smart repetition</p>
                  <p className="text-xs text-[#7d8590]">SM-2 algorithm included</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Character insights</p>
                  <p className="text-xs text-[#7d8590]">Deep AI analysis & etymology</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Advanced analytics</p>
                  <p className="text-xs text-[#7d8590]">Track progress in detail</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">2-month credit rollover</p>
                  <p className="text-xs text-[#7d8590]">Bank up to 4,000 credits</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Priority support</p>
                  <p className="text-xs text-[#7d8590]">Get help when you need it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Export progress <span className="text-xs text-blue-400">(Coming Soon)</span></p>
                  <p className="text-xs text-[#7d8590]">PDF reports & certificates</p>
                </div>
              </div>
            </div>

            <Link 
              href={`/auth/signup?plan=pro-${billingPeriod}`} 
              className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold py-4 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center mb-3 text-lg"
            >
              Start 14-Day Free Trial
            </Link>
            <p className="text-xs text-center text-[#7d8590]">No credit card required</p>
          </div>
        </div>

        {/* Lifetime Plan */}
        <div className="bg-[#21262d] border border-[#30363d] rounded-2xl hover:border-[#30363d]/80 transition-all relative">
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">BEST VALUE</div>
          </div>
          <div className="absolute top-4 right-4">
            <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-semibold border border-red-500/30">LIMITED TIME</div>
          </div>
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <Trophy className="w-8 h-8 text-[#f7cc48]" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Lifetime</h3>
              <p className="text-sm text-purple-400 mb-4 font-semibold">For serious learners only</p>
              <div className="text-5xl font-bold text-white mb-2">$499</div>
              <div className="text-[#7d8590]">One-time payment</div>
              <div className="mt-2 text-sm text-green-400 font-semibold">Pays for itself in under 3 years</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Lifetime-exclusive decks</p>
                  <p className="text-xs text-[#7d8590]">Quarterly content drops</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">4,000 AI credits/month</p>
                  <p className="text-xs text-[#7d8590]">~100 new characters (2x Pro allocation)</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Early access forever</p>
                  <p className="text-xs text-[#7d8590]">All new features first</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Annual mastery challenge</p>
                  <p className="text-xs text-[#7d8590]">Recognition badge</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">VIP profile status</p>
                  <p className="text-xs text-[#7d8590]">Stand out in community</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">3-month credit rollover</p>
                  <p className="text-xs text-[#7d8590]">Bank up to 12,000 credits</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Exclusive community</p>
                  <p className="text-xs text-[#7d8590]">Lifetime-only forum</p>
                </div>
              </div>
            </div>

            <Link href="/auth/signup?plan=lifetime" className="block w-full bg-[#30363d] hover:bg-[#30363d]/80 text-white font-semibold py-3 px-6 rounded-lg transition-all text-center">
              Get Lifetime Access
            </Link>
          </div>
        </div>
      </div>

      {/* Credit Add-ons Info */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 px-4 py-2 rounded-full text-sm">
          <Zap className="w-4 h-4" />
          <span>Need more credits? Purchase additional at <strong>$4.99 per 1,000 credits</strong> (~25 characters) anytime</span>
        </div>
      </div>

      {/* Team Plan - Available on Request */}
      <div className="mt-16">
        <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-8 max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">Team Plan</h3>
            <div className="text-3xl font-bold text-[#f7cc48] mb-2">Starting at $9/user/month</div>
            <p className="text-lg text-[#7d8590] mb-2">
              For schools, private tutor groups, and organizations
            </p>
            <p className="text-sm text-green-400">
              Volume discounts available for 20+ users
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-3xl mx-auto">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">10+ users</p>
                  <p className="text-sm text-[#7d8590]">Volume discounts available</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Everything in Pro</p>
                  <p className="text-sm text-[#7d8590]">For every team member</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Admin dashboard</p>
                  <p className="text-sm text-[#7d8590]">Track student progress</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Shared decks</p>
                  <p className="text-sm text-[#7d8590]">Distribute content easily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Custom onboarding</p>
                  <p className="text-sm text-[#7d8590]">Tailored setup for your needs</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Dedicated support</p>
                  <p className="text-sm text-[#7d8590]">Direct line to our team</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="mailto:team@danbing.ai?subject=Team%20Plan%20Inquiry" className="inline-block bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold py-3 px-8 rounded-lg transition-all">
              Contact Us for Pricing
            </Link>
            <p className="text-sm text-[#7d8590] mt-3">We'll create a custom plan that fits your needs</p>
          </div>
        </div>
      </div>
    </>
  )
}