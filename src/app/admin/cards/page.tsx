'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { 
  ChevronLeft,
  ChevronRight,
  Calendar,
  Hash,
  RefreshCw,
  Image as ImageIcon,
  Volume2,
  Search,
  Filter,
  Loader2,
  Shield,
  Zap,
  XCircle,
  CheckCircle,
  AlertCircle,
  BookOpen,
  BarChart3
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

interface PaginationInfo {
  page: number
  limit: number
  totalCount: number
  totalPages: number
  hasMore: boolean
}

interface Stats {
  total: number
  enriched: number
  partial: number
  pending: number
}

export default function AdminCardsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { showAlert } = useAlert()
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'enriched' | 'pending' | 'partial'>('all')
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  const [reEnrichingCards, setReEnrichingCards] = useState<Set<string>>(new Set())
  const [enrichmentStatus, setEnrichmentStatus] = useState<Map<string, string>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; hanzi: string } | null>(null)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0,
    hasMore: false
  })
  const [stats, setStats] = useState<Stats>({
    total: 0,
    enriched: 0,
    partial: 0,
    pending: 0
  })
  const [sortBy, setSortBy] = useState<'updatedAt' | 'createdAt' | 'hanzi'>('updatedAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const pollIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user is admin
  useEffect(() => {
    if (status === 'loading') return
    
    if (!session?.user) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'admin') {
      showAlert('Access denied. Admin privileges required.', { type: 'error' })
      router.push('/dashboard')
      return
    }

    fetchCards()
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

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (pagination.page !== 1) {
        setPagination(prev => ({ ...prev, page: 1 }))
      } else {
        fetchCards()
      }
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Re-fetch when filters change
  useEffect(() => {
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }))
    } else {
      fetchCards()
    }
  }, [filterStatus, sortBy, sortOrder])

  // Re-fetch when page changes
  useEffect(() => {
    fetchCards()
  }, [pagination.page])

  const fetchCards = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: filterStatus,
        sortBy,
        sortOrder
      })

      const response = await fetch(`/api/admin/cards?${params}`)
      if (!response.ok) throw new Error('Failed to fetch cards')

      const data = await response.json()
      setCards(data.cards)
      setPagination(data.pagination)
      setStats(data.stats)
    } catch (error) {
      console.error('Error fetching cards:', error)
      showAlert('Failed to fetch cards', { type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCards()
  }

  const handleReEnrichCard = async (cardId: string) => {
    try {
      setReEnrichingCards(prev => new Set(prev).add(cardId))
      setEnrichmentStatus(prev => new Map(prev).set(cardId, 'Starting enrichment...'))
      
      const response = await fetch(`/api/admin/cards/${cardId}/re-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
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
              fetchCards() // Refresh to show updated data
              
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
          cardIds: Array.from(selectedCards)
        })
      })

      if (!response.ok) throw new Error('Failed to re-enrich cards')

      const result = await response.json()
      showAlert(`Re-enrichment started for ${selectedCards.size} cards`, { type: 'success' })
      setSelectedCards(new Set())
      
      // Refresh after a delay
      setTimeout(() => fetchCards(), 2000)
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
    if (selectedCards.size === cards.length) {
      setSelectedCards(new Set())
    } else {
      setSelectedCards(new Set(cards.map(c => c._id)))
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

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (loading || status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#f7cc48]" />
            <span className="text-lg">Loading cards...</span>
          </div>
        </div>
        <Footer />
      </>
    )
  }

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
                  <BookOpen className="w-8 h-8 text-[#f7cc48]" />
                  <h1 className="text-3xl font-bold text-[#f7cc48]">All Cards</h1>
                </div>
                <p className="text-gray-400">Manage all characters in the database</p>
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

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <button
                onClick={() => setFilterStatus('all')}
                className={`bg-[#161b22] border rounded-lg p-4 text-left transition-all ${
                  filterStatus === 'all' 
                    ? 'border-[#f7cc48] ring-2 ring-[#f7cc48]/20' 
                    : 'border-[#30363d] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <Hash className="w-4 h-4" />
                  <span className="text-sm">Total Cards</span>
                </div>
                <p className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</p>
              </button>

              <button
                onClick={() => setFilterStatus('enriched')}
                className={`bg-[#161b22] border rounded-lg p-4 text-left transition-all ${
                  filterStatus === 'enriched' 
                    ? 'border-[#f7cc48] ring-2 ring-[#f7cc48]/20' 
                    : 'border-[#30363d] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm">Fully Enriched</span>
                </div>
                <p className="text-2xl font-bold text-green-400">{stats.enriched.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? `${((stats.enriched / stats.total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </button>

              <button
                onClick={() => setFilterStatus('partial')}
                className={`bg-[#161b22] border rounded-lg p-4 text-left transition-all ${
                  filterStatus === 'partial' 
                    ? 'border-[#f7cc48] ring-2 ring-[#f7cc48]/20' 
                    : 'border-[#30363d] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">Partially Enriched</span>
                </div>
                <p className="text-2xl font-bold text-yellow-400">{stats.partial.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? `${((stats.partial / stats.total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </button>

              <button
                onClick={() => setFilterStatus('pending')}
                className={`bg-[#161b22] border rounded-lg p-4 text-left transition-all ${
                  filterStatus === 'pending' 
                    ? 'border-[#f7cc48] ring-2 ring-[#f7cc48]/20' 
                    : 'border-[#30363d] hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm">Not Enriched</span>
                </div>
                <p className="text-2xl font-bold text-gray-400">{stats.pending.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}%` : '0%'}
                </p>
              </button>
            </div>
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
                    <option value="partial">Partially Enriched</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-400" />
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split('-')
                      setSortBy(field as any)
                      setSortOrder(order as any)
                    }}
                    className="px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
                  >
                    <option value="updatedAt-desc">Recently Updated</option>
                    <option value="updatedAt-asc">Oldest Updated</option>
                    <option value="createdAt-desc">Recently Created</option>
                    <option value="createdAt-asc">Oldest Created</option>
                    <option value="hanzi-asc">Character (A-Z)</option>
                    <option value="hanzi-desc">Character (Z-A)</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={selectAll}
                    className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors"
                  >
                    {selectedCards.size === cards.length ? 'Deselect All' : 'Select All'}
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

            {/* Cards Table */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <Hash className="w-12 h-12 text-gray-600 mb-3" />
                  <p className="text-gray-400">No cards found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0d1117] border-b border-[#30363d]">
                      <tr>
                        <th className="px-6 py-3 text-left">
                          <input
                            type="checkbox"
                            checked={selectedCards.size === cards.length && cards.length > 0}
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
                      {cards.map((card) => (
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
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-lg p-4">
                <div className="text-sm text-gray-400">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.totalCount)} of {pagination.totalCount} cards
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`px-3 py-1 rounded-md transition-colors ${
                            pageNum === pagination.page
                              ? 'bg-[#f7cc48] text-black font-medium'
                              : 'bg-[#21262d] hover:bg-[#30363d] text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasMore}
                    className="px-3 py-1 bg-[#21262d] hover:bg-[#30363d] text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
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
      {selectedCharacter && (
        <AdminCharacterInsights
          characterId={selectedCharacter.id}
          character={selectedCharacter.hanzi}
          userId={session?.user?.id || ''}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
      
      <Footer />
    </>
  )
}