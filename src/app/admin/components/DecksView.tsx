'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FolderOpen,
  User,
  Calendar,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Zap,
  CheckCircle,
  XCircle,
  Loader2,
  BarChart3,
  Package,
  Eye
} from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'

interface Deck {
  _id: string
  userId: string
  name: string
  slug: string
  cardsCount: number
  status: 'ready' | 'importing' | 'enriching' | 'failed'
  createdAt: string
  updatedAt: string
  enrichmentProgress?: {
    totalCards: number
    processedCards: number
    currentOperation?: string
  }
  user?: {
    email: string
    name: string | null
  }
}

interface DeckStats {
  totalDecks: number
  totalCards: number
  readyDecks: number
  importingDecks: number
  enrichingDecks: number
  failedDecks: number
  decksToday: number
  decksThisWeek: number
  decksThisMonth: number
}

export default function DecksView() {
  const { showAlert, showConfirm } = useAlert()
  const [decks, setDecks] = useState<Deck[]>([])
  const [stats, setStats] = useState<DeckStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'importing' | 'enriching' | 'failed'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [enrichingDeck, setEnrichingDeck] = useState<string | null>(null)

  const itemsPerPage = 10

  useEffect(() => {
    fetchDecks()
  }, [currentPage, searchTerm, filterStatus])

  // Auto-refresh when there are enriching decks
  useEffect(() => {
    const hasEnrichingDecks = decks.some(deck => deck.status === 'enriching')
    if (!hasEnrichingDecks) return

    const interval = setInterval(() => {
      fetchDecks()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [decks])

  const fetchDecks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        status: filterStatus
      })

      const response = await fetch(`/api/admin/decks?${params}`)
      if (!response.ok) throw new Error('Failed to fetch decks')

      const data = await response.json()
      setDecks(data.decks)
      setStats(data.stats)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching decks:', error)
      showAlert('Failed to fetch decks', { type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchDecks()
  }

  const handleReEnrich = async (deckId: string, forceRegenerate: boolean = false) => {
    const message = forceRegenerate
      ? 'Force re-enrich will delete and regenerate ALL images (audio will be kept). This will use more API credits.'
      : 'Re-enrich will only generate missing images and audio files. Existing media will be kept.'
    
    const confirmed = await showConfirm(
      message,
      {
        type: forceRegenerate ? 'error' : 'warning',
        confirmText: forceRegenerate ? 'Force Re-enrich' : 'Re-enrich',
        cancelText: 'Cancel'
      }
    )

    if (!confirmed) return

    try {
      setEnrichingDeck(deckId)
      
      const response = await fetch(`/api/admin/decks/${deckId}/re-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: forceRegenerate })
      })

      if (!response.ok) throw new Error('Failed to start re-enrichment')

      const data = await response.json()
      showAlert(`${forceRegenerate ? 'Force r' : 'R'}e-enrichment started for deck. Job ID: ${data.jobId}`, { type: 'success' })
      
      // Refresh to show updated status
      setTimeout(() => fetchDecks(), 1000)
    } catch (error) {
      console.error('Error re-enriching deck:', error)
      showAlert('Failed to start re-enrichment', { type: 'error' })
    } finally {
      setEnrichingDeck(null)
    }
  }

  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getTimeSince = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
    return `${Math.floor(diffDays / 365)} years ago`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300">
            <CheckCircle className="w-3 h-3" />
            Ready
          </span>
        )
      case 'importing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300">
            <Loader2 className="w-3 h-3 animate-spin" />
            Importing
          </span>
        )
      case 'enriching':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/50 text-yellow-300">
            <Zap className="w-3 h-3" />
            Enriching
          </span>
        )
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-300">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <FolderOpen className="w-5 h-5 text-[#f7cc48]" />
              <span className="text-2xl font-bold text-white">{stats.totalDecks}</span>
            </div>
            <p className="text-sm text-gray-400">Total Decks</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.totalCards} total cards
            </p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-white">{stats.readyDecks}</span>
            </div>
            <p className="text-sm text-gray-400">Ready Decks</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.readyDecks / stats.totalDecks) * 100)}% of total
            </p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-white">{stats.decksToday}</span>
            </div>
            <p className="text-sm text-gray-400">New Today</p>
            <p className="text-xs text-gray-500 mt-1">
              This week: {stats.decksThisWeek} | This month: {stats.decksThisMonth}
            </p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-white">
                {stats.totalDecks > 0 ? Math.round(stats.totalCards / stats.totalDecks) : 0}
              </span>
            </div>
            <p className="text-sm text-gray-400">Avg Cards/Deck</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by deck name or user email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
              />
            </div>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
            >
              <option value="all">All Decks</option>
              <option value="ready">Ready</option>
              <option value="importing">Importing</option>
              <option value="enriching">Enriching</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          
          {/* Auto-refresh indicator */}
          {decks.some(d => d.status === 'enriching') && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#f7cc48]/10 text-[#f7cc48] text-sm rounded-lg">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Auto-refreshing
            </div>
          )}
        </div>
      </div>

      {/* Decks Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-[#f7cc48]" />
              <span className="text-gray-400">Loading decks...</span>
            </div>
          </div>
        ) : decks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400">No decks found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0d1117] border-b border-[#30363d]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Deck
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Cards
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]">
                  {decks.map((deck) => (
                    <tr key={deck._id} className="hover:bg-[#0d1117] transition-colors">
                      <td className="px-6 py-4">
                        <Link href={`/admin/decks/${deck._id}`} className="block hover:opacity-80 transition-opacity">
                          <div className="text-white font-medium hover:text-[#f7cc48] transition-colors">
                            {deck.name}
                          </div>
                          <div className="text-sm text-gray-400">/deck/{deck.slug}</div>
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {deck.user ? (
                          <div className="text-sm">
                            <div className="text-white">{deck.user.name || 'Unnamed'}</div>
                            <div className="text-gray-400 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {deck.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-500">Unknown user</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          {getStatusBadge(deck.status)}
                          {deck.status === 'enriching' && deck.enrichmentProgress && (
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>{deck.enrichmentProgress.currentOperation || 'Processing...'}</span>
                                <span>{deck.enrichmentProgress.processedCards}/{deck.enrichmentProgress.totalCards}</span>
                              </div>
                              <div className="w-full bg-[#0d1117] rounded-full h-1.5">
                                <div 
                                  className="bg-[#f7cc48] h-1.5 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${(deck.enrichmentProgress.processedCards / deck.enrichmentProgress.totalCards) * 100}%` 
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <Package className="w-4 h-4 text-gray-400" />
                          <span className="text-white font-medium">{deck.cardsCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-white">{getTimeSince(deck.createdAt)}</div>
                          <div className="text-xs text-gray-500">{formatDate(deck.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/decks/${deck._id}`}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </Link>
                          <button
                            onClick={(e) => handleReEnrich(deck._id, e.shiftKey)}
                            disabled={deck.status !== 'ready' || enrichingDeck === deck._id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={deck.status === 'ready' ? 'Click to re-enrich missing media. Shift+click to force regenerate all media.' : ''}
                          >
                            {enrichingDeck === deck._id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )}
                            Re-enrich
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="bg-[#0d1117] border-t border-[#30363d] px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}