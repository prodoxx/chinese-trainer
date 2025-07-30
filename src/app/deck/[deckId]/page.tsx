'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CharacterInsights from '@/components/CharacterInsights'
import SingleCardDisambiguation from '@/components/SingleCardDisambiguation'
import { BarChart3, Zap, Clock, RefreshCw, Edit2, Check, X } from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'
import { formatRelativeTime } from '@/lib/utils/date'

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
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; hanzi: string } | null>(null)
  const [enrichingCards, setEnrichingCards] = useState<Set<string>>(new Set())
  const [jobStatuses, setJobStatuses] = useState<Map<string, { jobId: string; progress: number; state: string }>>(new Map())
  const pollIntervals = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const [disambiguationData, setDisambiguationData] = useState<{
    hanzi: string;
    cardId: string;
    meanings: Array<{ pinyin: string; meaning: string; frequency?: string }>;
  } | null>(null)
  const [pendingEnrichment, setPendingEnrichment] = useState<{
    cardId: string;
    force: boolean;
  } | null>(null)
  const { showAlert, showConfirm } = useAlert()

  const fetchDeck = async () => {
    try {
      const response = await fetch(`/api/decks/${deckId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch deck')
      }
      const data = await response.json()
      setDeck(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck')
    }
  }

  const pollJobStatus = async (jobId: string, cardId: string) => {
    // Clear any existing interval for this card
    const existingInterval = pollIntervals.current.get(cardId)
    if (existingInterval) {
      clearInterval(existingInterval)
      pollIntervals.current.delete(cardId)
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/status`)
        if (!response.ok) {
          console.error('Failed to check job status')
          return false
        }

        const data = await response.json()
        
        // Update job status in state
        setJobStatuses(prev => new Map(prev).set(cardId, {
          jobId,
          progress: data.progress,
          state: data.state
        }))

        if (data.state === 'completed') {
          // Job completed successfully
          showAlert(`Re-enrichment completed for "${data.data.hanzi || 'card'}"`, { type: 'success' })
          setEnrichingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(cardId)
            return newSet
          })
          setJobStatuses(prev => {
            const newMap = new Map(prev)
            newMap.delete(cardId)
            return newMap
          })
          pollIntervals.current.delete(cardId)
          // Refresh deck to show updated card
          await fetchDeck()
          return false // Stop polling
        } else if (data.state === 'failed') {
          // Job failed
          showAlert(`Re-enrichment failed: ${data.failedReason || 'Unknown error'}`, { type: 'error' })
          setEnrichingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(cardId)
            return newSet
          })
          setJobStatuses(prev => {
            const newMap = new Map(prev)
            newMap.delete(cardId)
            return newMap
          })
          pollIntervals.current.delete(cardId)
          return false // Stop polling
        }

        // Continue polling if still active/waiting
        return true
      } catch (error) {
        console.error('Error polling job status:', error)
        pollIntervals.current.delete(cardId)
        return false
      }
    }

    // Start polling
    const shouldContinue = await checkStatus()
    if (shouldContinue) {
      const intervalId = setInterval(async () => {
        const continuePolling = await checkStatus()
        if (!continuePolling) {
          clearInterval(intervalId)
          pollIntervals.current.delete(cardId)
        }
      }, 1000) // Poll every second
      
      // Store interval reference
      pollIntervals.current.set(cardId, intervalId)
    }
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

  useEffect(() => {
    const loadDeck = async () => {
      setLoading(true)
      await fetchDeck()
      setLoading(false)
    }

    loadDeck()

    // Cleanup on unmount
    return () => {
      // Clear all polling intervals
      pollIntervals.current.forEach(intervalId => {
        clearInterval(intervalId)
      })
      pollIntervals.current.clear()
    }
  }, [deckId])

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
  }

  const handleReEnrichCard = async (e: React.MouseEvent, cardId: string, hanzi: string) => {
    e.stopPropagation()
    
    const isForce = e.shiftKey
    const confirmMessage = isForce 
      ? `Force re-enrich "${hanzi}"? This will update the image (but only add missing audio).`
      : `Re-enrich "${hanzi}" with missing/placeholder images and audio?`
    
    const confirmed = await showConfirm(confirmMessage, {
      title: isForce ? 'Force Re-enrich Card' : 'Re-enrich Card',
      confirmText: 'Re-enrich',
      cancelText: 'Cancel'
    })
    
    if (!confirmed) {
      return
    }

    setEnrichingCards(prev => new Set(prev).add(cardId))

    try {
      // First, check if disambiguation is needed
      const checkResponse = await fetch('/api/cards/re-enrich-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardId: cardId,
          force: isForce,
          deckId: deckId 
        }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        throw new Error(checkData.error || 'Re-enrichment check failed')
      }

      if (checkData.needsDisambiguation) {
        // Show disambiguation modal
        setDisambiguationData(checkData.character)
        setPendingEnrichment({ cardId, force: isForce })
        setEnrichingCards(prev => {
          const newSet = new Set(prev)
          newSet.delete(cardId)
          return newSet
        })
      } else {
        // Job was queued, poll for completion
        if (checkData.jobId) {
          pollJobStatus(checkData.jobId, cardId)
        } else {
          throw new Error('No job ID returned')
        }
      }
    } catch (error) {
      console.error('Re-enrichment error:', error)
      showAlert('Re-enrichment failed. Please try again.', { type: 'error' })
      setEnrichingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    }
  }

  const handleDisambiguationSelect = async (selection: { pinyin: string; meaning: string }) => {
    if (!pendingEnrichment || !disambiguationData) return

    const { cardId, force } = pendingEnrichment
    const { hanzi } = disambiguationData

    setDisambiguationData(null)
    setEnrichingCards(prev => new Set(prev).add(cardId))

    try {
      const response = await fetch('/api/cards/re-enrich-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cardId: cardId,
          deckId: deckId,
          force: force,
          disambiguationSelection: selection
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Re-enrichment submission failed')
      }

      if (data.jobId) {
        pollJobStatus(data.jobId, cardId)
      } else {
        throw new Error('No job ID returned')
      }
    } catch (error) {
      console.error('Re-enrichment submission error:', error)
      showAlert('Re-enrichment failed. Please try again.', { type: 'error' })
      setEnrichingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    } finally {
      setPendingEnrichment(null)
    }
  }

  const handleDisambiguationCancel = () => {
    setDisambiguationData(null)
    setPendingEnrichment(null)
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning flex flex-col">
          <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
            <div className="text-center py-12">Loading deck...</div>
          </div>
          <Footer />
        </div>
      </>
    )
  }

  if (error || !deck) {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning flex flex-col">
          <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
            <div className="text-center text-red-600 py-12">{error || 'Deck not found'}</div>
          </div>
          <Footer />
        </div>
      </>
    )
  }

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        <div className="mb-8">
          {isEditingName ? (
            <div className="flex items-center gap-3 mb-2">
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
                className="flex-1 max-w-md px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-white text-2xl font-bold focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deck.cards.map((card) => (
            <div 
              key={card._id} 
              className={`bg-[#21262d] backdrop-blur-sm rounded-2xl border border-[#30363d] p-6 hover:border-[#f7cc48]/30 transition-all cursor-pointer flex flex-col relative shadow-lg hover:shadow-xl hover:scale-[1.02] ${
                enrichingCards.has(card._id) ? 'opacity-60' : ''
              }`}
              onClick={() => setSelectedCharacter({ id: card._id, hanzi: card.hanzi })}
            >
              {/* Re-enrich button */}
              <button
                onClick={(e) => handleReEnrichCard(e, card._id, card.hanzi)}
                disabled={enrichingCards.has(card._id)}
                className="absolute top-3 right-3 p-2 text-gray-400 hover:text-[#f7cc48] hover:bg-[#161b22] rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed z-10"
                title="Re-enrich this card (Shift+click to force update image)"
              >
                {enrichingCards.has(card._id) ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </button>

              {/* Loading overlay */}
              {enrichingCards.has(card._id) && (
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center z-20">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-[#f7cc48] animate-spin mx-auto mb-2" />
                    <p className="text-sm text-gray-300">Re-enriching...</p>
                    {jobStatuses.has(card._id) && (
                      <div className="mt-2">
                        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#f7cc48] transition-all duration-300"
                            style={{ width: `${jobStatuses.get(card._id)?.progress || 0}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          {jobStatuses.get(card._id)?.state || 'processing'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="text-center mb-4">
                <div className="text-6xl font-bold mb-2 text-white hanzi hover:text-[#f7cc48] transition-colors">{card.hanzi}</div>
                <div className="text-xl text-[#f7cc48]/80 mb-2">{card.pinyin}</div>
                <div className="text-sm text-gray-300">{card.english.join(', ')}</div>
              </div>

              {/* Stats Section */}
              {card.stats && card.stats.totalReviews > 0 && (
                <div className="mb-4 pb-4 border-b border-[#30363d]">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Reviews</div>
                      <div className="text-sm font-semibold text-[#f7cc48]/90 flex items-center justify-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {card.stats.totalReviews}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Accuracy</div>
                      <div className={`text-sm font-semibold flex items-center justify-center gap-1 ${
                        card.stats.accuracy >= 80 ? 'text-green-400' : 
                        card.stats.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        <Zap className="w-3 h-3" />
                        {Math.round(card.stats.accuracy)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400 mb-1">Difficulty</div>
                      <div className="text-sm font-semibold text-orange-400">
                        {card.stats.difficulty.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  {card.stats.lastReviewed && (
                    <div className="mt-3 text-center">
                      <div className="text-xs text-gray-400 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last reviewed: {formatRelativeTime(card.stats.lastReviewed)}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* No stats yet */}
              {(!card.stats || card.stats.totalReviews === 0) && (
                <div className="mb-4 pb-4 border-b border-[#30363d] text-center">
                  <div className="text-xs text-gray-400">Not studied yet</div>
                </div>
              )}

              {card.imageUrl && (
                <div className="mb-4 flex-grow flex items-center justify-center">
                  <img 
                    src={card.imageUrl} 
                    alt={card.hanzi}
                    className="w-full h-32 object-contain rounded-lg"
                  />
                </div>
              )}

              {card.audioUrl && (
                <div className="text-center mt-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      playAudio(card.audioUrl!)
                    }}
                    className="bg-[#f7cc48]/20 hover:bg-[#f7cc48]/30 text-[#f7cc48] px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mx-auto border border-[#f7cc48]/30 hover:border-[#f7cc48]/50 hover:shadow-[0_0_15px_rgba(247,204,72,0.3)]"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    Play Audio
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {deck.cards.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            No cards in this deck yet
          </div>
        )}
        </div>
        
        <Footer />
      </div>
      
      {/* Character Insights Modal */}
      {selectedCharacter && (
        <CharacterInsights
          characterId={selectedCharacter.id}
          character={selectedCharacter.hanzi}
          onClose={() => setSelectedCharacter(null)}
        />
      )}

      {/* Single Card Disambiguation Modal */}
      {disambiguationData && (
        <SingleCardDisambiguation
          character={disambiguationData}
          onSelect={handleDisambiguationSelect}
          onCancel={handleDisambiguationCancel}
        />
      )}
    </>
  )
}