'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { 
  ChevronLeft,
  FolderOpen,
  Calendar,
  User,
  Hash,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Image as ImageIcon,
  Volume2,
  Search,
  Filter,
  Loader2,
  Shield,
  Zap,
  XCircle,
  Activity,
  TrendingUp,
  Award,
  AlertTriangle,
  Grid3X3,
  List
} from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'
import AdminCharacterInsights from '@/components/AdminCharacterInsights'

interface Card {
  _id: string
  hanzi: string
  pinyin: string
  meaning: string
  imageUrl?: string | null
  audioUrl?: string | null
  createdAt: Date
  updatedAt: Date
}

interface DeckDetail {
  _id: string
  name: string
  description: string
  userId: string
  cardsCount: number
  status: string
  enrichmentProgress: {
    totalCards: number
    processedCards: number
    currentOperation: string
  } | null
  createdAt: Date
  updatedAt: Date
  user?: {
    id: string
    email: string
    name: string | null
  }
  cards: Card[]
}

export default function AdminDeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { data: session, status } = useSession()
  const { showAlert } = useAlert()
  const [deck, setDeck] = useState<DeckDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'enriched' | 'pending' | 'failed'>('all')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [reEnrichingCards, setReEnrichingCards] = useState<Set<string>>(new Set())
  const [enrichmentStatus, setEnrichmentStatus] = useState<Map<string, string>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; hanzi: string } | null>(null)
  const [userPerformance, setUserPerformance] = useState<any>(null)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const pollIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'admin') {
      showAlert('Access denied. Admin privileges required.', { type: 'error' })
      router.push('/decks')
      return
    }

    fetchDeck()
  }, [session, status, router, showAlert])

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      // Clear all polling intervals
      pollIntervalsRef.current.forEach((interval) => {
        clearInterval(interval)
      })
      pollIntervalsRef.current.clear()
    }
  }, [])

  const fetchDeck = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/decks/${resolvedParams.deckId}`)
      if (!response.ok) throw new Error('Failed to fetch deck')

      const data = await response.json()
      setDeck(data)
      
      // Fetch user performance data
      if (data.userId) {
        try {
          const perfResponse = await fetch(`/api/admin/users/${data.userId}/performance`)
          if (perfResponse.ok) {
            const perfData = await perfResponse.json()
            setUserPerformance(perfData.performance)
          }
        } catch (error) {
          console.error('Error fetching user performance:', error)
        }
      }
    } catch (error) {
      console.error('Error fetching deck:', error)
      showAlert('Failed to fetch deck details', { type: 'error' })
      router.push('/admin')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDeck()
  }

  const handleReEnrichCard = async (cardId: string) => {
    try {
      setReEnrichingCards(prev => new Set(prev).add(cardId))
      setEnrichmentStatus(prev => new Map(prev).set(cardId, 'Starting enrichment...'))
      
      const response = await fetch(`/api/admin/cards/${cardId}/re-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deckId: resolvedParams.deckId })
      })

      if (!response.ok) throw new Error('Failed to re-enrich card')

      const result = await response.json()
      const jobId = result.jobId
      
      // If no jobId returned, clean up immediately
      if (!jobId) {
        throw new Error('No job ID returned from server')
      }
      
      // Clear any existing interval for this card
      const existingInterval = pollIntervalsRef.current.get(cardId)
      if (existingInterval) {
        clearInterval(existingInterval)
        pollIntervalsRef.current.delete(cardId)
      }
      
      // Poll for job status
      const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/admin/jobs/${jobId}/status`)
            
            if (!statusResponse.ok) {
              throw new Error('Failed to fetch job status')
            }
            
            const jobStatus = await statusResponse.json()
            
            // Update status message based on progress
            if (jobStatus.progress?.stage) {
              setEnrichmentStatus(prev => new Map(prev).set(cardId, jobStatus.progress.message || 'Processing...'))
            }
            
            console.log(`Job ${jobId} status:`, jobStatus.state, jobStatus.progress)
            
            // Check if job is in a terminal state
            const terminalStates = ['completed', 'failed']
            if (terminalStates.includes(jobStatus.state)) {
              clearInterval(pollInterval)
              pollIntervalsRef.current.delete(cardId)
              setReEnrichingCards(prev => {
                const next = new Set(prev)
                next.delete(cardId)
                return next
              })
              setEnrichmentStatus(prev => {
                const next = new Map(prev)
                next.delete(cardId)
                return next
              })
              fetchDeck() // Refresh to show updated data
              
              if (jobStatus.state === 'failed') {
                const failureReason = jobStatus.failedReason || 'Unknown error'
                console.error('Enrichment failed:', failureReason)
                showAlert(`Re-enrichment failed: ${failureReason}`, { type: 'error' })
              }
            }
            
            // Also handle if job doesn't exist anymore
            if (!jobStatus.state) {
              throw new Error('Job state not found')
            }
          } catch (error) {
            console.error('Error polling job status:', error)
            clearInterval(pollInterval)
            pollIntervalsRef.current.delete(cardId)
            setReEnrichingCards(prev => {
              const next = new Set(prev)
              next.delete(cardId)
              return next
            })
            setEnrichmentStatus(prev => {
              const next = new Map(prev)
              next.delete(cardId)
              return next
            })
          }
        }, 1000) // Poll every second
        
        // Store the interval in our ref
        pollIntervalsRef.current.set(cardId, pollInterval)
        
        // Stop polling after 2 minutes and clean up state
        setTimeout(() => {
          const interval = pollIntervalsRef.current.get(cardId)
          if (interval) {
            clearInterval(interval)
            pollIntervalsRef.current.delete(cardId)
          }
          setReEnrichingCards(prev => {
            const next = new Set(prev)
            next.delete(cardId)
            return next
          })
          setEnrichmentStatus(prev => {
            const next = new Map(prev)
            next.delete(cardId)
            return next
          })
        }, 120000)
    } catch (error) {
      console.error('Error re-enriching card:', error)
      showAlert('Failed to start re-enrichment', { type: 'error' })
      setReEnrichingCards(prev => {
        const next = new Set(prev)
        next.delete(cardId)
        return next
      })
      setEnrichmentStatus(prev => {
        const next = new Map(prev)
        next.delete(cardId)
        return next
      })
    }
  }

  const handleBulkReEnrich = async () => {
    if (selectedCards.size === 0) {
      showAlert('Please select cards to re-enrich', { type: 'info' })
      return
    }

    try {
      const response = await fetch('/api/admin/cards/bulk-re-enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardIds: Array.from(selectedCards),
          deckId: resolvedParams.deckId 
        })
      })

      if (!response.ok) throw new Error('Failed to re-enrich cards')

      await response.json()
      showAlert(`Re-enrichment started for ${selectedCards.size} cards`, { type: 'success' })
      setSelectedCards(new Set())
      
      // Refresh after a delay
      setTimeout(() => fetchDeck(), 2000)
    } catch (error) {
      console.error('Error bulk re-enriching:', error)
      showAlert('Failed to start bulk re-enrichment', { type: 'error' })
    }
  }

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Never'
    const d = new Date(date)
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(d)
  }

  const getFilteredCards = () => {
    if (!deck) return []
    
    let filtered = deck.cards

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(card => 
        card.hanzi.includes(searchTerm) ||
        card.pinyin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        card.meaning.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter based on media presence
    if (filterStatus !== 'all') {
      filtered = filtered.filter(card => {
        const hasMedia = !!(card.imageUrl && card.audioUrl)
        const hasPartialMedia = !!(card.imageUrl || card.audioUrl)
        
        if (filterStatus === 'enriched') return hasMedia
        if (filterStatus === 'pending') return !hasPartialMedia
        if (filterStatus === 'failed') return hasPartialMedia && !hasMedia
        return true
      })
    }

    return filtered
  }

  const toggleCardSelection = (cardId: string) => {
    setSelectedCards(prev => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }

  const selectAll = () => {
    const filtered = getFilteredCards()
    if (selectedCards.size === filtered.length) {
      setSelectedCards(new Set())
    } else {
      setSelectedCards(new Set(filtered.map(c => c._id)))
    }
  }

  const getEnrichmentStatus = (card: Card) => {
    if (card.imageUrl && card.audioUrl) return 'enriched'
    if (card.imageUrl || card.audioUrl) return 'partial'
    return 'pending'
  }

  const playAudio = (audioUrl: string) => {
    if (playingAudio === audioUrl) {
      setPlayingAudio(null)
    } else {
      setPlayingAudio(audioUrl)
      const audio = new Audio(audioUrl)
      audio.play()
      audio.onended = () => setPlayingAudio(null)
    }
  }

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / 3600000)
    const minutes = Math.floor((ms % 3600000) / 60000)
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  if (loading || status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#f7cc48]" />
            <span className="text-lg">Loading deck details...</span>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (!deck) return null

  const filteredCards = getFilteredCards()

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Admin Panel
            </Link>

            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <FolderOpen className="w-8 h-8 text-[#f7cc48]" />
                  <h1 className="text-3xl font-bold text-[#f7cc48]">{deck.name}</h1>
                </div>
                {deck.description && (
                  <p className="text-gray-400 mb-4">{deck.description}</p>
                )}
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {/* Deck Info */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-sm">Owner</span>
                </div>
                <p className="text-white font-medium">{deck.user?.email || 'Unknown'}</p>
                {deck.user?.name && (
                  <p className="text-sm text-gray-500">{deck.user.name}</p>
                )}
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">Total Cards</span>
                </div>
                <p className="text-2xl font-bold text-white">{deck.cardsCount}</p>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Status</span>
                </div>
                <div className="flex items-center gap-2">
                  {deck.status === 'ready' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {deck.status === 'enriching' && <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />}
                  {deck.status === 'failed' && <XCircle className="w-5 h-5 text-red-500" />}
                  <span className={`font-medium ${
                    deck.status === 'ready' ? 'text-green-400' : 
                    deck.status === 'enriching' ? 'text-blue-400' : 
                    'text-red-400'
                  }`}>
                    {deck.status.charAt(0).toUpperCase() + deck.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">Created</span>
                </div>
                <p className="text-white">{formatDate(deck.createdAt)}</p>
              </div>
            </div>

            {/* Deck Owner Performance */}
            {userPerformance && (
              <div className="mt-6 bg-[#232937] rounded-lg p-6 border border-[#2d3548]">
                <h3 className="text-xl font-semibold mb-4 text-[#f7cc48] flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Deck Owner Performance
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <div className="text-sm text-gray-300 flex items-center gap-1 mb-1">
                      <Activity className="w-3 h-3" />
                      Total Reviews
                    </div>
                    <div className="text-2xl font-bold text-white">{userPerformance.totalReviews.toLocaleString()}</div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <div className="text-sm text-gray-300 flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3" />
                      Avg Accuracy
                    </div>
                    <div className={`text-2xl font-bold ${
                      userPerformance.averageAccuracy >= 80 ? 'text-green-400' :
                      userPerformance.averageAccuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {userPerformance.averageAccuracy.toFixed(0)}%
                    </div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <div className="text-sm text-gray-300 flex items-center gap-1 mb-1">
                      <Clock className="w-3 h-3" />
                      Study Time
                    </div>
                    <div className="text-2xl font-bold text-white">{formatTime(userPerformance.totalStudyTime)}</div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <div className="text-sm text-gray-300 flex items-center gap-1 mb-1">
                      <Award className="w-3 h-3" />
                      Cards Mastered
                    </div>
                    <div className="text-2xl font-bold text-green-400">{userPerformance.cardsMastered}</div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <div className="text-sm text-gray-300 flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3" />
                      Cards Learning
                    </div>
                    <div className="text-2xl font-bold text-yellow-400">{userPerformance.cardsLearned}</div>
                  </div>
                  <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                    <div className="text-sm text-gray-300 mb-1">Response Time</div>
                    <div className="text-2xl font-bold text-white">{(userPerformance.averageResponseTime / 1000).toFixed(1)}s</div>
                  </div>
                </div>
              </div>
            )}

            {deck.status === 'enriching' && deck.enrichmentProgress && (
              <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-sm font-medium text-blue-400">Enrichment in Progress</span>
                </div>
                <p className="text-sm text-gray-300">{deck.enrichmentProgress.currentOperation}</p>
                <div className="mt-2 bg-[#0d1117] rounded-full overflow-hidden">
                  <div 
                    className="h-2 bg-blue-500 transition-all duration-300"
                    style={{ 
                      width: `${(deck.enrichmentProgress.processedCards / deck.enrichmentProgress.totalCards) * 100}%` 
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {deck.enrichmentProgress.processedCards} / {deck.enrichmentProgress.totalCards} cards processed
                </p>
              </div>
            )}
          </div>

          {/* Cards Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#f7cc48]" />
              Cards Management
            </h2>

            {/* Controls */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by hanzi, pinyin, or meaning..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
                    />
                  </div>
                </div>

                {/* Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
                  >
                    <option value="all">All Cards</option>
                    <option value="enriched">Fully Enriched</option>
                    <option value="pending">Not Enriched</option>
                    <option value="failed">Partially Enriched</option>
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'table' 
                        ? 'bg-[#f7cc48] text-black' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Table view"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-[#f7cc48] text-black' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                    title="Grid view"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors"
                  >
                    {selectedCards.size === filteredCards.length ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  {selectedCards.size > 0 && (
                    <button
                      onClick={handleBulkReEnrich}
                      className="flex items-center gap-2 px-4 py-2 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium rounded-lg transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      Re-enrich {selectedCards.size} Cards
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Cards Table/Grid */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              {filteredCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Hash className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400">No cards found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0d1117] border-b border-[#30363d]">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedCards.size === filteredCards.length}
                            onChange={selectAll}
                            className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Character
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Pinyin
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Meaning
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Media
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Last Updated
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363d]">
                      {filteredCards.map((card) => (
                        <tr key={card._id} className="hover:bg-[#0d1117] transition-colors">
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedCards.has(card._id)}
                              onChange={() => toggleCardSelection(card._id)}
                              className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => setSelectedCharacter({ id: card._id, hanzi: card.hanzi })}
                              className="text-2xl font-bold text-[#f7cc48] hover:text-[#f7cc48]/80 transition-colors cursor-pointer"
                            >
                              {card.hanzi}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-white">{card.pinyin}</td>
                          <td className="px-6 py-4 text-gray-300">{card.meaning}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {card.imageUrl && (
                                <button
                                  onClick={() => setPreviewImage(card.imageUrl || null)}
                                  className="p-1 hover:bg-[#21262d] rounded transition-colors"
                                  title="Click to preview image"
                                >
                                  <ImageIcon className="w-4 h-4 text-green-500" />
                                </button>
                              )}
                              {card.audioUrl && (
                                <button
                                  onClick={() => playAudio(card.audioUrl!)}
                                  className="p-1 hover:bg-[#21262d] rounded transition-colors"
                                  title="Click to play audio"
                                >
                                  <Volume2 className={`w-4 h-4 ${playingAudio === card.audioUrl ? 'text-[#f7cc48] animate-pulse' : 'text-green-500'}`} />
                                </button>
                              )}
                              {!card.imageUrl && !card.audioUrl && (
                                <span className="text-xs text-gray-500">No media</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {formatDate(card.updatedAt)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleReEnrichCard(card._id)}
                              disabled={reEnrichingCards.has(card._id)}
                              className="flex items-center gap-2 px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              {reEnrichingCards.has(card._id) ? (
                                <div className="flex items-center gap-2">
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span className="text-xs">{enrichmentStatus.get(card._id) || 'Processing...'}</span>
                                </div>
                              ) : (
                                <>
                                  <Zap className="w-3 h-3" />
                                  Re-enrich
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div className="flex flex-wrap gap-4 p-6 justify-center">
                  {filteredCards.map((card) => {
                    const enrichStatus = getEnrichmentStatus(card)
                    const isReEnriching = reEnrichingCards.has(card._id)
                    
                    return (
                      <div
                        key={card._id}
                        className="bg-[#0d1117] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#f7cc48]/50 transition-all w-[320px]"
                      >
                        {/* Checkbox and Status */}
                        <div className="p-3 border-b border-[#30363d] flex items-center justify-between">
                          <input
                            type="checkbox"
                            checked={selectedCards.has(card._id)}
                            onChange={() => toggleCardSelection(card._id)}
                            className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                          />
                          <div className="flex items-center gap-2">
                            {enrichStatus === 'enriched' && (
                              <div className="flex items-center gap-1 text-green-500" title="Fully enriched">
                                <CheckCircle className="w-4 h-4" />
                              </div>
                            )}
                            {enrichStatus === 'partial' && (
                              <div className="flex items-center gap-1 text-yellow-500" title="Partially enriched">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                            )}
                            {enrichStatus === 'pending' && (
                              <div className="flex items-center gap-1 text-red-500" title="Not enriched">
                                <XCircle className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Character Display */}
                        <div 
                          className="p-6 text-center cursor-pointer hover:bg-[#21262d] transition-colors"
                          onClick={() => setSelectedCharacter({ id: card._id, hanzi: card.hanzi })}
                        >
                          <div className={`font-bold mb-2 ${card.hanzi.length > 2 ? 'text-4xl' : 'text-6xl'}`}>{card.hanzi}</div>
                          <div className="text-lg text-[#f7cc48] mb-1">{card.pinyin}</div>
                          <div className="text-sm text-gray-400 line-clamp-2 px-2">{card.meaning}</div>
                        </div>
                        
                        {/* Image */}
                        {card.imageUrl ? (
                          <div className="aspect-square bg-gray-900 relative group">
                            <img
                              src={card.imageUrl}
                              alt={card.hanzi}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>'
                                }
                              }}
                            />
                            <button
                              onClick={() => setPreviewImage(card.imageUrl!)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                            >
                              <ImageIcon className="w-8 h-8 text-white" />
                            </button>
                          </div>
                        ) : (
                          <div className="aspect-square bg-gray-900 flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                        
                        {/* Actions */}
                        <div className="p-3 border-t border-[#30363d] flex flex-col gap-2">
                          {card.audioUrl ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                playAudio(card.audioUrl!)
                              }}
                              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                              title="Play audio"
                            >
                              <Volume2 className={`w-4 h-4 ${playingAudio === card.audioUrl ? 'text-[#f7cc48]' : 'text-gray-400'}`} />
                              <span className="text-sm text-gray-400">Audio</span>
                            </button>
                          ) : (
                            <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#161b22] rounded-lg cursor-not-allowed">
                              <Volume2 className="w-4 h-4 text-gray-600" />
                              <span className="text-sm text-gray-600">No audio</span>
                            </div>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReEnrichCard(card._id)
                            }}
                            disabled={isReEnriching}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isReEnriching 
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black'
                            }`}
                          >
                            {isReEnriching ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                <span className="text-xs">Enriching...</span>
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                <span>Re-enrich</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-[#f7cc48] transition-colors"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <img 
              src={previewImage} 
              alt="Card preview" 
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
      
      {/* Character Insights Modal */}
      {selectedCharacter && deck?.userId && (
        <AdminCharacterInsights
          characterId={selectedCharacter.id}
          character={selectedCharacter.hanzi}
          userId={deck.userId}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
      
      <Footer />
    </>
  )
}