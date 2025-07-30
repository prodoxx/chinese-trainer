import { Target, Zap, Clock, Play, Pause, RotateCcw, ArrowRight, Brain } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export default async function HowItWorksPage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated();
  return (
    <>
      {/* Hero Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center mb-8 bg-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/20 text-sm px-4 py-2 rounded-full">
              <Brain className="w-4 h-4 mr-2" />
              Cognitive Science System
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
              How the dual-phase
              <br />
              <span className="text-[#f7cc48]">flash system works</span>
            </h1>
            <p className="text-xl text-[#7d8590] mb-12 max-w-3xl mx-auto leading-relaxed">
              Our scientifically-designed cloud system separates visual recognition from semantic processing, creating
              stronger memory traces through dual coding theory and optimal timing based on neuroscience research. Learn
              on any device with automatic sync.
            </p>
          </div>
        </div>
      </section>

      {/* Flash Session Overview */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">The 90-Second Flash Session</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Each session takes you through 7 characters (optimal working memory capacity) using a
                scientifically-designed dual-phase presentation with immediate quiz feedback.
              </p>
            </div>

            {/* Session Timeline */}
            <div className="relative mb-16">
              <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-[#f7cc48] via-[#f7cc48]/60 to-[#f7cc48]/30 rounded-full"></div>

              <div className="space-y-16">
                {/* Phase 1 */}
                <div className="flex items-center">
                  <div className="w-1/2 pr-8 text-right">
                    <div className="bg-[#21262d] border border-[#f7cc48]/50 rounded-lg">
                      <div className="p-6">
                        <div className="flex items-center justify-end space-x-3 mb-4">
                          <h3 className="text-2xl font-bold text-white">Phase 1: Visual Recognition</h3>
                          <Target className="w-8 h-8 text-[#f7cc48]" />
                        </div>
                        <p className="text-[#7d8590] mb-4">
                          Character appears alone for 2-4 seconds, allowing focused visual encoding without distraction.
                          Creates anticipation and primes the brain for meaning association.
                        </p>
                        <div className="text-sm text-[#f7cc48] font-mono">
                          Based on Thorpe et al. (1996) visual processing research
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#f7cc48] rounded-full flex items-center justify-center relative z-10">
                    <span className="text-black font-bold">1</span>
                  </div>
                  <div className="w-1/2 pl-8">
                    <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                      <div className="text-center">
                        <div className="text-6xl mb-2">愛</div>
                        <div className="text-sm text-[#7d8590] space-y-1">
                          <div>Character only (2-4s)</div>
                          <div>↓ Blank screen (200-500ms)</div>
                          <div className="text-[#f7cc48]">Focused visual encoding</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phase 2 */}
                <div className="flex items-center">
                  <div className="w-1/2 pr-8">
                    <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                      <div className="text-center">
                        <div className="text-4xl mb-2">愛 + ài + ❤️ + "love" + 🔊</div>
                        <div className="text-sm text-[#7d8590] space-y-1">
                          <div>All information (3-5s)</div>
                          <div>↓ Blank screen (200-500ms)</div>
                          <div className="text-[#f7cc48]">Multi-modal integration</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#f7cc48] rounded-full flex items-center justify-center relative z-10">
                    <span className="text-black font-bold">2</span>
                  </div>
                  <div className="w-1/2 pl-8 text-left">
                    <div className="bg-[#21262d] border border-[#f7cc48]/50 rounded-lg">
                      <div className="p-6">
                        <div className="flex items-center space-x-3 mb-4">
                          <Zap className="w-8 h-8 text-[#f7cc48]" />
                          <h3 className="text-2xl font-bold text-white">Phase 2: Multi-Modal Integration</h3>
                        </div>
                        <p className="text-[#7d8590] mb-4">
                          Character + pinyin + image + meaning + audio presented simultaneously. Creates multiple memory
                          pathways and reinforces all associations.
                        </p>
                        <div className="text-sm text-[#f7cc48] font-mono">Based on Paivio's Dual Coding Theory</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quiz Phase */}
                <div className="flex items-center">
                  <div className="w-1/2 pr-8 text-right">
                    <div className="bg-[#21262d] border border-[#f7cc48]/50 rounded-lg">
                      <div className="p-6">
                        <div className="flex items-center justify-end space-x-3 mb-4">
                          <h3 className="text-2xl font-bold text-white">Immediate Quiz</h3>
                          <Clock className="w-8 h-8 text-[#f7cc48]" />
                        </div>
                        <p className="text-[#7d8590] mb-4">
                          Testing effect: Active retrieval strengthens memory more than passive review. Immediate
                          feedback with audio reinforcement.
                        </p>
                        <div className="text-sm text-[#f7cc48] font-mono">Based on Roediger & Karpicke (2006)</div>
                      </div>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-[#f7cc48] rounded-full flex items-center justify-center relative z-10">
                    <span className="text-black font-bold">?</span>
                  </div>
                  <div className="w-1/2 pl-8">
                    <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                      <div className="text-center">
                        <div className="text-lg mb-2">Which character means "love"?</div>
                        <div className="grid grid-cols-2 gap-2 text-2xl mb-2">
                          <div className="bg-[#f7cc48]/20 p-2 rounded">愛</div>
                          <div className="bg-[#30363d] p-2 rounded">好</div>
                          <div className="bg-[#30363d] p-2 rounded">美</div>
                          <div className="bg-[#30363d] p-2 rounded">心</div>
                        </div>
                        <div className="text-sm text-[#7d8590]">10 second time limit</div>
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
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Adaptive Speed Presets</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Choose your learning speed based on your experience level and character complexity. All timings are
                based on neuroscience research about optimal processing times.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] hover:border-green-400/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Fast</h3>
                  <div className="text-3xl font-bold text-green-400 mb-4">5.4s per character</div>
                  <div className="space-y-2 text-sm text-[#7d8590] mb-6">
                    <div>• 2s visual recognition</div>
                    <div>• 3s multi-modal integration</div>
                    <div>• 0.2s consolidation blanks</div>
                  </div>
                  <div className="text-sm text-green-400 bg-green-400/10 p-3 rounded">
                    Perfect for review sessions and familiar characters
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#f7cc48]/50 relative rounded-lg">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-[#f7cc48] text-black px-4 py-1 rounded-full text-sm font-semibold">Recommended</div>
                </div>
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Medium</h3>
                  <div className="text-3xl font-bold text-[#f7cc48] mb-4">7.6s per character</div>
                  <div className="space-y-2 text-sm text-[#7d8590] mb-6">
                    <div>• 3s visual recognition</div>
                    <div>• 4s multi-modal integration</div>
                    <div>• 0.3s consolidation blanks</div>
                  </div>
                  <div className="text-sm text-[#f7cc48] bg-[#f7cc48]/10 p-3 rounded">
                    Optimal for most learners - balanced processing time
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-blue-400/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Target className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Slow</h3>
                  <div className="text-3xl font-bold text-blue-400 mb-4">10s per character</div>
                  <div className="space-y-2 text-sm text-[#7d8590] mb-6">
                    <div>• 4s visual recognition</div>
                    <div>• 5s multi-modal integration</div>
                    <div>• 0.5s consolidation blanks</div>
                  </div>
                  <div className="text-sm text-blue-400 bg-blue-400/10 p-3 rounded">
                    Ideal for beginners and complex characters
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spaced Repetition */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center mb-4 bg-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/20 px-3 py-1 rounded-full text-sm">SM-2 Algorithm</div>
                <h2 className="text-4xl font-bold text-white mb-6">Scientifically-Proven Spaced Repetition</h2>
                <p className="text-xl text-[#7d8590] mb-8">
                  After your flash session, our SM-2 algorithm (used by Anki and SuperMemo) schedules reviews at
                  scientifically optimal intervals to combat the forgetting curve and maximize long-term retention.
                </p>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#f7cc48] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-black text-sm font-bold">0</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Initial Learning (Day 0)</h4>
                      <p className="text-[#7d8590]">Complete 90-second flash session with 7 new characters</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#f7cc48] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-black text-sm font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">First Review (Day 1)</h4>
                      <p className="text-[#7d8590]">Critical first review - this prevents 70% forgetting!</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-[#f7cc48] rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-black text-sm font-bold">∞</span>
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-2">Adaptive Intervals</h4>
                      <p className="text-[#7d8590]">
                        Intervals adjust based on your performance: 1 day → 6 days → 15 days → 35 days...
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d]">
                  <h3 className="text-xl font-semibold text-white mb-6 text-center">Memory Strength Over Time</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-[#f7cc48]/20 rounded-lg border border-[#f7cc48]/30">
                      <span className="text-white">Day 0: Learn 愛</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[#30363d] rounded-full h-2">
                          <div className="w-full bg-[#f7cc48] h-2 rounded-full"></div>
                        </div>
                        <span className="text-[#f7cc48] text-sm">100%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-600/20 rounded-lg border border-red-600/30">
                      <span className="text-white">Day 1: Without review</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[#30363d] rounded-full h-2">
                          <div className="w-1/3 bg-red-400 h-2 rounded-full"></div>
                        </div>
                        <span className="text-red-400 text-sm">30%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-600/20 rounded-lg border border-green-600/30">
                      <span className="text-white">Day 1: With review</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[#30363d] rounded-full h-2">
                          <div className="w-5/6 bg-green-400 h-2 rounded-full"></div>
                        </div>
                        <span className="text-green-400 text-sm">85%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-600/20 rounded-lg border border-purple-600/30">
                      <span className="text-white">Day 7: Next review</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-[#30363d] rounded-full h-2">
                          <div className="w-4/5 bg-purple-400 h-2 rounded-full"></div>
                        </div>
                        <span className="text-purple-400 text-sm">80%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Learning Modes */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Three Optimized Learning Modes</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Different modes for different stages of your learning journey, each optimized for specific cognitive
                goals.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">New Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Learn up to 7 new characters with the complete dual-phase system. Optimized for initial memory
                    encoding and working memory capacity.
                  </p>
                  <div className="text-sm text-[#7d8590] space-y-2">
                    <div>✓ Full dual-phase presentation</div>
                    <div>✓ Requires audio before session</div>
                    <div>✓ Prompts after 7 characters</div>
                    <div>✓ ~90 seconds per session</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <RotateCcw className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Review Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Review characters due for spaced repetition. Shows highest priority cards based on memory strength
                    and overdue status.
                  </p>
                  <div className="text-sm text-[#7d8590] space-y-2">
                    <div>✓ SM-2 scheduled reviews</div>
                    <div>✓ Prioritizes overdue cards</div>
                    <div>✓ Updates memory intervals</div>
                    <div>✓ Critical for retention!</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Pause className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Practice Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Additional practice between scheduled reviews. Includes all previously studied cards without
                    affecting spaced repetition scheduling.
                  </p>
                  <div className="text-sm text-[#7d8590] space-y-2">
                    <div>✓ All studied characters</div>
                    <div>✓ No session size limit</div>
                    <div>✓ Doesn't affect scheduling</div>
                    <div>✓ Great for exam prep</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Experience the Science-Based System</h2>
          <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
            Try our dual-phase flash system and see how cognitive science can accelerate your Chinese character
            learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/auth/signup" className="inline-flex items-center justify-center bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium text-lg px-8 py-4 rounded-md transition-colors cursor-pointer">
              Start Free Flash Session
            </Link>
            <Link href="/science" className="inline-flex items-center justify-center border border-[#30363d] text-[#7d8590] hover:bg-[#21262d] hover:text-white text-lg px-8 py-4 bg-transparent rounded-md transition-colors cursor-pointer">
              Read the Research
            </Link>
          </div>

          <div className="text-sm text-[#7d8590]">
            ✓ Free account signup • ✓ 100 characters free forever • ✓ Based on 50+ research papers
          </div>
        </div>
      </section>
    </>
  )
}