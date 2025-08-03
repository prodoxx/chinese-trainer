import { Target, Clock, Brain, Upload, Sparkles, CheckCircle, BarChart3, Users, Shield } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export const metadata = {
  title: "How Danbing Works - AI-Powered Chinese Learning System",
  description: "Learn how our dual-phase flash system and AI enrichment help you master Chinese characters 10x faster. Based on 50+ years of cognitive science research.",
  keywords: "Chinese learning method, spaced repetition system, dual-phase learning, cognitive science language learning, AI flashcards, SM-2 algorithm",
};

export default async function HowItWorksPage() {
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
              Science-Based Learning
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              From zero to fluency
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">in 90-second sessions</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Danbing combines AI enrichment with cognitive science to help you learn Chinese characters faster than any other method. Here's exactly how it works.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          </div>
        </div>
      </section>

      {/* Simple 3-Step Process */}
      <section className="py-20 border-b border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Start Learning in 3 Simple Steps</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                No complex setup. Just upload, enrich, and start learning.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Upload className="w-10 h-10 text-[#f7cc48]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">1. Upload Your Text</h3>
                <p className="text-[#7d8590]">
                  Import any CSV file with Chinese characters. One character per line. That's it.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Sparkles className="w-10 h-10 text-[#f7cc48]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">2. AI Enriches Everything</h3>
                <p className="text-[#7d8590]">
                  Our AI automatically adds pronunciation, meanings, images, and memory aids for each character.
                </p>
              </div>

              <div className="text-center">
                <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-[#f7cc48]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">3. Learn in 90 Seconds</h3>
                <p className="text-[#7d8590]">
                  Study 8 characters per session with our proven dual-phase system. Review tomorrow to lock it in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Learning System */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">The 90-Second Learning System</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Each session uses 8 optimized characters with mini-quizzes every 3 cards to maximize retention and engagement.
              </p>
            </div>

            {/* Visual Timeline */}
            <div className="bg-[#21262d] rounded-2xl p-8 border border-[#30363d] mb-12">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-white">Your 90-Second Journey</h3>
                <div className="text-sm text-[#f7cc48]">8 characters total</div>
              </div>
              
              {/* Progress Bar Visual */}
              <div className="relative mb-8">
                <div className="h-2 bg-[#30363d] rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/60 rounded-full" style={{width: '100%'}}>
                    <div className="h-full bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <div className="absolute -top-1 left-0 w-4 h-4 bg-[#f7cc48] rounded-full"></div>
                <div className="absolute -top-1 left-[37.5%] w-4 h-4 bg-[#f7cc48] rounded-full"></div>
                <div className="absolute -top-1 left-[75%] w-4 h-4 bg-[#f7cc48] rounded-full"></div>
                <div className="absolute -top-1 right-0 w-4 h-4 bg-green-500 rounded-full"></div>
              </div>

              {/* Timeline Labels */}
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Start</div>
                  <div className="text-xs text-[#7d8590]">3-2-1 countdown</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Cards 1-3</div>
                  <div className="text-xs text-[#7d8590]">+ Mini quiz</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Cards 4-6</div>
                  <div className="text-xs text-[#7d8590]">+ Mini quiz</div>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white mb-1">Cards 7-8</div>
                  <div className="text-xs text-[#7d8590]">+ Final quiz</div>
                </div>
              </div>
            </div>

            {/* Dual-Phase System */}
            <div className="grid lg:grid-cols-2 gap-8 items-start">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">The Dual-Phase System</h3>
                <div className="space-y-6">
                  <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#f7cc48] font-bold">1</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Visual Recognition Phase</h4>
                        <p className="text-sm text-[#7d8590] mb-3">
                          Character appears alone for 2-4 seconds. Your brain focuses purely on visual pattern recognition without distraction.
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-[#7d8590]">Activates visual cortex</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#f7cc48] font-bold">2</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Multi-Modal Integration</h4>
                        <p className="text-sm text-[#7d8590] mb-3">
                          Character + pronunciation + image + meaning appear together for 3-5 seconds. Audio plays automatically.
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-[#7d8590]">Creates 4x stronger memories</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-[#f7cc48] font-bold">?</span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-2">Active Testing</h4>
                        <p className="text-sm text-[#7d8590] mb-3">
                          Mini-quizzes every 3 cards test recall. Uses confused characters as smart distractors.
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-[#7d8590]">85% better retention</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Live Example</h3>
                <div className="bg-[#0d1117] rounded-lg p-8 border border-[#30363d]">
                  <div className="space-y-6">
                    {/* Phase 1 Example */}
                    <div>
                      <div className="text-sm text-[#7d8590] mb-2">Phase 1 (3 seconds)</div>
                      <div className="bg-[#21262d] rounded-lg p-8 text-center border border-[#30363d]">
                        <div className="text-6xl">愛</div>
                      </div>
                    </div>

                    {/* Transition */}
                    <div className="text-center">
                      <div className="text-xs text-[#7d8590]">↓ 300ms blank</div>
                    </div>

                    {/* Phase 2 Example */}
                    <div>
                      <div className="text-sm text-[#7d8590] mb-2">Phase 2 (4 seconds)</div>
                      <div className="bg-[#21262d] rounded-lg p-6 border border-[#30363d]">
                        <div className="text-center space-y-3">
                          <div className="text-5xl">愛</div>
                          <div className="text-2xl text-[#f7cc48]">ài</div>
                          <div className="text-3xl">❤️</div>
                          <div className="text-lg text-[#7d8590]">love</div>
                          <div className="flex items-center justify-center gap-2 text-sm text-[#f7cc48]">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                            </svg>
                            Audio playing
                          </div>
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

      {/* AI Enrichment Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">AI Does the Heavy Lifting</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Just upload characters. Our AI automatically creates everything you need for effective learning.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d]">
                <h3 className="text-xl font-semibold text-white mb-4">What You Upload</h3>
                <div className="bg-[#0d1117] rounded-lg p-6 font-mono text-sm text-[#7d8590]">
                  <div>愛</div>
                  <div>學</div>
                  <div>書</div>
                  <div>朋</div>
                  <div>友</div>
                  <div className="text-xs mt-2 text-[#7d8590]/60">example.csv</div>
                </div>
              </div>

              <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d]">
                <h3 className="text-xl font-semibold text-white mb-4">What AI Creates</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-white">Taiwan Mandarin pronunciation</span>
                      <span className="text-[#7d8590]"> with authentic audio</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-white">Contextual meanings</span>
                      <span className="text-[#7d8590]"> from 123K+ entries</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-white">Visual memory aids</span>
                      <span className="text-[#7d8590]"> custom for each character</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-white">Etymology & mnemonics</span>
                      <span className="text-[#7d8590]"> for deeper understanding</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <div className="text-sm">
                      <span className="text-white">Confusion detection</span>
                      <span className="text-[#7d8590]"> with similar characters</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <div className="inline-flex items-center text-sm text-[#7d8590]">
                <Clock className="w-4 h-4 mr-2" />
                Enrichment takes ~3 seconds per character
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spaced Repetition */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Never Forget What You Learn</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Our SM-2 spaced repetition algorithm schedules reviews at the perfect time to move knowledge from short-term to long-term memory.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-[#21262d] rounded-lg p-8 border border-[#30363d]">
                  <h3 className="text-xl font-semibold text-white mb-6">The Forgetting Curve</h3>
                  
                  {/* Chart Visual */}
                  <div className="relative h-64 mb-6">
                    <div className="absolute inset-0 grid grid-rows-4 gap-0">
                      <div className="border-b border-[#30363d]"></div>
                      <div className="border-b border-[#30363d]"></div>
                      <div className="border-b border-[#30363d]"></div>
                      <div className="border-b border-[#30363d]"></div>
                    </div>
                    
                    {/* Memory retention curves */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                      {/* Without review - red curve */}
                      <path 
                        d="M 0,20 C 100,60 200,140 400,180" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="3"
                        strokeDasharray="5,5"
                      />
                      {/* With review - green curve */}
                      <path 
                        d="M 0,20 L 100,40 L 100,30 L 200,50 L 200,40 L 300,60 L 300,50 L 400,70" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="3"
                      />
                    </svg>
                    
                    {/* Labels */}
                    <div className="absolute top-0 left-0 text-xs text-[#7d8590]">100%</div>
                    <div className="absolute bottom-0 left-0 text-xs text-[#7d8590]">0%</div>
                    <div className="absolute bottom-0 right-0 text-xs text-[#7d8590]">Time →</div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-red-500" style={{borderStyle: 'dashed', borderWidth: '1px 0', borderColor: '#ef4444'}}></div>
                      <span className="text-[#7d8590]">Without review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-0.5 bg-green-500"></div>
                      <span className="text-[#7d8590]">With spaced repetition</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Your Review Schedule</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#f7cc48] font-bold">0</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Learn</div>
                      <div className="text-sm text-[#7d8590]">90-second session with 8 new characters</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#f7cc48] font-bold">1</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Day 1</div>
                      <div className="text-sm text-[#7d8590]">First review (prevents 70% forgetting)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#f7cc48] font-bold">6</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Day 6</div>
                      <div className="text-sm text-[#7d8590]">Second review (locks in memory)</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-[#f7cc48] font-bold">∞</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold">Adaptive</div>
                      <div className="text-sm text-[#7d8590]">Intervals grow: 15 days → 35 days → 70 days...</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-400">Characters stay in long-term memory forever</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Everything Else You Need</h2>
              <p className="text-xl text-[#7d8590] max-w-2xl mx-auto">
                Built for serious learners who want results
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <BarChart3 className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Progress Analytics</h3>
                <p className="text-sm text-[#7d8590]">Track accuracy, retention rates, and learning velocity. See exactly where to focus.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Users className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Cross-Device Sync</h3>
                <p className="text-sm text-[#7d8590]">Start on your laptop, continue on your phone. Everything syncs instantly.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Brain className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Character Insights</h3>
                <p className="text-sm text-[#7d8590]">Deep dive into etymology, components, and confusion patterns for any character.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Shield className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Privacy First</h3>
                <p className="text-sm text-[#7d8590]">Your data is yours. Full encryption and GDPR compliance built in.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Clock className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Daily Reminders</h3>
                <p className="text-sm text-[#7d8590]">Never miss a review. Get notified when characters are due for practice.</p>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Target className="w-8 h-8 text-[#f7cc48] mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Taiwan Focus</h3>
                <p className="text-sm text-[#7d8590]">Authentic Taiwan Mandarin pronunciation and usage. Not mainland Chinese.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Ready to Learn 10x Faster?</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              Join 50,000+ learners who've discovered the most efficient way to master Chinese characters.
            </p>

            <div className="bg-[#21262d] border border-[#30363d] rounded-2xl p-8 mb-8 max-w-md mx-auto">
              <div className="text-6xl mb-4">愛</div>
              <div className="text-2xl text-[#f7cc48] mb-2">Your first character awaits</div>
              <div className="text-[#7d8590] mb-6">90 seconds to permanent memory</div>
              
              <Link href="/auth/signup" className="block w-full bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl mb-4">
                Start Learning Free
              </Link>
              
              <div className="text-sm text-[#7d8590]">
                No credit card • 100 characters free • Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}