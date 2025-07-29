import { Upload, Zap, BarChart3, Clock, Globe, Smartphone, Shield, Settings, ArrowRight, Brain, Play, RotateCcw, Timer } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="py-24">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center mb-8 bg-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/20 text-sm px-4 py-2 rounded-full">
              Powerful Features
            </div>
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-tight tracking-tight">
              Everything you need to
              <br />
              <span className="text-[#f7cc48]">master Chinese</span>
            </h1>
            <p className="text-xl text-[#7d8590] mb-12 max-w-3xl mx-auto leading-relaxed">
              AI-powered features designed to accelerate your Chinese character learning with minimal effort and maximum
              retention. No manual setup required.
            </p>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Core Learning Features</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                The essential tools that make Danbing AI the most effective way to learn Chinese characters.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Zap className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">AI-Powered Enrichment</h3>
                  <p className="text-[#7d8590] mb-4">
                    Just import a CSV with Chinese characters. Our AI automatically generates images, audio
                    pronunciation, meanings, and mnemonics.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • Traditional Chinese dictionary lookup
                    <br />• Contextual image generation
                    <br />• TTS audio generation (zh-TW voice)
                    <br />• Etymology and mnemonics
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Brain className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Dual-Phase Flash System</h3>
                  <p className="text-[#7d8590] mb-4">
                    Scientifically-designed presentation system that optimizes memory encoding through visual and
                    multi-modal phases with immediate testing.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • Phase 1: Visual recognition (2-4s)
                    <br />• Phase 2: Multi-modal integration (3-5s)
                    <br />• Immediate quiz with feedback
                    <br />• Adaptive speed presets
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Clock className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Smart Spaced Repetition</h3>
                  <p className="text-[#7d8590] mb-4">
                    SM-2 algorithm automatically schedules reviews at optimal intervals based on your performance and
                    memory strength.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • Adaptive intervals (1 day → 6 days → 15 days...)
                    <br />• Memory strength calculation
                    <br />• Forgetting curve optimization
                    <br />• Never forget what you've learned
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <BarChart3 className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Advanced Analytics</h3>
                  <p className="text-[#7d8590] mb-4">
                    Comprehensive learning analytics track your progress, identify weak points, and optimize your study
                    sessions.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • Learning curves and retention rates
                    <br />• Character difficulty analysis
                    <br />• Session performance metrics
                    <br />• Confusion pattern detection
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Upload className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Easy Deck Import</h3>
                  <p className="text-[#7d8590] mb-4">
                    Import your character lists from CSV files. Support for multiple decks with automatic validation and
                    error reporting.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • CSV file upload
                    <br />• Traditional Chinese character validation
                    <br />• Error reporting with row numbers
                    <br />• Multiple deck management
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8">
                  <div className="w-16 h-16 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mb-6">
                    <Globe className="w-8 h-8 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Cloud-Based Platform</h3>
                  <p className="text-[#7d8590] mb-4">
                    Secure user accounts with cross-device sync. Continue learning seamlessly on any device with
                    automatic progress backup.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • Cross-device synchronization
                    <br />• Secure cloud storage
                    <br />• Automatic progress backup
                    <br />• Learn anywhere, anytime
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
              <h2 className="text-4xl font-bold text-white mb-4">Multiple Learning Modes</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Different modes for different stages of your learning journey, from initial encoding to long-term
                retention.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Play className="w-10 h-10 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">New Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Learn up to 7 new characters with the complete dual-phase flash system. Optimized for initial memory encoding.
                  </p>
                  <div className="space-y-2 text-sm text-[#7d8590]">
                    <div>✓ Full dual-phase presentation</div>
                    <div>✓ Multi-modal encoding</div>
                    <div>✓ Immediate quizzes</div>
                    <div>✓ ~90 seconds per session</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <RotateCcw className="w-10 h-10 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Review Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Review characters due for spaced repetition. Critical for long-term retention and memory
                    consolidation.
                  </p>
                  <div className="space-y-2 text-sm text-[#7d8590]">
                    <div>✓ SM-2 scheduled reviews</div>
                    <div>✓ Adaptive difficulty</div>
                    <div>✓ Memory strength tracking</div>
                    <div>✓ Never skip these!</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-[#f7cc48]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Timer className="w-10 h-10 text-[#f7cc48]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">Practice Mode</h3>
                  <p className="text-[#7d8590] mb-6">
                    Additional practice between scheduled reviews. Perfect for exam preparation and confidence building.
                  </p>
                  <div className="space-y-2 text-sm text-[#7d8590]">
                    <div>✓ All studied characters</div>
                    <div>✓ Flexible session size</div>
                    <div>✓ Doesn't affect scheduling</div>
                    <div>✓ Great for exam prep</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Speed Presets */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Adaptive Speed Presets</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Choose your learning speed based on your experience level and character complexity.
              </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="bg-[#21262d] border-[#30363d] hover:border-green-400/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Fast</h3>
                  <div className="text-3xl font-bold text-green-400 mb-4">5.4s per character</div>
                  <p className="text-[#7d8590] mb-6">
                    Perfect for review sessions and familiar characters. Maintains focus while maximizing efficiency.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • 2s visual recognition
                    <br />• 3s multi-modal integration
                    <br />• 0.2s consolidation blanks
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
                  <h3 className="text-xl font-semibold text-white mb-4">Medium</h3>
                  <div className="text-3xl font-bold text-[#f7cc48] mb-4">7.6s per character</div>
                  <p className="text-[#7d8590] mb-6">
                    Optimal for most learners. Balances processing time with attention span for maximum retention.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • 3s visual recognition
                    <br />• 4s multi-modal integration
                    <br />• 0.3s consolidation blanks
                  </div>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-blue-400/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Settings className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-4">Slow</h3>
                  <div className="text-3xl font-bold text-blue-400 mb-4">10s per character</div>
                  <p className="text-[#7d8590] mb-6">
                    Ideal for beginners and complex characters. Extra time ensures complete visual processing.
                  </p>
                  <div className="text-sm text-[#7d8590]">
                    • 4s visual recognition
                    <br />• 5s multi-modal integration
                    <br />• 0.5s consolidation blanks
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-white mb-4">Technical Excellence</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Built with modern technology for reliability, performance, and user experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 text-center">
                  <Globe className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">Web-Based</h4>
                  <p className="text-[#7d8590] text-sm">
                    No downloads required. Works in any modern browser with full functionality.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 text-center">
                  <Smartphone className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">Responsive</h4>
                  <p className="text-[#7d8590] text-sm">
                    Optimized for desktop, tablet, and mobile devices with touch support.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 text-center">
                  <Shield className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">Privacy First</h4>
                  <p className="text-[#7d8590] text-sm">
                    Secure cloud storage with user data isolation. No tracking, no ads, focused on learning.
                  </p>
                </div>
              </div>

              <div className="bg-[#21262d] border-[#30363d] hover:border-[#f7cc48]/50 transition-all duration-300 cursor-pointer rounded-lg">
                <div className="p-6 text-center">
                  <Settings className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-white mb-2">Customizable</h4>
                  <p className="text-[#7d8590] text-sm">
                    Adjust timing, audio settings, and visual preferences to match your learning style.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Experience These Features?</h2>
          <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
            Try Danbing AI today and discover how our advanced features can accelerate your Chinese learning.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="inline-flex items-center justify-center bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium text-lg px-8 py-4 rounded-md transition-colors cursor-pointer">
              Start Free Trial
            </Link>
            <Link href="/pricing" className="inline-flex items-center justify-center border border-[#30363d] text-[#7d8590] hover:bg-[#21262d] hover:text-white text-lg px-8 py-4 bg-transparent rounded-md transition-colors cursor-pointer">
              View Pricing
            </Link>
          </div>
          <p className="text-sm text-[#7d8590] mt-4">
            ✓ Free account required • ✓ Cross-device sync • ✓ AI-powered learning
          </p>
        </div>
      </section>
    </>
  )
}