'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CharacterInsights from '@/components/CharacterInsights'
import FlashSession from '@/components/FlashSession'
import { BarChart3, Zap, Clock, Edit2, Check, X, Plus, Loader2, Sparkles, Brain, Trash2 } from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'
import { formatRelativeTime } from '@/lib/utils/date'
import { validateTraditionalChinese } from '@/lib/utils/chinese-validation'
import DisambiguationModal from '@/components/DisambiguationModal'
import { useAudio } from '@/contexts/AudioContext'

interface CardStats {
  totalReviews: number
  correctReviews: number
  accuracy: number
  lastReviewed: string | null
  difficulty: number
}

interface Card {
  _id: string
  hanzi: string
  pinyin: string
  english: string[]
  imageUrl?: string
  audioUrl?: string
  stats?: CardStats
  semanticCategory?: string
  tonePattern?: string
  overallDifficulty?: number
}

interface Deck {
  _id: string
  name: string
  cards: Card[]
}

export default function DeckView() {
  const params = useParams()
  const router = useRouter()
  const deckId = params.deckId as string
  const [deck, setDeck] = useState<Deck | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; hanzi: string; card?: Card } | null>(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newCharacter, setNewCharacter] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [enrichingCards, setEnrichingCards] = useState<Map<string, { jobId: string; progress: string; hanzi: string }>>(new Map())
  const [deckStats, setDeckStats] = useState<any>(null)
  const [view, setView] = useState<"deck" | "session">("deck")
  const [sessionMode, setSessionMode] = useState<"new" | "review" | "practice">("new")
  const [disambiguationData, setDisambiguationData] = useState<{
    characters: Array<{
      hanzi: string
      position: number
      meanings: Array<{
        pinyin: string
        meaning: string
        frequency?: string
      }>
    }>
  } | null>(null)
  const [pendingCharacter, setPendingCharacter] = useState<string | null>(null)
  const { showAlert, showConfirm } = useAlert()
  const { playAudio } = useAudio()

  const fetchDeck = useCallback(async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch deck')
      }
      const data = await response.json()
      setDeck(data)
      
      // Fetch deck stats
      try {
        const statsResponse = await fetch(`/api/decks/${deckId}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setDeckStats(statsData.stats)
        }
      } catch (error) {
        console.error('Failed to fetch deck stats:', error)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck')
    }
  }, [deckId])

  const handleStartSession = (mode: "new" | "review" | "practice") => {
    setSessionMode(mode)
    setView("session")
  }

  const handleExitSession = () => {
    setView("deck")
    fetchDeck() // Refresh stats after session
  }

  const handleEditStart = () => {
    if (deck) {
      setIsEditingName(true)
      setEditName(deck.name)
    }
  }

  const handleEditCancel = () => {
    setIsEditingName(false)
    setEditName('')
  }

  const handleEditSave = async () => {
    if (!deck || !editName.trim() || editName === deck.name) {
      handleEditCancel()
      return
    }

    try {
      const response = await fetch(`/api/decks/${deckId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setDeck({ ...deck, name: editName.trim() })
        showAlert('Deck name updated successfully', { type: 'success' })
      } else {
        showAlert(`Failed to update deck name: ${data.error}`, { type: 'error' })
      }
    } catch (error) {
      console.error('Update error:', error)
      showAlert('Failed to update deck name. Please try again.', { type: 'error' })
    } finally {
      handleEditCancel()
    }
  }

  // Generic function to poll enrichment job status
  const pollEnrichmentJob = useCallback((jobId: string, cardId: string, hanzi: string) => {
    let attempts = 0
    const maxAttempts = 120 // 2 minutes timeout
    
    const pollInterval = setInterval(async () => {
      attempts++
      
      try {
        const statusResponse = await fetch(`/api/jobs/${jobId}/status`)
        const jobStatus = await statusResponse.json()
        
        // Update progress message for this specific card
        let progressMessage = 'Enriching...'
        
        if (jobStatus.progress?.stage) {
          const stage = jobStatus.progress.stage
          switch (stage) {
            case 'initializing':
              progressMessage = 'Initializing...'
              break
            case 'card_loaded':
              progressMessage = 'Processing...'
              break
            case 'ai_interpretation':
              progressMessage = 'Getting meaning...'
              break
            case 'generating_image':
              progressMessage = 'Creating image...'
              break
            case 'generating_audio':
              progressMessage = 'Generating audio...'
              break
            case 'generating_insights':
              progressMessage = 'Creating insights...'
              break
            case 'saving':
              progressMessage = 'Saving...'
              break
            default:
              if (jobStatus.progress?.message) {
                progressMessage = jobStatus.progress.message
              }
          }
        }
        
        // Update the progress for this specific card
        setEnrichingCards(prev => {
          const updated = new Map(prev)
          if (updated.has(cardId)) {
            updated.set(cardId, {
              jobId: jobId,
              progress: progressMessage,
              hanzi: hanzi
            })
          }
          return updated
        })
        
        if (jobStatus.state === 'completed') {
          clearInterval(pollInterval)
          // Remove from enriching cards immediately
          setEnrichingCards(prev => {
            const updated = new Map(prev)
            updated.delete(cardId)
            return updated
          })
          
          // Refresh the deck to show enriched card
          fetchDeck()
        } else if (jobStatus.state === 'failed' || attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setEnrichingCards(prev => {
            const updated = new Map(prev)
            updated.delete(cardId)
            return updated
          })
          
          // Only show alert for failures, not timeouts
          if (jobStatus.state === 'failed') {
            showAlert(`Enrichment failed for ${hanzi}`, { type: 'warning' })
          }
          fetchDeck()
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          setEnrichingCards(prev => {
            const updated = new Map(prev)
            updated.delete(cardId)
            return updated
          })
          fetchDeck()
        }
      }
    }, 1000)
  }, [showAlert, fetchDeck])

  useEffect(() => {
    const loadDeck = async () => {
      setLoading(true)
      await fetchDeck()
      setLoading(false)
    }

    loadDeck()
  }, [deckId, fetchDeck])
  
  // Check for any active enrichment jobs for cards in this deck
  useEffect(() => {
    if (!deck || deck.cards.length === 0) return
    
    const checkForActiveJobs = async () => {
      try {
        // Get all card IDs that don't have enrichment data
        const unenrichedCards = deck.cards.filter(card => 
          !card.pinyin || !card.imageUrl || !card.audioUrl
        )
        
        if (unenrichedCards.length === 0) return
        
        // Check if any of these cards have active jobs
        for (const card of unenrichedCards) {
          const cardId = card._id.toString()
          
          // Skip if we're already tracking this card
          if (enrichingCards.has(cardId)) {
            continue
          }
          
          try {
            // Check for active job for this card
            const response = await fetch(`/api/cards/${card._id}/job-status`)
            if (response.ok) {
              const data = await response.json()
              if (data.jobId && (data.state === 'active' || data.state === 'waiting')) {
                // Add to enriching cards map
                setEnrichingCards(prev => {
                  const newMap = new Map(prev)
                  // Double check we're not already tracking it
                  if (!newMap.has(cardId)) {
                    newMap.set(cardId, {
                      jobId: data.jobId,
                      progress: 'Enriching...',
                      hanzi: card.hanzi
                    })
                    console.log(`Started tracking enrichment for ${card.hanzi} (job: ${data.jobId})`)
                  }
                  return newMap
                })
                
                // Start polling this job
                pollEnrichmentJob(data.jobId, cardId, card.hanzi)
              }
            }
          } catch (error) {
            // Ignore errors for individual cards
            console.error(`Error checking job status for card ${card._id}:`, error)
          }
        }
      } catch (error) {
        console.error('Error checking for active jobs:', error)
      }
    }
    
    // Check immediately
    checkForActiveJobs()
    
    // Check periodically if there are unenriched cards
    const interval = setInterval(checkForActiveJobs, 5000)
    
    return () => clearInterval(interval)
  }, [deck, enrichingCards, pollEnrichmentJob])
  

  const handleAddCharacter = async (disambiguationSelection?: { pinyin: string; meaning: string }) => {
    const trimmedCharacter = pendingCharacter || newCharacter.trim()
    
    console.log('handleAddCharacter called with:', {
      character: trimmedCharacter,
      disambiguationSelection,
      pendingCharacter
    })
    
    if (!trimmedCharacter) {
      showAlert('Please enter a character or vocabulary', { type: 'error' })
      return
    }

    if (trimmedCharacter.length > 4) {
      showAlert('Please enter no more than 4 characters', { type: 'error' })
      return
    }

    // Validate Traditional Chinese
    const validation = validateTraditionalChinese(trimmedCharacter)
    if (!validation.isValid) {
      showAlert(validation.errors[0] || 'Please enter Traditional Chinese characters only', { type: 'error' })
      return
    }

    // Check for disambiguation if not already provided
    if (!disambiguationSelection && !pendingCharacter) {
      setIsAdding(true)
      try {
        const checkResponse = await fetch('/api/decks/check-disambiguation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hanziList: [validation.cleanedText] })
        })

        if (!checkResponse.ok) {
          throw new Error('Failed to check disambiguation')
        }

        const checkData = await checkResponse.json()
        
        if (checkData.needsDisambiguation && checkData.charactersNeedingClarification.length > 0) {
          setDisambiguationData({
            characters: checkData.charactersNeedingClarification
          })
          setPendingCharacter(validation.cleanedText)
          setIsAdding(false)
          return
        }
      } catch (error) {
        console.error('Error checking disambiguation:', error)
        // Continue without disambiguation on error
      }
    }

    setIsAdding(true)

    try {
      // Add character to deck
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characters: validation.cleanedText,
          disambiguation: disambiguationSelection 
        }),
      })

      if (!response.ok) {
        let errorMessage = 'Failed to add character'
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (e) {
          // If response is not JSON, use the status text
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log('Add card API response:', result)
      
      // Close modal and reset form immediately
      setShowAddForm(false)
      setNewCharacter('')
      setPendingCharacter(null)
      setDisambiguationData(null)
      
      // Refresh deck to show the new card
      await fetchDeck()
      
      // Track enrichment status if job ID is provided
      if (result.jobId && result.cardId) {
        console.log('Tracking enrichment for:', { cardId: result.cardId, hanzi: validation.cleanedText, jobId: result.jobId })
        
        // Add to enriching cards map
        setEnrichingCards(prev => {
          const newMap = new Map(prev)
          newMap.set(result.cardId, {
            jobId: result.jobId,
            progress: 'Starting enrichment...',
            hanzi: validation.cleanedText
          })
          console.log('EnrichingCards map updated:', Array.from(newMap.entries()))
          return newMap
        })
        
        // Use the shared polling function
        pollEnrichmentJob(result.jobId, result.cardId, validation.cleanedText)
      }
    } catch (error) {
      console.error('Error adding character:', error)
      showAlert(error instanceof Error ? error.message : 'Failed to add character', { type: 'error' })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteCard = async (cardId: string, hanzi: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to remove "${hanzi}" from this deck?`,
      {
        type: 'warning',
        confirmText: 'Remove',
        cancelText: 'Cancel'
      }
    )

    if (!confirmed) return

    try {
      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId })
      })

      if (!response.ok) {
        let errorMessage = 'Failed to remove card'
        try {
          const error = await response.json()
          errorMessage = error.message || error.error || errorMessage
        } catch (e) {
          errorMessage = response.statusText || errorMessage
        }
        throw new Error(errorMessage)
      }

      showAlert(`"${hanzi}" removed from deck`, { type: 'success' })
      
      // Refresh deck to remove the card
      await fetchDeck()
    } catch (error) {
      console.error('Error removing card:', error)
      showAlert(error instanceof Error ? error.message : 'Failed to remove card', { type: 'error' })
    }
  }

  // Show flash session if in session view
  if (view === "session" && deckId) {
    return (
      <FlashSession
        deckId={deckId}
        mode={sessionMode}
        onExit={handleExitSession}
      />
    )
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning flex items-center justify-center">
          <div className="text-lg">Loading deck...</div>
        </div>
        <Footer />
      </>
    )
  }

  if (error || !deck) {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Deck</h1>
            <p className="text-gray-400 mb-4">{error || 'Deck not found'}</p>
            <button
              onClick={() => router.push('/decks')}
              className="px-4 py-2 bg-[#f7cc48] text-black rounded-lg hover:bg-[#f7cc48]/90 transition-colors"
            >
              Back to Decks
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="bg-[#0d1117]">
        <div className="min-h-[calc(100vh-4rem)] flex flex-col">
          <main className="flex-1 text-white font-learning">
            {/* Vibrant gradient background matching marketing pages */}
            <div className="fixed inset-0 z-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#f7cc48]/10 via-[#0d1117] to-[#f7cc48]/5" />
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-yellow-500/5" />
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f7cc48]/10 rounded-full filter blur-3xl animate-pulse" />
              <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-3xl animate-pulse" />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              {isEditingName ? (
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleEditSave()
                      } else if (e.key === 'Escape') {
                        handleEditCancel()
                      }
                    }}
                    className="text-3xl font-bold bg-transparent border-b-2 border-[#f7cc48] text-[#f7cc48] outline-none px-2 py-1"
                    autoFocus
                  />
                  <button
                    onClick={handleEditSave}
                    className="p-2 text-green-400 hover:bg-[#161b22] rounded-lg transition-colors"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="p-2 text-gray-400 hover:bg-[#161b22] rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group">
                  <h1 className="text-3xl font-bold text-[#f7cc48]">{deck.name}</h1>
                  <button
                    onClick={handleEditStart}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-[#f7cc48] hover:bg-[#161b22] rounded-lg transition-all"
                    title="Edit deck name"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                </div>
              )}
              <p className="text-gray-300 mt-2">{deck.cards.length} cards in this deck</p>
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add to deck
            </button>
          </div>
          
          {/* Action Buttons */}
          {deckStats && (
            <div className="flex flex-wrap gap-3 mt-4">
              {deckStats.newCards > 0 && (
                <button
                  onClick={() => handleStartSession("new")}
                  className="min-w-[160px] px-5 py-3 bg-gradient-to-r from-[#f7cc48]/15 to-yellow-500/15 hover:from-[#f7cc48]/25 hover:to-yellow-500/25 text-[#f7cc48] rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 border border-[#f7cc48]/20 hover:border-[#f7cc48]/40 shadow-md hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 group cursor-pointer text-sm font-semibold backdrop-blur-sm"
                  title={`Study ${deckStats.newCards} new cards`}
                >
                  <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="whitespace-nowrap">Study New ({deckStats.newCards})</span>
                </button>
              )}
              {(deckStats.overdue > 0 || deckStats.dueToday > 0) && (
                <button
                  onClick={() => handleStartSession("review")}
                  className="min-w-[160px] px-5 py-3 bg-gradient-to-r from-orange-600/15 to-red-500/15 hover:from-orange-600/25 hover:to-red-500/25 text-orange-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 border border-orange-600/20 hover:border-orange-500/40 shadow-md hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 group cursor-pointer text-sm font-semibold backdrop-blur-sm"
                  title={`Review ${deckStats.overdue + deckStats.dueToday} due cards`}
                >
                  <Zap className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="whitespace-nowrap">Review ({deckStats.overdue + deckStats.dueToday})</span>
                </button>
              )}
              {deck.cards.length > deckStats.newCards && (
                <button
                  onClick={() => handleStartSession("practice")}
                  className="min-w-[160px] px-5 py-3 bg-gradient-to-r from-green-600/15 to-emerald-500/15 hover:from-green-600/25 hover:to-emerald-500/25 text-green-400 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 border border-green-600/20 hover:border-green-500/40 shadow-md hover:shadow-xl hover:scale-[1.02] hover:-translate-y-0.5 group cursor-pointer text-sm font-semibold backdrop-blur-sm"
                  title={`Practice quiz on all ${deck.cards.length - deckStats.newCards} studied cards`}
                >
                  <Brain className="w-4 h-4 group-hover:scale-110 transition-transform flex-shrink-0" />
                  <span className="whitespace-nowrap">Practice ({deck.cards.length - deckStats.newCards})</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          {deck.cards.map((card) => {
            const cardId = card._id.toString()
            // Check if enriching by ID only
            const isEnriching = enrichingCards.has(cardId)
            const enrichmentInfo = isEnriching ? enrichingCards.get(cardId) : null
            
            
            
            return (
              <div 
                key={card._id} 
                className={`group bg-[#21262d] backdrop-blur-sm rounded-2xl border border-[#30363d] p-6 transition-all flex flex-col relative shadow-lg min-w-[280px] ${
                  isEnriching || !card.pinyin ? 'cursor-wait' : 'hover:border-[#f7cc48]/30 cursor-pointer hover:shadow-xl hover:scale-[1.02]'
                }`}
                onClick={() => {
                  if (!isEnriching && card.pinyin) {
                    setSelectedCharacter({ id: cardId, hanzi: card.hanzi, card })
                  }
                }}
              >
                {/* Enrichment Progress Overlay */}
                {(isEnriching || !card.pinyin) && (
                  <div className="absolute inset-0 bg-[#0d1117]/90 backdrop-blur-md rounded-2xl flex items-center justify-center z-20 pointer-events-auto">
                    <div className="bg-[#21262d]/95 rounded-xl p-6 shadow-2xl border border-[#30363d]">
                      <Loader2 className="w-10 h-10 animate-spin text-[#f7cc48] mx-auto mb-3" />
                      <p className="text-sm text-[#f7cc48] font-semibold">
                        {isEnriching ? (enrichmentInfo?.progress || 'Enriching...') : 'Preparing for enrichment...'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="text-center mb-4">
                  <div className="text-6xl font-bold mb-2 text-white hanzi group-hover:text-[#f7cc48] transition-colors">{card.hanzi}</div>
                  <div className="text-xl text-[#f7cc48]/80 mb-2">{card.pinyin || '...'}</div>
                  <div className="text-sm text-gray-300">{card.english?.join(', ') || '...'}</div>
                </div>

              {/* Image Section */}
              {card.imageUrl && (
                <div className="mb-4">
                  <div className="w-full bg-[#161b22] rounded-lg overflow-hidden">
                    <img
                      src={`${card.imageUrl}${card.imageUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt={card.hanzi}
                      className="w-full h-auto object-contain"
                    />
                  </div>
                </div>
              )}

              {/* Stats Section */}
              <div className="mb-4 pb-4 border-b border-[#30363d]">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Reviews</div>
                    <div className="text-sm font-semibold text-[#f7cc48]/90 flex items-center justify-center gap-1">
                      <BarChart3 className="w-3 h-3" />
                      {card.stats?.totalReviews || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                    <div className={`text-sm font-semibold flex items-center justify-center gap-1 ${
                      !card.stats || card.stats.totalReviews === 0 ? 'text-gray-400' :
                      card.stats.accuracy >= 80 ? 'text-green-400' : 
                      card.stats.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      <Zap className="w-3 h-3" />
                      {card.stats && card.stats.totalReviews > 0 ? `${Math.round(card.stats.accuracy)}%` : '-'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Difficulty</div>
                    <div className="text-sm font-semibold text-orange-400">
                      {card.stats && card.stats.totalReviews > 0 ? card.stats.difficulty.toFixed(1) : '-'}
                    </div>
                  </div>
                </div>
                {card.stats?.lastReviewed && (
                  <div className="text-xs text-gray-500 mt-3 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last Reviewed: {formatRelativeTime(card.stats.lastReviewed)}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 space-y-2">
                {card.audioUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      const audioUrlWithTimestamp = `${card.audioUrl}${card.audioUrl.includes('?') ? '&' : '?'}t=${Date.now()}`
                      playAudio(audioUrlWithTimestamp)
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#f7cc48]/10 to-yellow-500/10 hover:from-[#f7cc48]/20 hover:to-yellow-500/20 text-[#f7cc48] rounded-xl transition-all text-sm font-semibold border border-[#f7cc48]/20 hover:border-[#f7cc48]/40"
                  >
                    Play Audio
                  </button>
                )}
                
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteCard(card._id, card.hanzi)
                  }}
                  className="w-full py-3 bg-gradient-to-r from-red-600/10 to-red-500/10 hover:from-red-600/20 hover:to-red-500/20 text-red-400 rounded-xl transition-all text-sm font-semibold border border-red-600/20 hover:border-red-500/40 flex items-center justify-center gap-2"
                  title="Remove from deck"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove from Deck
                </button>
              </div>
            </div>
            )
          })}
        </div>

        {deck.cards.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No cards in this deck yet
          </div>
        )}
            </div>
          </main>
          
          <Footer />
        </div>
      </div>
      
      {/* Character Insights Modal */}
      {selectedCharacter && (
        <CharacterInsights
          characterId={selectedCharacter.id}
          character={selectedCharacter.hanzi}
          cardData={selectedCharacter.card}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
      
      {/* Add Character Modal */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            // Prevent closing modal by clicking backdrop during enrichment
            if (!isAdding && e.target === e.currentTarget) {
              setShowAddForm(false)
              setNewCharacter('')
            }
          }}
        >
          <div className="bg-[#161b22] rounded-2xl p-6 max-w-md w-full border border-[#30363d] shadow-2xl">
            <h2 className="text-2xl font-bold text-[#f7cc48] mb-4">Add Character to Deck</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Traditional Chinese character or vocabulary
                </label>
                <input
                  type="text"
                  value={newCharacter}
                  onChange={(e) => setNewCharacter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isAdding) {
                      handleAddCharacter()
                    }
                  }}
                  placeholder="e.g. 你好, 朋友, 學習"
                  className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
                  maxLength={4}
                  autoFocus
                  disabled={isAdding}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Traditional Chinese only • Single characters or multi-character words • Max 4 characters
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => handleAddCharacter()}
                  disabled={isAdding || !newCharacter.trim()}
                  className="flex-1 py-3 bg-[#f7cc48] hover:bg-[#f7cc48]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isAdding ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add Character
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    if (!isAdding) {
                      setShowAddForm(false)
                      setNewCharacter('')
                    }
                  }}
                  disabled={isAdding}
                  className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  title={isAdding ? 'Please wait for enrichment to complete' : 'Cancel'}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Disambiguation Modal */}
      {disambiguationData && (
        <DisambiguationModal
          characters={disambiguationData.characters}
          isImport={false}
          onComplete={(selections) => {
            const character = pendingCharacter || newCharacter
            const selection = selections[character]
            setDisambiguationData(null)
            handleAddCharacter(selection)
          }}
          onCancel={() => {
            setDisambiguationData(null)
            setPendingCharacter(null)
            setIsAdding(false)
          }}
        />
      )}
    </>
  )
}