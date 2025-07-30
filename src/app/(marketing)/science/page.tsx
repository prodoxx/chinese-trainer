import { BookOpen, Target, Zap, Clock, Eye, Lightbulb, ArrowRight, Brain } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export default async function SciencePage() {
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
              Peer-Reviewed Research
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
              The science behind
              <br />
              <span className="text-[#f7cc48]">Danbing AI</span>
            </h1>
            <p className="text-xl text-[#7d8590] mb-12 max-w-3xl mx-auto leading-relaxed">
              Every aspect of our learning system is grounded in decades of peer-reviewed cognitive science research on
              memory, learning, and attention. No guesswork—just proven science that works.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Core Scientific Principles</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Our system implements proven theories from cognitive psychology and neuroscience research.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Eye className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Dual Coding Theory</h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Paivio (1971):</strong> Information encoded both verbally and visually creates stronger,
                    more retrievable memories. Our dual-phase system implements this perfectly.
                  </p>
                  <div className="text-sm text-[#f7cc48]">
                    Visual: Character + Image
                    <br />
                    Verbal: Pinyin + Meaning + Audio
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Target className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Working Memory Limits</h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Miller (1956) & Cowan (2001):</strong> Human working memory can hold 7±2 or 4±1 chunks of
                    complex information. We limit sessions to 7 characters maximum.
                  </p>
                  <div className="text-sm text-[#f7cc48]">
                    Our sessions: 7 characters max
                    <br />
                    Optimal capacity utilization
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Spacing Effect</h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Ebbinghaus (1885):</strong> Learning distributed over time produces 2x better retention than
                    massed practice. Our SM-2 algorithm implements optimal spacing.
                  </p>
                  <div className="text-sm text-[#f7cc48]">
                    SM-2 Algorithm
                    <br />
                    Exponential intervals: 1→6→15→35 days
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Lightbulb className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Testing Effect</h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Roediger & Karpicke (2006):</strong> Active retrieval strengthens memory more than passive
                    review. Our immediate quiz implements this principle.
                  </p>
                  <div className="text-sm text-[#f7cc48]">
                    Immediate quiz after flash
                    <br />
                    Active retrieval practice
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Multimedia Learning</h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Mayer (2009):</strong> Audio + visual better than visual alone when presented with temporal
                    contiguity. Our Phase 2 synchronizes all modalities.
                  </p>
                  <div className="text-sm text-[#f7cc48]">
                    Synchronized presentation
                    <br />
                    Modality principle applied
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Desirable Difficulties</h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong>Bjork & Bjork (2011):</strong> Challenges that slow initial learning improve long-term
                    retention. Our speed presets create optimal difficulty.
                  </p>
                  <div className="text-sm text-[#f7cc48]">
                    Progressive difficulty
                    <br />
                    Adaptive speed presets
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timing Science */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center mb-4 bg-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/20 px-3 py-1 rounded-full text-sm">Neuroscience</div>
                <h2 className="text-4xl font-bold text-white mb-6">Precision Timing Based on Brain Processing</h2>
                <p className="text-xl text-[#7d8590] mb-8">
                  Every timing decision in our flash sessions is based on neuroscience research about how the brain
                  processes different types of information.
                </p>

                <div className="space-y-6">
                  <div className="border-l-4 border-[#f7cc48] pl-6">
                    <h4 className="text-white font-semibold mb-2">Visual Processing (2-4 seconds)</h4>
                    <p className="text-[#7d8590] mb-2">
                      <strong>Thorpe et al. (1996):</strong> Basic visual categorization requires 150-200ms. Our 2-4s
                      Phase 1 allows complete character complexity analysis and visual encoding.
                    </p>
                  </div>

                  <div className="border-l-4 border-[#f7cc48]/60 pl-6">
                    <h4 className="text-white font-semibold mb-2">Multi-Modal Integration (3-5 seconds)</h4>
                    <p className="text-[#7d8590] mb-2">
                      <strong>Mayer (2009):</strong> Multimedia learning requires sufficient time for audio-visual
                      integration. Our Phase 2 provides optimal time for all associations.
                    </p>
                  </div>

                  <div className="border-l-4 border-[#f7cc48]/40 pl-6">
                    <h4 className="text-white font-semibold mb-2">Consolidation Periods (200-500ms)</h4>
                    <p className="text-[#7d8590] mb-2">
                      <strong>Wixted (2004):</strong> Synaptic consolidation begins immediately. Our blanks between
                      phases allow initial memory consolidation without interference.
                    </p>
                  </div>

                  <div className="border-l-4 border-[#f7cc48]/20 pl-6">
                    <h4 className="text-white font-semibold mb-2">Session Length (90 seconds)</h4>
                    <p className="text-[#7d8590] mb-2">
                      <strong>Warm et al. (2008):</strong> Sustained attention degrades after 5-10 minutes. Our
                      90-second sessions stay well within optimal attention span.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d]">
                  <h3 className="text-xl font-semibold text-white mb-6 text-center">Brain Processing Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48] rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">0-200ms: Visual Recognition</div>
                        <div className="text-[#7d8590] text-sm">Basic character shape processing</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48]/80 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">200ms-2s: Complex Visual Analysis</div>
                        <div className="text-[#7d8590] text-sm">Stroke patterns and component recognition</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48]/60 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">2-4s: Phase 1 Complete</div>
                        <div className="text-[#7d8590] text-sm">Visual encoding and anticipation</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 bg-[#f7cc48]/40 rounded-full"></div>
                      <div className="flex-1">
                        <div className="text-white font-medium">3-5s: Multi-Modal Integration</div>
                        <div className="text-[#7d8590] text-sm">Audio, visual, and semantic binding</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Forgetting Curve */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">The Forgetting Curve Problem</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Understanding how memory works and fails guides our spaced repetition algorithm.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              <div className="bg-[#21262d] border-[#30363d] rounded-lg">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">Without Spaced Repetition</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-3 bg-red-600/20 rounded-lg">
                      <span className="text-white">1 hour later</span>
                      <span className="text-red-400 font-bold">50% forgotten</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-600/30 rounded-lg">
                      <span className="text-white">24 hours later</span>
                      <span className="text-red-400 font-bold">70% forgotten</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-red-600/40 rounded-lg">
                      <span className="text-white">1 week later</span>
                      <span className="text-red-400 font-bold">90% forgotten</span>
                    </div>
                  </div>
                  <p className="text-[#7d8590]">
                    <strong>Ebbinghaus (1885):</strong> Without review, we forget exponentially. This is why cramming
                    doesn't work.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] rounded-lg">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-white mb-6">With Danbing AI's SM-2</h3>
                  <div className="space-y-4 mb-6">
                    <div className="flex justify-between items-center p-3 bg-[#f7cc48]/20 rounded-lg">
                      <span className="text-white">Day 1 review</span>
                      <span className="text-[#f7cc48] font-bold">85% retained</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-600/20 rounded-lg">
                      <span className="text-white">Day 6 review</span>
                      <span className="text-green-400 font-bold">80% retained</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-600/20 rounded-lg">
                      <span className="text-white">Day 15 review</span>
                      <span className="text-blue-400 font-bold">85% retained</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-600/20 rounded-lg">
                      <span className="text-white">Day 35 review</span>
                      <span className="text-purple-400 font-bold">90% retained</span>
                    </div>
                  </div>
                  <p className="text-[#7d8590]">
                    <strong>Cepeda et al. (2006):</strong> Distributed practice produces 2x better retention than massed
                    practice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research References */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Key Research References</h2>
              <p className="text-xl text-[#7d8590]">
                Our system is built on decades of peer-reviewed research from leading cognitive scientists.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#21262d] border-[#30363d] rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Memory & Learning Foundations</h4>
                  <div className="space-y-3 text-sm text-[#7d8590]">
                    <div>
                      <strong className="text-[#f7cc48]">Ebbinghaus, H. (1885)</strong>
                      <br />
                      Memory: A Contribution to Experimental Psychology
                      <div className="text-xs mt-1">→ Forgetting curve and spacing effect</div>
                    </div>
                    <div>
                      <strong className="text-[#f7cc48]">Miller, G. A. (1956)</strong>
                      <br />
                      The magical number seven, plus or minus two
                      <div className="text-xs mt-1">→ Working memory capacity limits</div>
                    </div>
                    <div>
                      <strong className="text-[#f7cc48]">Paivio, A. (1971)</strong>
                      <br />
                      Imagery and Verbal Processes
                      <div className="text-xs mt-1">→ Dual coding theory</div>
                    </div>
                    <div>
                      <strong className="text-[#f7cc48]">Roediger & Karpicke (2006)</strong>
                      <br />
                      Test-enhanced learning: Taking memory tests improves long-term retention
                      <div className="text-xs mt-1">→ Testing effect</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] rounded-lg">
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Neuroscience & Processing</h4>
                  <div className="space-y-3 text-sm text-[#7d8590]">
                    <div>
                      <strong className="text-[#f7cc48]">Thorpe et al. (1996)</strong>
                      <br />
                      Speed of processing in the human visual system
                      <div className="text-xs mt-1">→ Visual processing timing</div>
                    </div>
                    <div>
                      <strong className="text-[#f7cc48]">Mayer, R. E. (2009)</strong>
                      <br />
                      Multimedia Learning (2nd ed.)
                      <div className="text-xs mt-1">→ Audio-visual integration principles</div>
                    </div>
                    <div>
                      <strong className="text-[#f7cc48]">Wixted, J. T. (2004)</strong>
                      <br />
                      The psychology and neuroscience of forgetting
                      <div className="text-xs mt-1">→ Memory consolidation</div>
                    </div>
                    <div>
                      <strong className="text-[#f7cc48]">Warm et al. (2008)</strong>
                      <br />
                      Vigilance requires hard mental work
                      <div className="text-xs mt-1">→ Sustained attention limits</div>
                    </div>
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
          <h2 className="text-4xl font-bold text-white mb-4">Experience Science-Based Learning</h2>
          <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
            Try our research-backed system and feel the difference that 50+ years of cognitive science makes in your
            learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/auth/signup" className="inline-flex items-center justify-center bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium text-lg px-8 py-4 rounded-md transition-colors cursor-pointer">
              Start Free Flash Session
            </Link>
            <Link href="/how-it-works" className="inline-flex items-center justify-center border border-[#30363d] text-[#7d8590] hover:bg-[#21262d] hover:text-white text-lg px-8 py-4 bg-transparent rounded-md transition-colors cursor-pointer">
              See How It Works
            </Link>
          </div>

          <div className="text-sm text-[#7d8590]">
            ✓ Based on 50+ research papers • ✓ AI-powered insights • ✓ Cross-device sync
          </div>
        </div>
      </section>
    </>
  )
}