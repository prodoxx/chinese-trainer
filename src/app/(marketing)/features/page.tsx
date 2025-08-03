import { Upload, Zap, BarChart3, Clock, Globe, Shield, Settings, ArrowRight, Brain, Play, RotateCcw, Timer, Sparkles, Target, CheckCircle, TrendingUp } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export const metadata = {
  title: "Features - Danbing AI Chinese Learning Platform | Advanced Flashcard System",
  description: "Discover Danbing's AI-powered features: smart flashcards, character insights, spaced repetition, and real-time analytics. Learn Chinese 10x faster with our science-based tools.",
  keywords: "Chinese learning features, AI flashcards, spaced repetition software, character insights, Taiwan Mandarin tools, language learning analytics, dual-phase learning system",
};

export default async function FeaturesPage() {
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
              AI-Powered Learning Platform
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Features that make
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">learning addictive</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Every feature is designed with one goal: help you master Chinese characters faster than any other method. Here's what makes Danbing different.
            </p>
          </div>
        </div>
      </section>

      {/* The Big Problem */}
      <section className="py-20 border-b border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Most Apps Get It Wrong</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                They throw flashcards at you and hope something sticks. We built something different.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">😴</div>
                <h3 className="text-xl font-bold text-white mb-2">Boring Flashcards</h3>
                <p className="text-[#7d8590]">
                  Traditional apps show character → meaning. That's it. No wonder 90% of learners quit.
                </p>
              </div>

              <div className="text-center">
                <div className="text-5xl mb-4">🤯</div>
                <h3 className="text-xl font-bold text-white mb-2">Information Overload</h3>
                <p className="text-[#7d8590]">
                  20+ characters per session? Your brain can't handle it. Science says 7±2 is optimal.
                </p>
              </div>

              <div className="text-center">
                <div className="text-5xl mb-4">📉</div>
                <h3 className="text-xl font-bold text-white mb-2">No Real Progress</h3>
                <p className="text-[#7d8590]">
                  Study for months, forget in weeks. Without proper review scheduling, you're wasting time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features - Reimagined */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">The Danbing Difference</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                We obsessed over every detail to create the perfect learning experience. Here's what we built.
              </p>
            </div>

            {/* Feature 1: AI Character Insights */}
            <div className="mb-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center mb-4 text-[#f7cc48] text-sm font-medium">
                    <Brain className="w-4 h-4 mr-2" />
                    MOST LOVED FEATURE
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                    AI Character Insights That Actually Help
                  </h3>
                  <p className="text-lg text-[#7d8590] mb-8">
                    Click any character to unlock deep analysis. Our AI explains everything: etymology, visual mnemonics, common mistakes, and personalized learning tips.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">Smart Etymology</p>
                        <p className="text-sm text-[#7d8590]">Understand how characters evolved from ancient pictographs</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">Visual Memory Aids</p>
                        <p className="text-sm text-[#7d8590]">AI creates stories and visual connections that stick</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">Confusion Detection</p>
                        <p className="text-sm text-[#7d8590]">See which characters you might mix up and why</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-[#7d8590]">
                    <TrendingUp className="w-4 h-4" />
                    Users spend 3x more time learning with character insights
                  </div>
                </div>

                <div>
                  <div className="bg-[#21262d] rounded-2xl p-8 border border-[#30363d]">
                    <div className="text-center mb-6">
                      <div className="text-6xl mb-4">愛</div>
                      <div className="text-2xl text-[#f7cc48] mb-2">ài</div>
                      <div className="text-lg text-[#7d8590]">love</div>
                    </div>
                    
                    <div className="space-y-4 text-sm">
                      <div className="bg-[#0d1117] rounded-lg p-4">
                        <p className="text-[#f7cc48] font-semibold mb-2">🏛️ Etymology</p>
                        <p className="text-[#7d8590]">Originally depicted a person looking back with reluctance, showing emotional attachment</p>
                      </div>
                      
                      <div className="bg-[#0d1117] rounded-lg p-4">
                        <p className="text-[#f7cc48] font-semibold mb-2">🧠 Memory Aid</p>
                        <p className="text-[#7d8590]">A person (人) with heart (心) in the middle shows love</p>
                      </div>
                      
                      <div className="bg-[#0d1117] rounded-lg p-4">
                        <p className="text-[#f7cc48] font-semibold mb-2">⚠️ Common Confusion</p>
                        <p className="text-[#7d8590]">Often confused with 受 (shòu) - similar structure</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Flash Session Science */}
            <div className="mb-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="order-2 lg:order-1">
                  <div className="bg-[#21262d] rounded-2xl p-8 border border-[#30363d]">
                    <h4 className="text-lg font-semibold text-white mb-6">Your 90-Second Session</h4>
                    
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#f7cc48] font-bold">1</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">See Character (2-4s)</p>
                          <p className="text-sm text-[#7d8590]">Visual cortex processes shape</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#f7cc48] font-bold">2</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">Multi-Modal Learning (3-5s)</p>
                          <p className="text-sm text-[#7d8590]">Audio + image + meaning together</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-[#f7cc48] font-bold">?</span>
                        </div>
                        <div>
                          <p className="text-white font-semibold">Mini-Quiz Every 3 Cards</p>
                          <p className="text-sm text-[#7d8590]">Active recall locks in memory</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                      <p className="text-sm text-green-400">Result: 85% retention vs 30% traditional</p>
                    </div>
                  </div>
                </div>

                <div className="order-1 lg:order-2">
                  <div className="inline-flex items-center mb-4 text-[#f7cc48] text-sm font-medium">
                    <Zap className="w-4 h-4 mr-2" />
                    SCIENCE-BASED
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                    Dual-Phase Flash Sessions
                  </h3>
                  <p className="text-lg text-[#7d8590] mb-8">
                    Based on 50+ research papers, our flash system uses optimal timing and multi-modal encoding to create memories that last forever.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#f7cc48] rounded-full mt-2"></div>
                      <div>
                        <p className="text-white">8 characters per session (Miller's Law)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#f7cc48] rounded-full mt-2"></div>
                      <div>
                        <p className="text-white">Dual coding for 2x stronger memories</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-[#f7cc48] rounded-full mt-2"></div>
                      <div>
                        <p className="text-white">Testing effect increases retention by 50%</p>
                      </div>
                    </div>
                  </div>

                  <Link href="/science" className="inline-flex items-center text-[#f7cc48] hover:text-[#f7cc48]/80 transition-colors">
                    Read the science behind it
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Feature 3: Smart Repetition */}
            <div className="mb-20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center mb-4 text-[#f7cc48] text-sm font-medium">
                    <Clock className="w-4 h-4 mr-2" />
                    NEVER FORGET
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                    Reviews That Actually Work
                  </h3>
                  <p className="text-lg text-[#7d8590] mb-8">
                    Our SM-2 algorithm schedules reviews at the perfect time. Characters you know well are reviewed less often. Difficult ones get more practice. It's personalized to your brain.
                  </p>
                  
                  <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                    <h4 className="text-white font-semibold mb-4">Your Review Schedule</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[#7d8590]">Learn</span>
                        <span className="text-white">Day 0</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#7d8590]">First review</span>
                        <span className="text-white">Day 1</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#7d8590]">Second review</span>
                        <span className="text-white">Day 6</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[#7d8590]">Then</span>
                        <span className="text-white">15 → 35 → 70 days...</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="bg-[#0d1117] rounded-2xl p-8">
                    <h4 className="text-lg font-semibold text-white mb-6">Live Dashboard Preview</h4>
                    
                    <div className="space-y-4">
                      <div className="bg-[#21262d] rounded-lg p-4 border border-[#30363d]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">HSK 3 Vocabulary</span>
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">8 due</span>
                        </div>
                        <div className="w-full bg-[#30363d] rounded-full h-2">
                          <div className="bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/60 h-2 rounded-full" style={{width: '73%'}}></div>
                        </div>
                        <p className="text-xs text-[#7d8590] mt-2">73% mastered • 85% retention</p>
                      </div>
                      
                      <div className="bg-[#21262d] rounded-lg p-4 border border-[#30363d]">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white font-semibold">Business Chinese</span>
                          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">3 due today</span>
                        </div>
                        <div className="w-full bg-[#30363d] rounded-full h-2">
                          <div className="bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/60 h-2 rounded-full" style={{width: '45%'}}></div>
                        </div>
                        <p className="text-xs text-[#7d8590] mt-2">45% mastered • 92% retention</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Power Features */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Power Features for Power Users</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                We sweated the details so you can focus on learning. Every feature has a purpose.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <BarChart3 className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Learning Analytics</h3>
                <p className="text-sm text-[#7d8590]">
                  Track accuracy, speed, retention. See confusion patterns. Know exactly where to focus.
                </p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Upload className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Bulk Import</h3>
                <p className="text-sm text-[#7d8590]">
                  Upload CSV files with hundreds of characters. AI enriches everything automatically.
                </p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Sparkles className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Auto-Enrichment</h3>
                <p className="text-sm text-[#7d8590]">
                  Pronunciation, images, meanings, mnemonics - all generated instantly by AI.
                </p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Globe className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Cross-Device Sync</h3>
                <p className="text-sm text-[#7d8590]">
                  Start on laptop, continue on phone. Everything syncs in real-time.
                </p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Target className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Taiwan Mandarin</h3>
                <p className="text-sm text-[#7d8590]">
                  Authentic pronunciation and usage. Built for Taiwan, not mainland China.
                </p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Shield className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
                <p className="text-sm text-[#7d8590]">
                  Your data is encrypted and never shared. No ads, no tracking, ever.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Modes */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Three Ways to Learn</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Different modes for different goals. All optimized for maximum retention.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-10 h-10 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Learn Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Your daily dose of new characters. 8 at a time, perfectly paced for your brain.
                  </p>
                  <div className="space-y-2 text-sm text-[#7d8590]">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Full dual-phase system</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Multi-modal encoding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>90 seconds total</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 rounded-lg relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold">CRITICAL</div>
                </div>
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <RotateCcw className="w-10 h-10 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Review Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    The secret sauce. Reviews scheduled by AI at the perfect time for your brain.
                  </p>
                  <div className="space-y-2 text-sm text-[#7d8590]">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>SM-2 algorithm</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Personalized timing</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Never skip these!</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Timer className="w-10 h-10 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Practice Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Extra practice when you need it. Great for exam prep or building confidence.
                  </p>
                  <div className="space-y-2 text-sm text-[#7d8590]">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Any characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>No limits</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Stress-free</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Control */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Learn at Your Own Pace</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Three speed settings designed for different experience levels. Start slow, speed up as you improve.
              </p>
            </div>

            <div className="bg-[#21262d] rounded-2xl p-8 border border-[#30363d] max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Fast</h3>
                  <div className="text-2xl font-bold text-green-400 mb-2">5.4s</div>
                  <p className="text-sm text-[#7d8590]">For review and familiar characters</p>
                </div>

                <div className="text-center relative">
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#f7cc48] text-black px-3 py-1 rounded-full text-xs font-semibold">BEST FOR MOST</div>
                  </div>
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Medium</h3>
                  <div className="text-2xl font-bold text-[#f7cc48] mb-2">7.6s</div>
                  <p className="text-sm text-[#7d8590]">Perfect balance of speed and retention</p>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Slow</h3>
                  <div className="text-2xl font-bold text-blue-400 mb-2">10s</div>
                  <p className="text-sm text-[#7d8590]">For beginners and complex characters</p>
                </div>
              </div>

              <div className="mt-8 p-4 bg-[#0d1117] rounded-lg">
                <p className="text-sm text-[#7d8590] text-center">
                  <span className="text-white">Pro tip:</span> Start with Medium. If you're getting confused, slow down. If you're bored, speed up.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Loved by Language Learners</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                See what our users are saying about Danbing's features.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#f7cc48]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#7d8590] mb-4">
                  "The character insights are incredible. I finally understand WHY characters look the way they do."
                </p>
                <p className="text-sm text-white">Sarah L.</p>
                <p className="text-xs text-[#7d8590]">HSK 4 Student</p>
              </div>

              <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#f7cc48]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#7d8590] mb-4">
                  "90-second sessions fit perfectly into my busy schedule. I'm actually making progress now!"
                </p>
                <p className="text-sm text-white">Michael T.</p>
                <p className="text-xs text-[#7d8590]">Business Professional</p>
              </div>

              <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-5 h-5 text-[#f7cc48]" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-[#7d8590] mb-4">
                  "Smart repetition actually works. I remember characters I learned months ago!"
                </p>
                <p className="text-sm text-white">Emma C.</p>
                <p className="text-xs text-[#7d8590]">University Student</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Experience the Future of Chinese Learning?</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              Join thousands of learners who've discovered a better way to master Chinese characters.
            </p>

            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-8 mb-8 max-w-md mx-auto">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[#7d8590]">Free account</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7d8590]">100 characters to start</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7d8590]">All features included</span>
                  <span className="text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#7d8590]">No credit card</span>
                  <span className="text-green-400">✓</span>
                </div>
              </div>
              
              <Link href="/auth/signup" className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mb-4">
                Start Learning Now
              </Link>
              
              <p className="text-sm text-[#7d8590]">
                Join 50,000+ active learners
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}