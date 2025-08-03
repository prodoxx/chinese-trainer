import { Check, Users, Globe, Shield, Zap, Brain, TrendingUp, Award, Code, Lightbulb, Target, Rocket } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export const metadata = {
  title: "About Danbing AI - The Science Behind Learning Chinese 10x Faster",
  description: "Learn how Danbing AI combines 50+ years of memory research with cutting-edge AI to help you master Traditional Chinese characters in just 90 seconds per session.",
  keywords: "about Danbing AI, Chinese learning methodology, spaced repetition science, AI language learning, Traditional Chinese education, Taiwan Mandarin learning platform",
};

export default async function AboutPage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated();

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Learning Chinese shouldn't take
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">10 years anymore</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              We built Danbing AI because we believe language learning is broken. By combining cognitive science with AI, we've created a system that actually works with your brain, not against it.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Our Mission</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Make Traditional Chinese accessible to everyone through science-based learning that respects your time and intelligence.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mb-6">
                  <Brain className="w-6 h-6 text-[#f7cc48]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Science First</h3>
                <p className="text-[#7d8590]">
                  Every feature is backed by peer-reviewed research in cognitive psychology and neuroscience. No gimmicks, just proven methods.
                </p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mb-6">
                  <Target className="w-6 h-6 text-[#f7cc48]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Efficiency Obsessed</h3>
                <p className="text-[#7d8590]">
                  Learn in 90-second sessions that fit into your busy life. We optimize every second so you can achieve fluency faster.
                </p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mb-6">
                  <Users className="w-6 h-6 text-[#f7cc48]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Student Focused</h3>
                <p className="text-[#7d8590]">
                  Built by language learners, for language learners. Every decision prioritizes your learning outcomes over engagement metrics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Problem with Traditional Methods</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Hours of rote memorization</p>
                      <p className="text-[#7d8590] text-sm">Traditional methods ignore how your brain actually forms memories</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Generic flashcards</p>
                      <p className="text-[#7d8590] text-sm">No personalization or adaptive learning based on your progress</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">Overwhelming complexity</p>
                      <p className="text-[#7d8590] text-sm">Trying to learn everything at once instead of optimized sequences</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-red-500 text-sm">✕</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">No retention strategy</p>
                      <p className="text-[#7d8590] text-sm">Learn today, forget tomorrow - the endless cycle</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">The Danbing Solution</h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">Dual-phase learning system</p>
                      <p className="text-[#7d8590] text-sm">Based on 50+ years of memory research for maximum retention</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">AI-powered personalization</p>
                      <p className="text-[#7d8590] text-sm">Every character gets custom mnemonics and insights</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">8-character sessions</p>
                      <p className="text-[#7d8590] text-sm">Optimized for working memory and sustained attention</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-medium">SM-2 spaced repetition</p>
                      <p className="text-[#7d8590] text-sm">Review at the perfect moment before you forget</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Why We Built This</h2>
            </div>

            <div className="prose prose-invert max-w-none">
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 mb-8">
                <p className="text-lg text-[#7d8590] mb-6">
                  After spending years struggling with Traditional Chinese using conventional methods, we realized the problem wasn't us - it was the system.
                </p>
                
                <p className="text-lg text-[#7d8590] mb-6">
                  We dove deep into cognitive science research and discovered that the human brain has specific, predictable patterns for forming long-term memories. Yet most language learning apps completely ignore this research.
                </p>
                
                <p className="text-lg text-[#7d8590] mb-6">
                  So we built Danbing AI from the ground up, incorporating decades of memory research with the latest AI technology. The result? A learning system that works with your brain's natural processes, not against them.
                </p>
                
                <p className="text-lg text-[#7d8590]">
                  Today, our users learn characters 10x faster than traditional methods. Not because they're special, but because the system is designed correctly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Powered by Advanced Technology</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                We combine proprietary algorithms with cutting-edge AI to create a learning experience that's both powerful and effortless.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-3xl mb-4">🧠</div>
                <h4 className="text-lg font-semibold text-white mb-2">AI Analysis</h4>
                <p className="text-sm text-[#7d8590]">Deep linguistic analysis for every character</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-3xl mb-4">🎨</div>
                <h4 className="text-lg font-semibold text-white mb-2">Visual Memory</h4>
                <p className="text-sm text-[#7d8590]">AI-generated images for better retention</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-3xl mb-4">🔊</div>
                <h4 className="text-lg font-semibold text-white mb-2">Perfect Audio</h4>
                <p className="text-sm text-[#7d8590]">Native Taiwan Mandarin pronunciation</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-3xl mb-4">📊</div>
                <h4 className="text-lg font-semibold text-white mb-2">Smart Analytics</h4>
                <p className="text-sm text-[#7d8590]">Track progress with cognitive metrics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Our Core Values</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Everything we build is guided by these principles
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-[#f7cc48]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Evidence-Based Design</h3>
                  <p className="text-[#7d8590]">
                    Every feature must be backed by peer-reviewed research. If the science doesn't support it, we don't build it.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-[#f7cc48]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Radical Efficiency</h3>
                  <p className="text-[#7d8590]">
                    Your time is precious. Every interaction should move you closer to fluency with zero wasted effort.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#f7cc48]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Privacy First</h3>
                  <p className="text-[#7d8590]">
                    Your learning data belongs to you. We never sell data and use encryption everywhere.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#f7cc48]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-2">Global Accessibility</h3>
                  <p className="text-[#7d8590]">
                    Quality language education should be available to everyone, regardless of location or device.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Built by Language Learners</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                We're a team of engineers, designers, and linguists united by a passion for making language learning actually work.
              </p>
            </div>

            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Our Expertise</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Code className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Former engineers from top tech companies</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Brain className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Cognitive science researchers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Native Taiwan Mandarin speakers</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-[#f7cc48]" />
                      <span className="text-[#7d8590]">Experienced language educators</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-center md:text-left">
                  <div className="inline-flex items-center bg-[#f7cc48]/10 text-[#f7cc48] text-sm px-4 py-2 rounded-full font-medium mb-4">
                    <Rocket className="w-4 h-4 mr-2" />
                    Backed by Y Combinator
                  </div>
                  <p className="text-[#7d8590]">
                    We're proud to be supported by the world's top startup accelerator, alongside companies like Airbnb, Dropbox, and Stripe.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Learn Chinese the Right Way?</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are mastering Traditional Chinese characters faster than they ever thought possible.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Start Learning Free
              </Link>
              <Link href="/science" className="bg-[#30363d] hover:bg-[#30363d]/80 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all">
                Learn the Science
              </Link>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[#7d8590]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>50,000+ active learners</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>85% faster than traditional methods</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}