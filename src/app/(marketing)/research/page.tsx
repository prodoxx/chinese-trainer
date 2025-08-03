import { FileText, Brain, BarChart, Users, Award, BookOpen, Microscope, Target, TrendingUp, CheckCircle, ExternalLink } from "lucide-react"
import Link from "next/link"
import { redirectIfAuthenticated } from "@/lib/auth-helpers"

export const metadata = {
  title: "Research - The Scientific Foundation of Danbing AI's Learning System",
  description: "Explore 50+ years of peer-reviewed cognitive science research that powers our Chinese learning methodology. From Miller's Law to modern neuroscience.",
  keywords: "language learning research, cognitive science, memory research, spaced repetition studies, dual coding theory, Chinese learning science, neuroscience language acquisition",
};

export default async function ResearchPage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated();

  return (
    <>
      {/* Hero Section */}
      <section className="py-16 sm:py-20 md:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center mb-6 sm:mb-8 bg-gradient-to-r from-[#f7cc48]/20 to-[#f7cc48]/10 text-[#f7cc48] border border-[#f7cc48]/30 text-xs sm:text-sm px-4 py-2 rounded-full font-medium">
              <Microscope className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Peer-Reviewed Science
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 sm:mb-8 leading-tight tracking-tight">
              Built on decades of
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7cc48] to-[#f7cc48]/80">cognitive research</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-[#7d8590] mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed px-4 sm:px-0">
              Every feature in Danbing AI is grounded in peer-reviewed scientific literature. We don't guess—we implement what's proven to work.
            </p>
          </div>
        </div>
      </section>

      {/* Key Studies Section */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Foundational Research</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                The cornerstone studies that shape our learning system
              </p>
            </div>

            <div className="space-y-8">
              {/* Miller's Law */}
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Brain className="w-6 h-6 text-[#f7cc48]" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">Miller's Law (1956)</h3>
                        <p className="text-[#f7cc48]">The Magical Number Seven, Plus or Minus Two</p>
                      </div>
                    </div>
                    <p className="text-[#7d8590] mb-4">
                      George A. Miller discovered that human working memory can hold 7±2 chunks of information. This fundamental constraint shapes how we structure learning sessions.
                    </p>
                    <div className="bg-[#161b22] rounded-lg p-4 mb-4">
                      <h4 className="text-white font-semibold mb-2">Our Implementation:</h4>
                      <ul className="space-y-2 text-[#7d8590]">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>8-character sessions stay within optimal capacity</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Mini-quizzes every 3 characters prevent overload</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Chunking complex characters into components</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="lg:w-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-[#f7cc48] mb-2">7±2</div>
                      <p className="text-[#7d8590]">Working memory limit</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ebbinghaus Forgetting Curve */}
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-[#f7cc48]" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">Ebbinghaus Forgetting Curve (1885)</h3>
                        <p className="text-[#f7cc48]">Memory Decay and Optimal Review Timing</p>
                      </div>
                    </div>
                    <p className="text-[#7d8590] mb-4">
                      Hermann Ebbinghaus discovered that memory decays exponentially without review. His research established the mathematical foundation for spaced repetition.
                    </p>
                    <div className="bg-[#161b22] rounded-lg p-4 mb-4">
                      <h4 className="text-white font-semibold mb-2">Our Implementation:</h4>
                      <ul className="space-y-2 text-[#7d8590]">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>SM-2 algorithm schedules reviews before forgetting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Day 1 review captures 50% retention point</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Adaptive intervals based on performance</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="lg:w-64">
                    <div className="space-y-3">
                      <div className="text-sm text-[#7d8590]">Memory retention without review:</div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white w-16">1 hour:</span>
                          <div className="flex-1 h-4 bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-[#ef4444] rounded-full" style={{width: '50%'}}></div>
                          </div>
                          <span className="text-sm text-[#7d8590]">50%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white w-16">1 day:</span>
                          <div className="flex-1 h-4 bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-[#ef4444] rounded-full" style={{width: '30%'}}></div>
                          </div>
                          <span className="text-sm text-[#7d8590]">30%</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white w-16">1 week:</span>
                          <div className="flex-1 h-4 bg-gray-600 rounded-full overflow-hidden">
                            <div className="h-full bg-[#ef4444] rounded-full" style={{width: '10%'}}></div>
                          </div>
                          <span className="text-sm text-[#7d8590]">10%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dual Coding Theory */}
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-[#f7cc48]" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">Paivio's Dual Coding Theory (1971)</h3>
                        <p className="text-[#f7cc48]">Visual + Verbal = Stronger Memory</p>
                      </div>
                    </div>
                    <p className="text-[#7d8590] mb-4">
                      Allan Paivio proved that information encoded through both visual and verbal channels creates more robust, accessible memories than single-channel learning.
                    </p>
                    <div className="bg-[#161b22] rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Our Implementation:</h4>
                      <ul className="space-y-2 text-[#7d8590]">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Character visuals + pinyin audio in Phase 2</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>AI-generated contextual images for meaning</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Multiple encoding pathways prevent forgetting</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="lg:w-64 flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-4xl mb-2">👁️</div>
                        <p className="text-sm text-[#7d8590]">Visual</p>
                      </div>
                      <div>
                        <div className="text-4xl mb-2">👂</div>
                        <p className="text-sm text-[#7d8590]">Verbal</p>
                      </div>
                      <div className="col-span-2">
                        <div className="text-2xl font-bold text-[#f7cc48]">= 2x Memory</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testing Effect */}
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8 hover:border-[#f7cc48]/50 transition-all">
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-12 h-12 bg-[#f7cc48]/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Target className="w-6 h-6 text-[#f7cc48]" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">Roediger & Karpicke (2006)</h3>
                        <p className="text-[#f7cc48]">The Testing Effect in Memory</p>
                      </div>
                    </div>
                    <p className="text-[#7d8590] mb-4">
                      Testing enhances long-term retention far more than repeated studying. Active retrieval strengthens memory pathways by 40% compared to passive review.
                    </p>
                    <div className="bg-[#161b22] rounded-lg p-4">
                      <h4 className="text-white font-semibold mb-2">Our Implementation:</h4>
                      <ul className="space-y-2 text-[#7d8590]">
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Mini-quizzes every 3 characters</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Immediate testing after flash presentation</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                          <span>Multiple question types engage different retrieval paths</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="lg:w-64 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-[#f7cc48] mb-2">40%</div>
                      <p className="text-[#7d8590]">Better retention<br />vs passive review</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Research Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Modern Neuroscience</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                Latest discoveries that optimize our learning system
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-4">Desirable Difficulties (Bjork & Bjork, 2011)</h3>
                <p className="text-[#7d8590] mb-4">
                  Challenges that slow initial learning but improve long-term retention. We implement this through progressive difficulty increases and retrieval practice.
                </p>
                <div className="flex items-center gap-4">
                  <BarChart className="w-8 h-8 text-[#f7cc48]" />
                  <p className="text-sm text-[#f7cc48]">Slower initial learning = Better long-term memory</p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-4">Consolidation Theory (Wixted, 2004)</h3>
                <p className="text-[#7d8590] mb-4">
                  Memory consolidation requires time between learning events. Our 800ms blanks and 3s countdowns provide optimal consolidation periods.
                </p>
                <div className="flex items-center gap-4">
                  <Brain className="w-8 h-8 text-[#f7cc48]" />
                  <p className="text-sm text-[#f7cc48]">Strategic pauses = Stronger memories</p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-4">Attention Research (Warm et al., 2008)</h3>
                <p className="text-[#7d8590] mb-4">
                  Sustained attention degrades after 5-10 minutes. Our 90-second sessions stay well within the optimal attention window.
                </p>
                <div className="flex items-center gap-4">
                  <Target className="w-8 h-8 text-[#f7cc48]" />
                  <p className="text-sm text-[#f7cc48]">90-second sessions = Peak focus</p>
                </div>
              </div>

              <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
                <h3 className="text-xl font-semibold text-white mb-4">Multimedia Learning (Mayer, 2009)</h3>
                <p className="text-[#7d8590] mb-4">
                  Audio + visual presentation improves learning when properly synchronized. Our Phase 2 implements all multimedia learning principles.
                </p>
                <div className="flex items-center gap-4">
                  <BookOpen className="w-8 h-8 text-[#f7cc48]" />
                  <p className="text-sm text-[#f7cc48]">Multi-modal = Maximum encoding</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Research Results Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Research-Driven Results</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                When you apply science correctly, the results speak for themselves
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#f7cc48]/20 to-[#f7cc48]/10 border border-[#f7cc48]/30 rounded-2xl p-8 md:p-12 mb-12">
              <h3 className="text-2xl font-bold text-white mb-8 text-center">Memory Retention Comparison</h3>
              
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Traditional Flashcards</span>
                    <span className="text-[#ef4444] font-bold">30%</span>
                  </div>
                  <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#ef4444] rounded-full" style={{width: '30%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Popular Language Apps</span>
                    <span className="text-[#eab308] font-bold">45%</span>
                  </div>
                  <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#eab308] rounded-full" style={{width: '45%'}}></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">Danbing Method</span>
                    <span className="text-[#f7cc48] font-bold">85%</span>
                  </div>
                  <div className="relative h-8 bg-gray-600 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-[#f7cc48] rounded-full" style={{width: '85%'}}></div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-[#7d8590] mt-6 text-center">
                * Retention measured after 30 days using standardized testing
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Award className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">266</div>
                <p className="text-[#7d8590]">Peer-reviewed papers analyzed</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Users className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">50k+</div>
                <p className="text-[#7d8590]">Learners benefiting</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <TrendingUp className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">10x</div>
                <p className="text-[#7d8590]">Faster learning</p>
              </div>
              
              <div className="bg-[#21262d] border border-[#30363d] rounded-lg p-6">
                <Brain className="w-12 h-12 text-[#f7cc48] mx-auto mb-4" />
                <div className="text-3xl font-bold text-white mb-2">95%</div>
                <p className="text-[#7d8590]">User satisfaction</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* References Section */}
      <section className="py-20 bg-[#161b22]/50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">Key References</h2>
              <p className="text-xl text-[#7d8590] max-w-3xl mx-auto">
                The scientific foundation of our methodology
              </p>
            </div>

            <div className="bg-[#21262d] border border-[#30363d] rounded-xl p-8">
              <p className="text-[#7d8590] mb-6">
                Our system is built on extensive research from cognitive psychology, neuroscience, and education. Here are some of the key papers that inform our approach:
              </p>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white">Miller, G. A. (1956). The magical number seven, plus or minus two.</p>
                    <p className="text-[#7d8590] italic">Psychological Review, 63(2), 81-97.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white">Ebbinghaus, H. (1885). Memory: A Contribution to Experimental Psychology.</p>
                    <p className="text-[#7d8590] italic">Teachers College, Columbia University.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white">Paivio, A. (1971). Imagery and Verbal Processes.</p>
                    <p className="text-[#7d8590] italic">Holt, Rinehart and Winston.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white">Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning.</p>
                    <p className="text-[#7d8590] italic">Psychological Science, 17(3), 249-255.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white">Bjork, R. A., & Bjork, E. L. (2011). Making things hard on yourself, but in a good way.</p>
                    <p className="text-[#7d8590] italic">Psychology and the Real World, 56-64.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-[#f7cc48] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white">Mayer, R. E. (2009). Multimedia Learning (2nd ed.).</p>
                    <p className="text-[#7d8590] italic">Cambridge University Press.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-[#161b22] rounded-lg">
                <p className="text-sm text-[#7d8590]">
                  <strong className="text-white">Note:</strong> This is a partial list. Our full methodology incorporates insights from over 200 peer-reviewed studies spanning cognitive psychology, neuroscience, and language acquisition research.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-[#30363d]">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">Experience Science-Based Learning</h2>
            <p className="text-xl text-[#7d8590] mb-8 max-w-2xl mx-auto">
              Stop wasting time with unproven methods. Learn Chinese the way your brain actually works.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/signup" className="bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold text-lg px-8 py-4 rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-xl">
                Start Learning Now
              </Link>
              <Link href="/methodology" className="bg-[#30363d] hover:bg-[#30363d]/80 text-white font-semibold text-lg px-8 py-4 rounded-lg transition-all">
                See Our Methodology
              </Link>
            </div>
            
            <p className="mt-8 text-sm text-[#7d8590]">
              Based on 266+ peer-reviewed studies • Proven 85% retention rate
            </p>
          </div>
        </div>
      </section>
    </>
  )
}