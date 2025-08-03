import { Brain, Zap, Target, Clock, BarChart, Shield, Sparkles, ChevronRight, Pause, RotateCcw, Keyboard } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export const metadata = {
  title: "The Danbing Method - Science-Based Chinese Learning Methodology",
  description: "Learn how our dual-phase flash system and SM-2 spaced repetition algorithm help you master Traditional Chinese characters 10x faster than traditional methods.",
  keywords: "Chinese learning methodology, spaced repetition, dual-phase learning, SM-2 algorithm, cognitive science language learning, memory retention techniques",
};

export default async function MethodologyPage() {
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
              Based on 50+ Years of Memory Research
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              The science of learning
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">Chinese characters</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Our methodology combines cognitive psychology, neuroscience, and AI to create the most efficient learning system ever built for Traditional Chinese.
            </p>
          </div>
        </div>
      </section>

      {/* Core Principles Section */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Core Scientific Principles</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Every feature is grounded in peer-reviewed research
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-semibold text-white mb-3">Working Memory Limits</h3>
                <p className="text-[#7d8590] mb-4">
                  Based on Miller's Law (7±2 rule), we limit sessions to 8 characters to stay within your brain's optimal capacity.
                </p>
                <p className="text-sm text-[#f7cc48]">Research: Miller (1956), Cowan (2001)</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <div className="text-4xl mb-4">👁️</div>
                <h3 className="text-xl font-semibold text-white mb-3">Dual Coding Theory</h3>
                <p className="text-[#7d8590] mb-4">
                  Information encoded both visually and verbally creates 2x stronger memories than single-channel learning.
                </p>
                <p className="text-sm text-[#f7cc48]">Research: Paivio (1971, 1986)</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-white mb-3">Testing Effect</h3>
                <p className="text-[#7d8590] mb-4">
                  Active retrieval strengthens memory 40% more than passive review. Our mini-quizzes implement this principle.
                </p>
                <p className="text-sm text-[#f7cc48]">Research: Roediger & Karpicke (2006)</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dual-Phase System Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">The Dual-Phase Flash System</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Optimized for how your brain actually processes and stores information
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 mb-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="bg-[#f7cc48] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">1</span>
                    Phase 1: Visual Recognition
                  </h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong className="text-white">2-4 seconds</strong> of character-only presentation
                  </p>
                  <ul className="space-y-3 text-[#7d8590]">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                      <span>Focuses attention on character shape and structure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                      <span>Allows visual encoding without cognitive overload</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                      <span>Creates anticipation that enhances memory formation</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                    <span className="bg-[#f7cc48] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3">2</span>
                    Phase 2: Multi-Modal Integration
                  </h3>
                  <p className="text-[#7d8590] mb-4">
                    <strong className="text-white">3-5 seconds</strong> of complete information
                  </p>
                  <ul className="space-y-3 text-[#7d8590]">
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                      <span>Character + pinyin + image + meaning + audio</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                      <span>Creates multiple memory pathways simultaneously</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <ChevronRight className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                      <span>Reinforces all associations for maximum retention</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <div className="bg-gradient-to-br from-[#f7cc48]/20 to-[#f7cc48]/10 border border-[#f7cc48]/30 rounded-xl p-8 mb-8">
                  <h4 className="text-xl font-semibold text-white mb-4">Why Two Phases?</h4>
                  <p className="text-[#7d8590] mb-4">
                    Research shows that separating visual and semantic processing reduces cognitive load and improves encoding quality.
                  </p>
                  <p className="text-[#7d8590]">
                    By presenting information in stages, we work with your brain's natural processing sequence rather than overwhelming it.
                  </p>
                </div>

                <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                  <h4 className="text-xl font-semibold text-white mb-4">Speed Presets</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Fast</span>
                        <span className="text-[#f7cc48]">5.4s per card</span>
                      </div>
                      <p className="text-sm text-[#7d8590]">For review or familiar material</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Medium</span>
                        <span className="text-[#f7cc48]">7.6s per card</span>
                      </div>
                      <p className="text-sm text-[#7d8590]">Default for most learning</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Slow</span>
                        <span className="text-[#f7cc48]">10s per card</span>
                      </div>
                      <p className="text-sm text-[#7d8590]">For beginners or complex characters</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spaced Repetition Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">SM-2 Spaced Repetition</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Combat the forgetting curve with scientifically optimized review intervals
              </p>
            </div>

            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-8 md:p-12 mb-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">The Forgetting Curve</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-right">
                        <span className="text-2xl font-bold text-white">50%</span>
                      </div>
                      <div className="flex-1">
                        <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-[#ef4444] rounded-full" style={{width: '50%'}}></div>
                        </div>
                      </div>
                      <span className="text-[#7d8590]">Forgotten after 1 hour</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-right">
                        <span className="text-2xl font-bold text-white">70%</span>
                      </div>
                      <div className="flex-1">
                        <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-[#ef4444] rounded-full" style={{width: '70%'}}></div>
                        </div>
                      </div>
                      <span className="text-[#7d8590]">Forgotten after 24 hours</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-16 text-right">
                        <span className="text-2xl font-bold text-white">90%</span>
                      </div>
                      <div className="flex-1">
                        <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                          <div className="absolute top-0 left-0 h-full bg-[#ef4444] rounded-full" style={{width: '90%'}}></div>
                        </div>
                      </div>
                      <span className="text-[#7d8590]">Forgotten after 1 week</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Our Solution</h3>
                  <div className="space-y-4">
                    <div className="bg-[#161b22] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Day 0</span>
                        <span className="text-[#f7cc48]">Initial Learning</span>
                      </div>
                      <p className="text-sm text-[#7d8590]">Flash session introduction</p>
                    </div>
                    <div className="bg-[#161b22] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Day 1</span>
                        <span className="text-[#f7cc48]">First Review (Critical)</span>
                      </div>
                      <p className="text-sm text-[#7d8590]">Strengthens initial memory</p>
                    </div>
                    <div className="bg-[#161b22] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Day 7</span>
                        <span className="text-[#f7cc48]">Second Review</span>
                      </div>
                      <p className="text-sm text-[#7d8590]">Consolidates long-term memory</p>
                    </div>
                    <div className="bg-[#161b22] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">Dynamic</span>
                        <span className="text-[#f7cc48]">Adaptive Intervals</span>
                      </div>
                      <p className="text-sm text-[#7d8590]">Based on your performance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
                <BarChart className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Memory Strength Tracking</h4>
                <p className="text-sm text-[#7d8590]">Real-time calculation of retention probability</p>
              </div>
              
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
                <Target className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Priority Scheduling</h4>
                <p className="text-sm text-[#7d8590]">Most urgent reviews appear first</p>
              </div>
              
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 text-center">
                <Zap className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                <h4 className="text-lg font-semibold text-white mb-2">Efficiency Optimization</h4>
                <p className="text-sm text-[#7d8590]">Review at the perfect moment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three Modes Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Three Learning Modes</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Optimized for different stages of your learning journey
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-6">
                  <Sparkles className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">New Mode</h3>
                <p className="text-[#7d8590] mb-4">
                  For first-time learning. Limited to 8 cards per session to respect working memory limits.
                </p>
                <ul className="space-y-2 text-sm text-[#7d8590]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Audio required before start</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Optimal cognitive load</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Use when mentally fresh</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center mb-6">
                  <Clock className="w-6 h-6 text-[#f7cc48]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Review Mode</h3>
                <p className="text-[#7d8590] mb-4">
                  For spaced repetition reviews. Shows highest-priority cards based on SM-2 algorithm.
                </p>
                <ul className="space-y-2 text-sm text-[#7d8590]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>7 most urgent cards</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Do immediately when due</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Critical for retention</span>
                  </li>
                </ul>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                  <RotateCcw className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Practice Mode</h3>
                <p className="text-[#7d8590] mb-4">
                  For additional rehearsal without affecting scheduling. No session limit.
                </p>
                <ul className="space-y-2 text-sm text-[#7d8590]">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>All studied cards available</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Doesn't affect scheduling</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Great before exams</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Enhanced Learning Features</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Every detail optimized for maximum retention
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Keyboard className="w-6 h-6 text-[#f7cc48] mr-3" />
                  Smart Controls
                </h3>
                <div className="space-y-3 text-[#7d8590]">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Pause className="w-4 h-4" />
                      Pause/Resume
                    </span>
                    <code className="text-xs bg-[#161b22] px-2 py-1 rounded">P</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Restart Session
                    </span>
                    <code className="text-xs bg-[#161b22] px-2 py-1 rounded">R</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Quiz Answers</span>
                    <code className="text-xs bg-[#161b22] px-2 py-1 rounded">1-4</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exit Session</span>
                    <code className="text-xs bg-[#161b22] px-2 py-1 rounded">Q/ESC</code>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                  <Shield className="w-6 h-6 text-[#f7cc48] mr-3" />
                  Accessibility Options
                </h3>
                <div className="space-y-3 text-[#7d8590]">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#f7cc48] rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-white font-medium">Reduce Motion</p>
                      <p className="text-sm">Removes animations for sensitive users</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#f7cc48] rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-white font-medium">Brightness Control</p>
                      <p className="text-sm">70% dim option reduces eye strain</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-[#f7cc48] rounded-full mt-1.5"></div>
                    <div>
                      <p className="text-white font-medium">Speed Presets</p>
                      <p className="text-sm">Adapt to your processing speed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Proven Results</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Our methodology delivers measurable improvements
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">10x</div>
                <p className="text-[#7d8590]">Faster than traditional methods</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">85%</div>
                <p className="text-[#7d8590]">Average retention rate</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">90s</div>
                <p className="text-[#7d8590]">Per learning session</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <div className="text-4xl font-bold text-[#f7cc48] mb-2">95%</div>
                <p className="text-[#7d8590]">Session completion rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Experience the Difference</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              See why our scientific approach helps you learn Chinese characters faster than any other method.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Try It Free
              </Link>
              <Link href="/science" className="bg-[#30363d] hover:bg-[#30363d]/80 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all">
                Read the Research
              </Link>
            </div>
            
            <p className="mt-8 text-sm text-[#7d8590]">
              No credit card required • 100 free characters • Start learning in 60 seconds
            </p>
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