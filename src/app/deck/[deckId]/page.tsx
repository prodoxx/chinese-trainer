'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import CharacterInsights from '@/components/CharacterInsights'
import { BarChart3, Zap, Clock } from 'lucide-react'

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

  useEffect(() => {
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
      } finally {
        setLoading(false)
      }
    }

    fetchDeck()
  }, [deckId])

  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl)
    audio.play()
  }

  if (loading) {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-gray-950 text-white font-learning flex flex-col">
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
        <div className="min-h-[calc(100vh-4rem)] bg-gray-950 text-white font-learning flex flex-col">
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
      <div className="min-h-[calc(100vh-4rem)] bg-gray-950 text-white font-learning flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{deck.name}</h1>
          <p className="text-gray-400 mt-2">{deck.cards.length} cards in this deck</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {deck.cards.map((card) => (
            <div 
              key={card._id} 
              className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 hover:bg-gray-900/70 hover:border-gray-700 transition-all cursor-pointer flex flex-col"
              onClick={() => setSelectedCharacter({ id: card._id, hanzi: card.hanzi })}
            >
              <div className="text-center mb-4">
                <div className="text-6xl font-bold mb-2 text-white hanzi">{card.hanzi}</div>
                <div className="text-xl text-gray-400 mb-2">{card.pinyin}</div>
                <div className="text-sm text-gray-500">{card.english.join(', ')}</div>
              </div>

              {/* Stats Section */}
              {card.stats && card.stats.totalReviews > 0 && (
                <div className="mb-4 pb-4 border-b border-gray-800">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Reviews</div>
                      <div className="text-sm font-semibold text-gray-300 flex items-center justify-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {card.stats.totalReviews}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                      <div className={`text-sm font-semibold flex items-center justify-center gap-1 ${
                        card.stats.accuracy >= 80 ? 'text-green-400' : 
                        card.stats.accuracy >= 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        <Zap className="w-3 h-3" />
                        {Math.round(card.stats.accuracy)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Difficulty</div>
                      <div className="text-sm font-semibold text-gray-300">
                        {card.stats.difficulty.toFixed(1)}
                      </div>
                    </div>
                  </div>
                  {card.stats.lastReviewed && (
                    <div className="mt-3 text-center">
                      <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last reviewed: {new Date(card.stats.lastReviewed).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* No stats yet */}
              {(!card.stats || card.stats.totalReviews === 0) && (
                <div className="mb-4 pb-4 border-b border-gray-800 text-center">
                  <div className="text-xs text-gray-600">Not studied yet</div>
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
                    className="bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 mx-auto border border-violet-800/50 hover:border-violet-700/50"
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
          <div className="text-center text-gray-500 mt-8">
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