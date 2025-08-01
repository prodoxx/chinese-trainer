import { Target, Zap, Clock, BarChart3, Sparkles, Brain, Timer } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export default async function MarketingHomePage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated();
  return (
    <>
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center mb-6 sm:mb-8 bg-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/20 text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Cognitive Science Powered
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Master Chinese characters
              <br />
              <span className="text-[#f7cc48]">10x faster</span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-[#7d8590] mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Revolutionary dual-phase flash sessions based on 50+ years of memory research. Learn Traditional Chinese
              characters in just 90 seconds per session with our cloud-based system that syncs across all your devices
              and uses AI to automatically enrich your character decks.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-16 px-4 sm:px-0">
              <Link href="/auth/signup" className="inline-flex items-center justify-center bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-md transition-colors">
                Try Free Flash Session
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center border border-[#30363d] text-[#7d8590] hover:bg-[#21262d] hover:text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-transparent rounded-md transition-colors">
                Watch 90s Demo
              </Link>
            </div>

            <div className="text-center text-xs sm:text-sm text-[#7d8590] px-4 sm:px-0">
              ✓ No signup required for demo • ✓ Works offline after setup • ✓ Based on peer-reviewed research
            </div>
          </div>
        </div>
      </section>

      {/* Performance Stats */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Scientifically Optimized Learning</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Every timing decision is based on neuroscience research about how your brain processes information
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Timer className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">90s</div>
                  <div className="text-[#7d8590] mb-4">per learning session</div>
                  <div className="text-xs sm:text-sm text-[#7d8590]">Optimal attention span for maximum retention</div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Brain className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">7±2</div>
                  <div className="text-[#7d8590] mb-4">characters per session</div>
                  <div className="text-xs sm:text-sm text-[#7d8590]">Miller&apos;s Law: optimal working memory capacity</div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">85%</div>
                  <div className="text-[#7d8590] mb-4">retention after 1 week</div>
                  <div className="text-xs sm:text-sm text-[#7d8590]">With spaced repetition vs 10% without</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual-Phase System */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">The Dual-Phase Flash System</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Based on Paivio&apos;s Dual Coding Theory: information encoded both visually and verbally creates stronger,
                more retrievable memories
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="border-l-4 border-[#f7cc48] pl-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Phase 1: Visual Recognition</h3>
                  <p className="text-sm sm:text-base text-[#7d8590] mb-3 sm:mb-4">
                    Character appears alone for 2-4 seconds, allowing focused visual encoding without distraction.
                    Creates anticipation and primes the brain for meaning association.
                  </p>
                  <div className="text-xs sm:text-sm text-[#f7cc48]">
                    Based on Thorpe et al. (1996): Visual processing research
                  </div>
                </div>

                <div className="border-l-4 border-[#f7cc48]/60 pl-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Phase 2: Multi-Modal Integration</h3>
                  <p className="text-sm sm:text-base text-[#7d8590] mb-3 sm:mb-4">
                    Character + pinyin + image + meaning + audio presented simultaneously for 3-5 seconds. Creates
                    multiple memory pathways and reinforces all associations.
                  </p>
                  <div className="text-xs sm:text-sm text-[#f7cc48]">Based on Mayer&apos;s Multimedia Learning Principles</div>
                </div>

                <div className="border-l-4 border-[#f7cc48]/40 pl-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 sm:mb-3">Immediate Quiz</h3>
                  <p className="text-sm sm:text-base text-[#7d8590] mb-3 sm:mb-4">
                    Testing effect: Active retrieval strengthens memory more than passive review. Immediate feedback
                    with audio reinforcement.
                  </p>
                  <div className="text-xs sm:text-sm text-[#f7cc48]">Based on Roediger & Karpicke (2006): Testing Effect</div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d]">
                  <h3 className="text-xl font-semibold text-white mb-6 text-center">Session Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48] rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">3-2-1 Countdown</div>
                        <div className="text-[#7d8590] text-sm">Prepares attention and focus</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48]/80 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Phase 1: 愛 (2-4s)</div>
                        <div className="text-[#7d8590] text-sm">Visual recognition only</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48]/60 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Phase 2: 愛 + ài + ❤️ + &quot;love&quot; + 🔊 (3-5s)</div>
                        <div className="text-[#7d8590] text-sm">Multi-modal integration</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48]/40 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Quiz: Which means &quot;love&quot;?</div>
                        <div className="text-[#7d8590] text-sm">Active retrieval practice</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Presets */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Adaptive Speed Presets</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Choose your learning speed based on your experience level and the complexity of characters
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Fast</h3>
                  <div className="text-3xl font-bold text-green-400 mb-2">5.4s</div>
                  <div className="text-[#7d8590] mb-4">per character</div>
                  <div className="text-sm text-[#7d8590] space-y-1">
                    <div>• 2s visual + 3s integration</div>
                    <div>• For review sessions</div>
                    <div>• Familiar characters</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#f7cc48]/50 relative rounded-lg">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#f7cc48] text-black px-4 py-1 rounded-full text-sm font-semibold">Recommended</div>
                </div>
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Medium</h3>
                  <div className="text-3xl font-bold text-[#f7cc48] mb-2">7.6s</div>
                  <div className="text-[#7d8590] mb-4">per character</div>
                  <div className="text-sm text-[#7d8590] space-y-1">
                    <div>• 3s visual + 4s integration</div>
                    <div>• Optimal for most learners</div>
                    <div>• Balanced processing time</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 sm:p-8 text-center">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Slow</h3>
                  <div className="text-3xl font-bold text-blue-400 mb-2">10s</div>
                  <div className="text-[#7d8590] mb-4">per character</div>
                  <div className="text-sm text-[#7d8590] space-y-1">
                    <div>• 4s visual + 5s integration</div>
                    <div>• For beginners</div>
                    <div>• Complex characters</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">Why Danbing AI Works</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Every feature is designed around cognitive science principles for maximum learning efficiency
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              <div className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-[#f7cc48]" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">SM-2 Spaced Repetition</h3>
                <p className="text-sm sm:text-base text-[#7d8590]">
                  Scientifically-proven algorithm schedules reviews at optimal intervals. Never forget what you&apos;ve
                  learned.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-[#f7cc48]" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">AI Auto-Enrichment</h3>
                <p className="text-sm sm:text-base text-[#7d8590]">
                  Just import a CSV of characters. AI automatically generates images, audio, meanings, and mnemonics.
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="w-6 h-6 text-[#f7cc48]" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-white mb-2">Learning Analytics</h3>
                <p className="text-sm sm:text-base text-[#7d8590]">
                  Track memory strength, identify confusion patterns, and optimize your study sessions with detailed
                  analytics.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 sm:py-16 md:py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-medium text-[#7d8590] mb-8 uppercase tracking-wider">
              Trusted by learners worldwide
            </p>
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">10,000+</div>
                <div className="text-[#7d8590]">Characters learned daily</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">95%</div>
                <div className="text-[#7d8590]">Session completion rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-2">2.5min</div>
                <div className="text-[#7d8590]">Average session time</div>
              </div>
            </div>
            <div className="flex items-center justify-center space-x-12 opacity-60">
              <div className="text-[#7d8590] font-medium">Taiwan Universities</div>
              <div className="text-[#7d8590] font-medium">Language Schools</div>
              <div className="text-[#7d8590] font-medium">Self Learners</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to learn 10x faster?</h2>
          <p className="text-base sm:text-lg md:text-xl text-[#7d8590] mb-6 sm:mb-8 max-w-2xl mx-auto px-4 sm:px-0">
            Join thousands of learners using scientifically-proven methods to master Chinese characters in minutes, not
            hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-4 sm:mb-6 px-4 sm:px-0">
            <Link href="/auth/signup" className="inline-flex items-center justify-center bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 rounded-md transition-colors">
              Start Free Flash Session
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center border border-[#30363d] text-[#7d8590] hover:bg-[#21262d] hover:text-white text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 bg-transparent rounded-md transition-colors">
              View Pricing
            </Link>
          </div>

          <div className="text-xs sm:text-sm text-[#7d8590]">
            ✓ No credit card required • ✓ 100 characters free forever • ✓ Syncs across all devices
          </div>
        </div>
      </section>
    </>
  )
}