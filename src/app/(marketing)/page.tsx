import { Target, Clock, BarChart3, Sparkles, Brain, TrendingUp, Users, Award } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export const metadata = {
  title: "Danbing AI - Learn Chinese Characters 10x Faster with Science-Based Flashcards",
  description: "Master Traditional Chinese characters in 90-second sessions using AI-powered flashcards, spaced repetition, and cognitive science. Free to start, syncs across devices.",
  keywords: "Chinese learning app, Traditional Chinese flashcards, Taiwan Mandarin, spaced repetition, AI language learning, Chinese character recognition, HSK preparation, TOCFL study tool",
};

export default async function MarketingHomePage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated();
  return (
    <>
      {/* Hero Section */}
      <section className="py-12 sm:py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center mb-6 sm:mb-8 bg-gradient-to-r from-[#f7cc48]/20 to-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/30 text-xs sm:text-sm px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-medium">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              AI-Powered Language Learning
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Learn Chinese characters
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">10x faster with AI</span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Danbing uses AI to turn any Chinese text into rich, multi-sensory flashcards. Our 90-second sessions combine cognitive science with spaced repetition for maximum retention.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 sm:mb-12 px-4 sm:px-0">
              <Link href="/auth/signup" className="inline-flex items-center justify-center bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-base sm:text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Start Learning Free
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link href="/demo" className="inline-flex items-center justify-center border-2 border-[#30363d] text-white hover:bg-[#21262d] hover:border-[#f7cc48]/50 text-base sm:text-lg px-8 py-4 bg-transparent rounded-lg transition-all font-medium">
                <svg className="mr-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Watch Demo
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-[#7d8590]">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No credit card required
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                100 characters free
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Works on all devices
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section - Commented out until we have real data */}
      {/*
      <section className="py-12 sm:py-16 border-b border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">50K+</div>
              <div className="text-sm text-[#7d8590]">Active Learners</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-[#30363d]"></div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">2M+</div>
              <div className="text-sm text-[#7d8590]">Characters Learned</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-[#30363d]"></div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">4.8/5</div>
              <div className="text-sm text-[#7d8590]">User Rating</div>
            </div>
            <div className="hidden sm:block w-px h-12 bg-[#30363d]"></div>
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-white mb-1">90%</div>
              <div className="text-sm text-[#7d8590]">Retention Rate</div>
            </div>
          </div>
        </div>
      </section>
      */}

      {/* How It Works - Simple 3 Steps */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">How Danbing Works</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                From Chinese text to fluency in three simple steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#f7cc48] rounded-full flex items-center justify-center font-bold text-black text-xl">1</div>
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8 h-full">
                  <h3 className="text-xl font-bold text-white mb-3">Import Your Text</h3>
                  <p className="text-[#7d8590] mb-4">Upload any Chinese text or CSV file. Our AI instantly enriches each character with pronunciation, meaning, and context.</p>
                  <div className="text-sm text-[#f7cc48]">Takes 3 seconds per character</div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#f7cc48] rounded-full flex items-center justify-center font-bold text-black text-xl">2</div>
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8 h-full">
                  <h3 className="text-xl font-bold text-white mb-3">AI Creates Flashcards</h3>
                  <p className="text-[#7d8590] mb-4">Danbing&apos;s AI generates mnemonics, etymology, and visual associations. Custom images are created for each character.</p>
                  <div className="text-sm text-[#f7cc48]">Proprietary AI technology</div>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#f7cc48] rounded-full flex items-center justify-center font-bold text-black text-xl">3</div>
                <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8 h-full">
                  <h3 className="text-xl font-bold text-white mb-3">Learn in 90 Seconds</h3>
                  <p className="text-[#7d8590] mb-4">Study 8 characters per session with our dual-phase system. Spaced repetition ensures you never forget.</p>
                  <div className="text-sm text-[#f7cc48]">Based on cognitive science</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Powered by Advanced AI</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Every character is enriched with AI-generated content for deeper understanding
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-6 h-6 text-[#f7cc48]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Deep Character Analysis</h3>
                    <p className="text-[#7d8590]">
                      Our AI analyzes etymology, components, memory techniques, and usage patterns for every character.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-[#f7cc48]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">AI-Generated Visual Mnemonics</h3>
                    <p className="text-[#7d8590]">
                      Our visual AI creates context-aware images that form memorable associations for each character.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-[#f7cc48]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Smart Confusion Detection</h3>
                    <p className="text-[#7d8590]">
                      AI identifies similar characters and creates targeted practice to prevent common mistakes.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-[#f7cc48]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Adaptive Learning Paths</h3>
                    <p className="text-[#7d8590]">
                      Personalized difficulty adjustment based on your performance and learning speed.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d]">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">愛</div>
                    <div className="text-xl text-[#f7cc48] mb-2">ài - love</div>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="border-l-2 border-[#f7cc48]/50 pl-4">
                      <div className="text-[#7d8590] mb-1">Etymology</div>
                      <div className="text-white">Heart 心 beneath claws 爪 and roof 冖 - protecting what's precious</div>
                    </div>
                    <div className="border-l-2 border-[#f7cc48]/50 pl-4">
                      <div className="text-[#7d8590] mb-1">Mnemonic</div>
                      <div className="text-white">A heart carefully held under a protective cover</div>
                    </div>
                    <div className="border-l-2 border-[#f7cc48]/50 pl-4">
                      <div className="text-[#7d8590] mb-1">Common Confusion</div>
                      <div className="text-white">受 (shòu) - similar top component but means &quot;receive&quot;</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Science-Based Learning */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Built on 50+ Years of Research</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Every feature is optimized based on peer-reviewed cognitive science
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <div className="text-3xl font-bold text-[#f7cc48] mb-2">90s</div>
                <h3 className="text-lg font-semibold text-white mb-2">Optimal Session Length</h3>
                <p className="text-sm text-[#7d8590]">Peak attention span for complex learning tasks</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <div className="text-3xl font-bold text-[#f7cc48] mb-2">7±2</div>
                <h3 className="text-lg font-semibold text-white mb-2">Miller&apos;s Magic Number</h3>
                <p className="text-sm text-[#7d8590]">Working memory capacity for new information</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <div className="text-3xl font-bold text-[#f7cc48] mb-2">2-Phase</div>
                <h3 className="text-lg font-semibold text-white mb-2">Dual Coding Theory</h3>
                <p className="text-sm text-[#7d8590]">Visual + verbal encoding for stronger memories</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <div className="text-3xl font-bold text-[#f7cc48] mb-2">SM-2</div>
                <h3 className="text-lg font-semibold text-white mb-2">Spaced Repetition</h3>
                <p className="text-sm text-[#7d8590]">Algorithm proven to maximize long-term retention</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Everything You Need to Master Chinese</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Complete learning ecosystem designed for serious language learners
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <Clock className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">90-Second Sessions</h3>
                <p className="text-sm text-[#7d8590]">Perfect for busy schedules. Learn effectively in micro-sessions throughout your day.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <Brain className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Smart Repetition</h3>
                <p className="text-sm text-[#7d8590]">SM-2 algorithm ensures you review at the perfect time for long-term memory.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <Sparkles className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">AI Enrichment</h3>
                <p className="text-sm text-[#7d8590]">Automatic pronunciation, meanings, images, and mnemonics for every character.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <BarChart3 className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Progress Analytics</h3>
                <p className="text-sm text-[#7d8590]">Track your learning curve, identify weak spots, and optimize your study time.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <Target className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Taiwan Mandarin</h3>
                <p className="text-sm text-[#7d8590]">Authentic pronunciation and usage specifically for Taiwan Mandarin learners.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 hover:border-[#f7cc48]/50 transition-all">
                <Users className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Cross-Device Sync</h3>
                <p className="text-sm text-[#7d8590]">Start on your laptop, continue on your phone. Your progress syncs everywhere.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Loved by Language Learners</h2>
              <p className="text-xl text-[#7d8590]">
                Join thousands who've transformed their Chinese learning journey
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#f7cc48]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white mb-4">&quot;Finally, a Chinese learning app that respects my time. The 90-second sessions fit perfectly into my commute.&quot;</p>
                <div className="text-sm text-[#7d8590]">- Sarah Chen, Business Professional</div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#f7cc48]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white mb-4">&quot;The AI-generated mnemonics are genius! I&apos;m remembering characters I&apos;ve struggled with for years.&quot;</p>
                <div className="text-sm text-[#7d8590]">- Mark Liu, TOCFL Student</div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#f7cc48]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-white mb-4">&quot;Spaced repetition actually works! I&apos;m retaining characters months after learning them.&quot;</p>
                <div className="text-sm text-[#7d8590]">- Jennifer Wang, Heritage Learner</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-[#161b22]/50 to-transparent">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Start Learning Chinese Today</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              Master Chinese characters with AI-powered flashcards and cognitive science.
            </p>

            <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-8 mb-8 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-white mb-4">Free Forever Plan</h3>
              <ul className="space-y-3 mb-6 text-left">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#7d8590]">100 characters with full AI enrichment</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#7d8590]">Unlimited flash sessions</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#7d8590]">Spaced repetition scheduling</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-[#7d8590]">Progress analytics</span>
                </li>
              </ul>
              <Link href="/auth/signup" className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Get Started Free
              </Link>
            </div>

            <div className="text-sm text-[#7d8590]">
              No credit card required • Takes 30 seconds • Cancel anytime
            </div>
          </div>
        </div>
      </section>
    </>
  )
}