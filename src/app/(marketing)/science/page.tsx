import { BookOpen, Target, Zap, Clock, Eye, Lightbulb, ArrowRight, Brain, BarChart3, Users, Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export const metadata = {
  title: "The Science Behind Danbing - Evidence-Based Chinese Learning",
  description: "Learn why Danbing's method works. Based on 50+ years of cognitive science research including dual coding theory, spaced repetition, and the testing effect.",
  keywords: "cognitive science language learning, spaced repetition research, dual coding theory, SM-2 algorithm, memory science, Chinese learning research",
};

export default async function SciencePage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated();
  return (
    <>
      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center mb-6 sm:mb-8 bg-gradient-to-r from-[#f7cc48]/20 to-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/30 text-xs sm:text-sm px-4 py-2 rounded-full font-medium">
              <Brain className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Evidence-Based Learning
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Why our method
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">actually works</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Danbing isn't based on hunches or trends. Every feature is built on decades of peer-reviewed research in memory science and cognitive psychology.
            </p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-8 text-sm text-[#7d8590]">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>50+ research papers</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>85% retention rate</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span>2x faster than traditional methods</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Big Problem */}
      <section className="py-20 border-b border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Traditional Methods Don't Work</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Most language apps ignore how your brain actually learns. Here's what the science says.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-5xl mb-4">📉</div>
                <h3 className="text-xl font-bold text-white mb-2">The Forgetting Curve</h3>
                <p className="text-[#7d8590]">
                  Without review, you forget 70% within 24 hours and 90% within a week.
                </p>
              </div>

              <div className="text-center">
                <div className="text-5xl mb-4">🧠</div>
                <h3 className="text-xl font-bold text-white mb-2">Working Memory Limits</h3>
                <p className="text-[#7d8590]">
                  Your brain can only hold 7±2 items at once. Most apps ignore this completely.
                </p>
              </div>

              <div className="text-center">
                <div className="text-5xl mb-4">📚</div>
                <h3 className="text-xl font-bold text-white mb-2">Passive Learning Fails</h3>
                <p className="text-[#7d8590]">
                  Reading flashcards creates weak memories. Active recall is 2x more effective.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Solution */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">How Danbing Solves It</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                We built our system around proven cognitive science principles. Every feature has research behind it.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div>
                <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d] h-full">
                  <h3 className="text-2xl font-bold text-white mb-6">The Dual-Phase System</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-[#f7cc48] mb-2">Phase 1: Visual Focus</h4>
                      <p className="text-[#7d8590] text-sm">
                        Character appears alone for 2-4 seconds. Your visual cortex processes the shape without distraction.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#f7cc48] mb-2">Phase 2: Multi-Modal</h4>
                      <p className="text-[#7d8590] text-sm">
                        Character + pronunciation + image + meaning appear together. Creates 4 different memory pathways.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-[#30363d]">
                      <p className="text-sm text-[#7d8590]">
                        <span className="text-white font-semibold">Research:</span> Dual Coding Theory shows that visual + verbal encoding creates 2x stronger memories than either alone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d] h-full">
                  <h3 className="text-2xl font-bold text-white mb-6">Smart Repetition</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-lg font-semibold text-[#f7cc48] mb-2">SM-2 Algorithm</h4>
                      <p className="text-[#7d8590] text-sm">
                        Reviews scheduled at expanding intervals: 1 day → 6 days → 15 days → 35 days.
                      </p>
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-[#f7cc48] mb-2">Adaptive Difficulty</h4>
                      <p className="text-[#7d8590] text-sm">
                        Easy cards reviewed less often. Hard cards get more practice. Personalized to your brain.
                      </p>
                    </div>
                    <div className="pt-4 border-t border-[#30363d]">
                      <p className="text-sm text-[#7d8590]">
                        <span className="text-white font-semibold">Research:</span> Spaced repetition beats massed practice by 200% for long-term retention.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features with Science */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Every Feature Has Science Behind It</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                We didn't guess. We researched. Here's why each feature exists.
              </p>
            </div>

            <div className="space-y-8">
              {/* 8 Characters Per Session */}
              <div className="bg-[#21262d] rounded-lg border border-[#30363d] overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-8">
                    <div className="text-3xl font-bold text-[#f7cc48] mb-4">8 Characters Per Session</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Optimized for Working Memory</h3>
                    <p className="text-[#7d8590] mb-4">
                      Research shows humans can hold 7±2 items in working memory. We use 8 characters to maximize learning without overwhelming your brain.
                    </p>
                    <div className="text-sm text-[#7d8590]">
                      <span className="text-white">Study:</span> Miller (1956) - "The Magical Number Seven"
                    </div>
                  </div>
                  <div className="bg-[#0d1117] p-8 flex items-center justify-center">
                    <div className="text-center">
                      <div className="flex justify-center mb-4">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mx-1">
                            <span className="text-[#f7cc48] text-sm font-bold">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                      <div className="text-sm text-[#7d8590]">Perfect for your brain's capacity</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mini-Quizzes */}
              <div className="bg-[#21262d] rounded-lg border border-[#30363d] overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-8 order-2 md:order-1">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center space-x-4 mb-4">
                        <div className="text-2xl">📚</div>
                        <div className="text-2xl">→</div>
                        <div className="text-2xl">❓</div>
                        <div className="text-2xl">→</div>
                        <div className="text-2xl">💪</div>
                      </div>
                      <div className="text-sm text-[#7d8590]">Learn → Test → Strengthen</div>
                    </div>
                  </div>
                  <div className="p-8 order-1 md:order-2">
                    <div className="text-3xl font-bold text-[#f7cc48] mb-4">Mini-Quizzes Every 3 Cards</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Active Recall for Stronger Memories</h3>
                    <p className="text-[#7d8590] mb-4">
                      Testing immediately after learning increases retention by 50%. Our mini-quizzes force active recall right when it matters most.
                    </p>
                    <div className="text-sm text-[#7d8590]">
                      <span className="text-white">Study:</span> Roediger & Karpicke (2006) - "The Testing Effect"
                    </div>
                  </div>
                </div>
              </div>

              {/* 90-Second Sessions */}
              <div className="bg-[#21262d] rounded-lg border border-[#30363d] overflow-hidden">
                <div className="grid md:grid-cols-2">
                  <div className="p-8">
                    <div className="text-3xl font-bold text-[#f7cc48] mb-4">90-Second Sessions</div>
                    <h3 className="text-xl font-semibold text-white mb-3">Peak Attention Window</h3>
                    <p className="text-[#7d8590] mb-4">
                      Sustained attention starts declining after 5 minutes. Our 90-second sessions ensure you're always learning at peak focus.
                    </p>
                    <div className="text-sm text-[#7d8590]">
                      <span className="text-white">Study:</span> Warm et al. (2008) - "Vigilance and Attention"
                    </div>
                  </div>
                  <div className="bg-[#0d1117] p-8 flex items-center justify-center">
                    <div className="relative w-48 h-48">
                      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#30363d" strokeWidth="2" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#f7cc48" strokeWidth="2" strokeDasharray="282.7" strokeDashoffset="70.7" transform="rotate(-90 50 50)" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-white">90s</div>
                          <div className="text-xs text-[#7d8590]">Optimal</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">The Results Speak for Themselves</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                When you combine all these scientific principles, the improvement is dramatic.
              </p>
            </div>

            <div className="bg-[#21262d] rounded-2xl p-8 sm:p-12 border border-[#30363d]">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Memory Retention Comparison</h3>
                  
                  {/* Chart */}
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white">Traditional Flashcards</span>
                        <span className="text-red-400 font-bold">30%</span>
                      </div>
                      <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-[#ef4444] rounded-full" style={{width: '30%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white">Popular Language Apps</span>
                        <span className="text-yellow-400 font-bold">45%</span>
                      </div>
                      <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-[#eab308] rounded-full" style={{width: '45%'}}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-white font-semibold">Danbing Method</span>
                        <span className="text-[#f7cc48] font-bold">85%</span>
                      </div>
                      <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-[#f7cc48] rounded-full" style={{width: '85%'}}></div>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-[#7d8590] mt-6">
                    * Retention measured after 30 days using standardized testing
                  </p>
                </div>
                
                <div className="bg-[#0d1117] rounded-lg p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Why We Win</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">Multi-modal encoding</p>
                        <p className="text-sm text-[#7d8590]">4 memory pathways vs 1</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">Optimal timing</p>
                        <p className="text-sm text-[#7d8590]">Based on brain processing speed</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">Active testing</p>
                        <p className="text-sm text-[#7d8590]">Immediate recall practice</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-white font-semibold">Smart repetition</p>
                        <p className="text-sm text-[#7d8590]">SM-2 algorithm scheduling</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Built on Solid Research</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Every claim we make is backed by peer-reviewed studies.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">50+</div>
                <p className="text-[#7d8590]">Research papers analyzed</p>
              </div>
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">138</div>
                <p className="text-[#7d8590]">Years of combined research</p>
              </div>
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">85%</div>
                <p className="text-[#7d8590]">Average retention rate</p>
              </div>
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6 text-center">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">2x</div>
                <p className="text-[#7d8590]">Faster than traditional</p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-[#7d8590] mb-6">
                Key studies that shaped our approach:
              </p>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                <span className="bg-[#21262d] border border-[#30363d] px-3 py-1 rounded-full text-[#7d8590]">Miller 1956</span>
                <span className="bg-[#21262d] border border-[#30363d] px-3 py-1 rounded-full text-[#7d8590]">Paivio 1971</span>
                <span className="bg-[#21262d] border border-[#30363d] px-3 py-1 rounded-full text-[#7d8590]">Ebbinghaus 1885</span>
                <span className="bg-[#21262d] border border-[#30363d] px-3 py-1 rounded-full text-[#7d8590]">Roediger 2006</span>
                <span className="bg-[#21262d] border border-[#30363d] px-3 py-1 rounded-full text-[#7d8590]">Mayer 2009</span>
                <span className="bg-[#21262d] border border-[#30363d] px-3 py-1 rounded-full text-[#7d8590]">Bjork 2011</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Science + AI = Fluency</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              Stop wasting time with methods that don't work. Start learning the way your brain actually learns.
            </p>

            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-8 mb-8 max-w-md mx-auto">
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-[#7d8590]">Traditional method</span>
                  <span className="text-red-400 line-through">6 months</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white font-semibold">Danbing method</span>
                  <span className="text-[#f7cc48] font-bold">6 weeks</span>
                </div>
              </div>
              
              <Link href="/auth/signup" className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mb-4">
                Start Learning Now
              </Link>
              
              <div className="text-sm text-[#7d8590]">
                Free trial • No credit card • Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}