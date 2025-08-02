'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CharacterInsights from '@/components/CharacterInsights'
import { BarChart3, Zap, Clock, Edit2, Check, X } from 'lucide-react'
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
  const [isEditingName, setIsEditingName] = useState(false)
  const [editName, setEditName] = useState('')
  const { showAlert } = useAlert()

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
  }, [deckId])

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
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
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-[#f7cc48] text-black rounded-lg hover:bg-[#f7cc48]/90 transition-colors"
            >
              Back to Dashboard
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
      <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning">
        {/* Vibrant gradient background matching marketing pages */}
        <div className="fixed inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#f7cc48]/10 via-[#0d1117] to-[#f7cc48]/5" />
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-yellow-500/5" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#f7cc48]/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full filter blur-3xl animate-pulse" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deck.cards.map((card) => (
            <div 
              key={card._id} 
              className="group bg-[#21262d] backdrop-blur-sm rounded-2xl border border-[#30363d] p-6 hover:border-[#f7cc48]/30 transition-all cursor-pointer flex flex-col relative shadow-lg hover:shadow-xl hover:scale-[1.02]"
              onClick={() => setSelectedCharacter({ id: card._id, hanzi: card.hanzi })}
            >
              <div className="text-center mb-4">
                <div className="text-6xl font-bold mb-2 text-white hanzi group-hover:text-[#f7cc48] transition-colors">{card.hanzi}</div>
                <div className="text-xl text-[#f7cc48]/80 mb-2">{card.pinyin}</div>
                <div className="text-sm text-gray-300">{card.english.join(', ')}</div>
              </div>

              {/* Image Section */}
              {card.imageUrl && (
                <div className="mb-4">
                  <div className="w-full bg-[#161b22] rounded-lg overflow-hidden">
                    <img
                      src={card.imageUrl}
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

              {/* Attributes Section */}
              <div className="space-y-2 text-xs flex-grow">
                {card.semanticCategory && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Category:</span>
                    <span className="text-gray-300">{card.semanticCategory}</span>
                  </div>
                )}
                {card.tonePattern && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tone:</span>
                    <span className="text-gray-300">{card.tonePattern}</span>
                  </div>
                )}
                {card.overallDifficulty !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Difficulty:</span>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < Math.round(card.overallDifficulty || 0) 
                              ? 'bg-[#f7cc48]' 
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Audio Button */}
              {card.audioUrl && (
                <div className="mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      playAudio(card.audioUrl!)
                    }}
                    className="w-full py-3 bg-gradient-to-r from-[#f7cc48]/10 to-yellow-500/10 hover:from-[#f7cc48]/20 hover:to-yellow-500/20 text-[#f7cc48] rounded-xl transition-all text-sm font-semibold border border-[#f7cc48]/20 hover:border-[#f7cc48]/40"
                  >
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
    </>
  )
}