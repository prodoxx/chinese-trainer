"use client"

import { useState } from "react"
import { Check, X, Zap, Crown, Users, ArrowRight, Sparkles, TrendingUp, Shield, Globe, CheckCircle, Star } from "lucide-react"
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
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className="bg-[#21262d] border border-[#30363d] rounded-2xl hover:border-[#30363d]/80 transition-all">
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Free</h3>
              <div className="text-5xl font-bold text-white mb-2">$0</div>
              <div className="text-[#7d8590]">Forever free</div>
              <div className="mt-4 text-sm text-[#7d8590]">Perfect for trying Danbing</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">100 characters</p>
                  <p className="text-xs text-[#7d8590]">Enough for basic conversations</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">AI enrichment</p>
                  <p className="text-xs text-[#7d8590]">Auto-generated images & audio</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">Dual-phase flash system</p>
                  <p className="text-xs text-[#7d8590]">Science-based learning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">Smart repetition</p>
                  <p className="text-xs text-[#7d8590]">SM-2 algorithm included</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">Cross-device sync</p>
                  <p className="text-xs text-[#7d8590]">Learn anywhere</p>
                </div>
              </div>
            </div>

            <Link href="/auth/signup" className="block w-full bg-[#30363d] hover:bg-[#30363d]/80 text-white font-semibold py-3 px-6 rounded-lg transition-all text-center">
              Start Free
            </Link>
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
                  <p className="text-white font-semibold">Everything in Free</p>
                  <p className="text-xs text-[#7d8590]">Plus premium features</p>
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
                  <p className="text-white font-semibold">Priority support</p>
                  <p className="text-xs text-[#7d8590]">Get help when you need it</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white font-semibold">Export progress</p>
                  <p className="text-xs text-[#7d8590]">PDF reports & certificates</p>
                </div>
              </div>
            </div>

            <Link 
              href={`/auth/signup?plan=pro-${billingPeriod}`} 
              className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl text-center mb-3"
            >
              Start 7-Day Free Trial
            </Link>
            <p className="text-xs text-center text-[#7d8590]">No credit card required</p>
          </div>
        </div>

        {/* Team Plan */}
        <div className="bg-[#21262d] border border-[#30363d] rounded-2xl hover:border-[#30363d]/80 transition-all">
          <div className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Team</h3>
              <div className="text-5xl font-bold text-white mb-2">Custom</div>
              <div className="text-[#7d8590]">Volume pricing</div>
              <div className="mt-4 text-sm text-[#7d8590]">For schools and organizations</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">10+ users</p>
                  <p className="text-xs text-[#7d8590]">Volume discounts available</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">Everything in Pro</p>
                  <p className="text-xs text-[#7d8590]">For every team member</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">Admin dashboard</p>
                  <p className="text-xs text-[#7d8590]">Track student progress</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">Shared decks</p>
                  <p className="text-xs text-[#7d8590]">Distribute content easily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-white">Dedicated support</p>
                  <p className="text-xs text-[#7d8590]">Direct line to our team</p>
                </div>
              </div>
            </div>

            <Link href="mailto:team@danbing.ai?subject=Team%20Plan%20Inquiry" className="block w-full bg-[#30363d] hover:bg-[#30363d]/80 text-white font-semibold py-3 px-6 rounded-lg transition-all text-center">
              Contact Sales
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}