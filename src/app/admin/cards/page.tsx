'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { 
  ChevronLeft,
  ChevronRight,
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
  BarChart3,
  Grid3X3,
  List,
  Plus,
  Upload,
  Trash2,
  Edit2,
  Check,
  X
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
  imagePrompt?: string | null
  imagePath?: string | null
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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')
  const [enrichmentStatus, setEnrichmentStatus] = useState<Map<string, string>>(new Map())
  const [refreshing, setRefreshing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [playingAudio, setPlayingAudio] = useState<string | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<{ id: string; hanzi: string } | null>(null)
  const [editingImageCard, setEditingImageCard] = useState<Card | null>(null)
  const [customImagePrompt, setCustomImagePrompt] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [savingImage, setSavingImage] = useState(false)
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null)
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
  const [showBulkImport, setShowBulkImport] = useState(false)
  const [bulkCharacters, setBulkCharacters] = useState('')
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkImportStartTime, setBulkImportStartTime] = useState<number | null>(null)
  const [bulkImportElapsed, setBulkImportElapsed] = useState<number>(0)
  const [bulkImportResults, setBulkImportResults] = useState<{
    success: boolean;
    summary: {
      total: number;
      created: number;
      skipped: number;
      errors: number;
      enrichmentQueued: number;
      pendingEnrichment?: number;
      completedEnrichment?: number;
    };
    results: {
      created: { hanzi: string; cardId: string }[];
      skipped: { hanzi: string; reason: string }[];
      errors: { hanzi: string; error: string }[];
      enrichmentJobs: { hanzi: string; cardId: string; jobId: string }[];
    };
  } | null>(null)
  const [bulkImportJobId, setBulkImportJobId] = useState<string | null>(null)
  const [bulkImportProgress, setBulkImportProgress] = useState<any>(null)
  const bulkImportPollRef = useRef<NodeJS.Timeout | null>(null)
  const [enrichImmediately, setEnrichImmediately] = useState(true)
  // const [isDevelopment, setIsDevelopment] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ cardId: string; hanzi: string } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const pollIntervalsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Check if user is admin and set development mode
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

    // Check if we're in development mode
    // setIsDevelopment(process.env.NODE_ENV === 'development')

    fetchCards()
  }, [session, status, router, showAlert])

  // Track elapsed time during bulk import
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null
    
    if (bulkImporting && bulkImportStartTime) {
      interval = setInterval(() => {
        setBulkImportElapsed(Math.floor((Date.now() - bulkImportStartTime) / 1000))
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [bulkImporting, bulkImportStartTime])

  // Cleanup polling intervals on unmount
  useEffect(() => {
    return () => {
      // Clear all polling intervals
      pollIntervalsRef.current.forEach((interval) => {
        clearInterval(interval)
      })
      pollIntervalsRef.current.clear()
      
      // Clear bulk import polling
      if (bulkImportPollRef.current) {
        clearInterval(bulkImportPollRef.current)
      }
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

  const handleDeleteCard = async () => {
    if (!deleteConfirmation) return
    
    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/cards/${deleteConfirmation.cardId}/delete`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.deckCount) {
          showAlert(
            data.message,
            { type: 'error' }
          )
        } else {
          showAlert(data.error || 'Failed to delete card', { type: 'error' })
        }
        return
      }

      const message = data.deletedCard?.analysisDeleted 
        ? `Card "${deleteConfirmation.hanzi}" and its character analysis deleted successfully`
        : `Card "${deleteConfirmation.hanzi}" deleted successfully`
      showAlert(message, { type: 'success' })
      setDeleteConfirmation(null)
      fetchCards() // Refresh the list
    } catch (error) {
      console.error('Error deleting card:', error)
      showAlert('Failed to delete card', { type: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!bulkDeleteConfirmation || selectedCards.size === 0) return
    
    setBulkDeleting(true)
    try {
      const response = await fetch('/api/admin/cards/bulk-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cardIds: Array.from(selectedCards)
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        showAlert(data.error || 'Failed to delete cards', { type: 'error' })
        return
      }
      
      // Show detailed results
      let message = data.message
      
      if (data.results.skipped.length > 0) {
        message += '\n\nSkipped cards (in use by decks):'
        data.results.skipped.forEach((card: any) => {
          message += `\n• ${card.hanzi}: ${card.reason}`
        })
      }
      
      showAlert(message, { 
        type: data.results.deleted.length > 0 ? 'success' : 'warning'
      })
      
      // Clear selection and refresh
      setSelectedCards(new Set())
      setBulkDeleteConfirmation(false)
      fetchCards()
      
    } catch (error) {
      console.error('Error during bulk delete:', error)
      showAlert('Failed to delete cards', { type: 'error' })
    } finally {
      setBulkDeleting(false)
    }
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

      const data = await response.json()
      showAlert(`Re-enrichment started for ${data.jobCount} cards`, { type: 'success' })
      setSelectedCards(new Set())
      
      // Start polling for each job
      if (data.jobs && data.jobs.length > 0) {
        data.jobs.forEach((job: { jobId: string; cardId: string; hanzi: string }) => {
          // Mark as re-enriching
          setReEnrichingCards(prev => new Set(prev).add(job.cardId))
          setEnrichmentStatus(prev => new Map(prev).set(job.cardId, `Enriching ${job.hanzi}...`))
          
          // Start polling for this job
          const pollInterval = setInterval(async () => {
            try {
              const statusResponse = await fetch(`/api/admin/cards/job-status?jobId=${job.jobId}`)
              if (!statusResponse.ok) throw new Error('Failed to fetch job status')
              
              const jobStatus = await statusResponse.json()
              
              if (jobStatus.progress) {
                setEnrichmentStatus(prev => {
                  const next = new Map(prev)
                  next.set(job.cardId, jobStatus.progress.message || `Processing ${job.hanzi}...`)
                  return next
                })
              }
              
              if (jobStatus.state === 'completed' || jobStatus.state === 'failed') {
                clearInterval(pollInterval)
                pollIntervalsRef.current.delete(job.cardId)
                
                // Update UI
                setReEnrichingCards(prev => {
                  const next = new Set(prev)
                  next.delete(job.cardId)
                  return next
                })
                setEnrichmentStatus(prev => {
                  const next = new Map(prev)
                  next.delete(job.cardId)
                  return next
                })
                
                if (jobStatus.state === 'completed') {
                  // Refresh the card in the list
                  fetchCards()
                } else if (jobStatus.state === 'failed') {
                  const failureReason = jobStatus.failedReason || 'Unknown error'
                  console.error(`Enrichment failed for ${job.hanzi}:`, failureReason)
                }
              }
            } catch (error) {
              console.error('Error polling job status:', error)
              clearInterval(pollInterval)
              pollIntervalsRef.current.delete(job.cardId)
              setReEnrichingCards(prev => {
                const next = new Set(prev)
                next.delete(job.cardId)
                return next
              })
              setEnrichmentStatus(prev => {
                const next = new Map(prev)
                next.delete(job.cardId)
                return next
              })
            }
          }, 1000) // Poll every second
          
          // Store the interval
          pollIntervalsRef.current.set(job.cardId, pollInterval)
          
          // Stop polling after 2 minutes
          setTimeout(() => {
            const interval = pollIntervalsRef.current.get(job.cardId)
            if (interval) {
              clearInterval(interval)
              pollIntervalsRef.current.delete(job.cardId)
            }
            setReEnrichingCards(prev => {
              const next = new Set(prev)
              next.delete(job.cardId)
              return next
            })
            setEnrichmentStatus(prev => {
              const next = new Map(prev)
              next.delete(job.cardId)
              return next
            })
          }, 120000)
        })
      }
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

  const handleBulkImport = async () => {
    if (!bulkCharacters.trim()) {
      showAlert('Please enter some characters to import', { type: 'error' })
      return
    }

    // Split by newlines and filter out empty lines
    const characters = bulkCharacters
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (characters.length === 0) {
      showAlert('No valid characters found', { type: 'error' })
      return
    }

    setBulkImporting(true)
    setBulkImportStartTime(Date.now())
    setBulkImportElapsed(0)
    setBulkImportResults(null)
    setBulkImportProgress(null)

    try {
      const response = await fetch('/api/admin/cards/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          characters,
          enrichImmediately,
          aiProvider: 'openai'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to import characters')
      }

      const data = await response.json()
      
      if (data.jobId) {
        // New async system - start polling for progress
        setBulkImportJobId(data.jobId)
        showAlert(`Import started for ${data.totalCharacters} characters`, { type: 'info' })
        
        // Start polling for job status
        pollBulkImportJob(data.jobId)
      } else {
        // Fallback to old synchronous response (shouldn't happen)
        setBulkImportResults(data)
        setBulkImporting(false)
        setBulkImportStartTime(null)
        fetchCards()
      }
      
    } catch (error) {
      console.error('Bulk import error:', error)
      showAlert('Failed to import characters', { type: 'error' })
      setBulkImporting(false)
      setBulkImportStartTime(null)
    }
  }

  const formatElapsedTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${seconds}s`
  }

  const updateEnrichmentCount = (increment: boolean = false) => {
    setBulkImportResults((prev: any) => {
      if (!prev) return prev
      const updated = { ...prev }
      if (increment) {
        updated.summary.completedEnrichment = (updated.summary.completedEnrichment || 0) + 1
        updated.summary.pendingEnrichment = Math.max(0, (updated.summary.pendingEnrichment || 0) - 1)
      }
      return updated
    })
  }

  const pollBulkImportJob = (jobId: string) => {
    // Clear any existing poll
    if (bulkImportPollRef.current) {
      clearInterval(bulkImportPollRef.current)
    }

    let pollCount = 0
    const maxPolls = 300 // 5 minutes maximum

    const poll = async () => {
      pollCount++
      
      try {
        const response = await fetch(`/api/admin/cards/bulk-import?jobId=${jobId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch job status')
        }
        
        const jobStatus = await response.json()
        
        // Update progress
        if (jobStatus.progress) {
          setBulkImportProgress(jobStatus.progress)
        }
        
        // Check if job is complete
        if (jobStatus.state === 'completed') {
          if (bulkImportPollRef.current) {
            clearInterval(bulkImportPollRef.current)
            bulkImportPollRef.current = null
          }
          
          setBulkImporting(false)
          setBulkImportJobId(null)
          setBulkImportStartTime(null)
          
          if (jobStatus.result) {
            // Initialize enrichment tracking counts
            const enrichmentCount = jobStatus.result.results?.enrichmentJobs?.length || 0
            const resultWithTracking = {
              ...jobStatus.result,
              summary: {
                ...jobStatus.result.summary,
                pendingEnrichment: enrichmentCount,
                completedEnrichment: 0
              }
            }
            setBulkImportResults(resultWithTracking)
            
            // Track individual enrichment jobs if any
            if (jobStatus.result.results?.enrichmentJobs?.length > 0) {
              jobStatus.result.results.enrichmentJobs.forEach((job: any) => {
                pollEnrichmentJob(job.jobId, job.cardId, job.hanzi)
              })
            }
          }
          
          fetchCards()
          showAlert('Bulk import completed successfully', { type: 'success' })
          
        } else if (jobStatus.state === 'failed') {
          if (bulkImportPollRef.current) {
            clearInterval(bulkImportPollRef.current)
            bulkImportPollRef.current = null
          }
          
          setBulkImporting(false)
          setBulkImportJobId(null)
          setBulkImportStartTime(null)
          
          const errorMsg = jobStatus.result?.error || 'Import failed'
          showAlert(`Bulk import failed: ${errorMsg}`, { type: 'error' })
          
        } else if (pollCount >= maxPolls) {
          // Timeout
          if (bulkImportPollRef.current) {
            clearInterval(bulkImportPollRef.current)
            bulkImportPollRef.current = null
          }
          
          setBulkImporting(false)
          setBulkImportJobId(null)
          setBulkImportStartTime(null)
          showAlert('Import timed out. Please check the admin panel later.', { type: 'warning' })
        }
      } catch (error) {
        console.error('Error polling bulk import job:', error)
        
        if (pollCount >= 10) {
          // Give up after 10 failed attempts
          if (bulkImportPollRef.current) {
            clearInterval(bulkImportPollRef.current)
            bulkImportPollRef.current = null
          }
          
          setBulkImporting(false)
          setBulkImportJobId(null)
          setBulkImportStartTime(null)
          showAlert('Failed to check import status', { type: 'error' })
        }
      }
    }
    
    // Start polling immediately
    poll()
    
    // Then poll every second
    bulkImportPollRef.current = setInterval(poll, 1000)
  }

  const pollEnrichmentJob = (jobId: string, cardId: string, hanzi: string) => {
    // Clear any existing interval for this card
    const existingInterval = pollIntervalsRef.current.get(cardId)
    if (existingInterval) {
      clearInterval(existingInterval)
      pollIntervalsRef.current.delete(cardId)
    }

    setReEnrichingCards(prev => new Set(prev).add(cardId))
    setEnrichmentStatus(prev => new Map(prev).set(cardId, 'Enriching...'))

    let attempts = 0
    const maxAttempts = 120 // 2 minutes timeout

    const pollInterval = setInterval(async () => {
      attempts++

      try {
        const statusResponse = await fetch(`/api/jobs/${jobId}/status`)
        const jobStatus = await statusResponse.json()

        if (jobStatus.state === 'completed') {
          clearInterval(pollInterval)
          pollIntervalsRef.current.delete(cardId)
          setReEnrichingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(cardId)
            return newSet
          })
          setEnrichmentStatus(prev => {
            const newMap = new Map(prev)
            newMap.delete(cardId)
            return newMap
          })
          updateEnrichmentCount(true) // Increment completed count
          fetchCards()
        } else if (jobStatus.state === 'failed' || attempts >= maxAttempts) {
          clearInterval(pollInterval)
          pollIntervalsRef.current.delete(cardId)
          setReEnrichingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(cardId)
            return newSet
          })
          setEnrichmentStatus(prev => {
            const newMap = new Map(prev)
            newMap.delete(cardId)
            return newMap
          })
          
          updateEnrichmentCount(true) // Still count as completed even if failed
          fetchCards()
        } else if (jobStatus.progress?.message) {
          setEnrichmentStatus(prev => new Map(prev).set(cardId, jobStatus.progress.message))
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval)
          pollIntervalsRef.current.delete(cardId)
          setReEnrichingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(cardId)
            return newSet
          })
          setEnrichmentStatus(prev => {
            const newMap = new Map(prev)
            newMap.delete(cardId)
            return newMap
          })
          updateEnrichmentCount(true) // Count as completed even on error
          fetchCards()
        }
      }
    }, 1000)

    pollIntervalsRef.current.set(cardId, pollInterval)
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

              <div className="flex gap-3">
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium rounded-lg transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Bulk Import
                </button>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
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
                    {selectedCards.size === cards.length ? 'Deselect All' : 'Select All'}
                  </button>
                  
                  {selectedCards.size > 0 && (
                    <>
                      <button
                        onClick={handleBulkReEnrich}
                        className="flex items-center gap-2 px-4 py-2 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium rounded-lg transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        Re-enrich {selectedCards.size} Cards
                      </button>
                      <button
                        onClick={() => setBulkDeleteConfirmation(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete {selectedCards.size} Cards
                      </button>
                    </>
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
              ) : viewMode === 'table' ? (
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
                                <>
                                  <button
                                    onClick={() => setPreviewImage(card.imageUrl || null)}
                                    className="p-1 hover:bg-[#21262d] rounded transition-colors"
                                    title="Click to preview image"
                                  >
                                    <ImageIcon className="w-4 h-4 text-green-500" />
                                  </button>
                                  <button
                                    onClick={async () => {
                                      setEditingImageCard(card)
                                      // If card has an existing prompt, use it; otherwise optimize
                                      if (card.imagePrompt) {
                                        setCustomImagePrompt(card.imagePrompt)
                                      } else {
                                        const { optimizeImagePrompt } = await import('@/lib/enrichment/prompt-optimization-service')
                                        const result = await optimizeImagePrompt(card.hanzi, card.meaning, card.pinyin, card.imagePrompt || undefined)
                                        setCustomImagePrompt(result.prompt)
                                      }
                                      setTempImageUrl(null)
                                    }}
                                    className="p-1 hover:bg-[#21262d] rounded transition-colors"
                                    title="Edit image prompt"
                                  >
                                    <Edit2 className="w-4 h-4 text-blue-500" />
                                  </button>
                                </>
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
                            <div className="flex items-center gap-2">
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
                              <button
                                onClick={() => setDeleteConfirmation({ cardId: card._id, hanzi: card.hanzi })}
                                className="flex items-center gap-2 px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-md transition-colors text-sm"
                                title="Delete card"
                              >
                                <Trash2 className="w-3 h-3" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Grid View */
                <div className="flex flex-wrap gap-4 p-6 justify-center">
                  {cards.map((card) => {
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
                          <div className="flex gap-2">
                            {card.audioUrl ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  playAudio(card.audioUrl!)
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#21262d] hover:bg-[#30363d] rounded-lg transition-colors"
                                title="Play audio"
                              >
                                <Volume2 className={`w-4 h-4 ${playingAudio === card.audioUrl ? 'text-[#f7cc48]' : 'text-gray-400'}`} />
                                <span className="text-sm text-gray-400">Audio</span>
                              </button>
                            ) : (
                              <div className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#161b22] rounded-lg cursor-not-allowed">
                                <Volume2 className="w-4 h-4 text-gray-600" />
                                <span className="text-sm text-gray-600">No audio</span>
                              </div>
                            )}
                            
                            {card.imageUrl && (
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation()
                                  setEditingImageCard(card)
                                  // If card has an existing prompt, use it; otherwise optimize
                                  if (card.imagePrompt) {
                                    setCustomImagePrompt(card.imagePrompt)
                                  } else {
                                    const { optimizeImagePrompt } = await import('@/lib/enrichment/prompt-optimization-service')
                                    const result = await optimizeImagePrompt(card.hanzi, card.meaning, card.pinyin, card.imagePrompt || undefined)
                                    setCustomImagePrompt(result.prompt)
                                  }
                                  setTempImageUrl(null)
                                }}
                                className="flex items-center justify-center gap-1 px-2 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                                title="Edit image"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleReEnrichCard(card._id)
                              }}
                              disabled={isReEnriching}
                              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteConfirmation({ cardId: card._id, hanzi: card.hanzi })
                              }}
                              className="px-3 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors text-sm"
                              title="Delete card"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
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
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setDeleteConfirmation(null)
            }
          }}
        >
          <div className="bg-[#161b22] rounded-2xl p-6 max-w-md w-full border border-[#30363d] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Delete Card</h2>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-3">
                Are you sure you want to delete this card?
              </p>
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                <div className="text-3xl font-bold text-[#f7cc48] text-center mb-2">
                  {deleteConfirmation.hanzi}
                </div>
                <p className="text-sm text-gray-500 text-center">
                  This will permanently delete the card and its associated media files.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                disabled={deleting}
                className="flex-1 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCard}
                disabled={deleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Card
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirmation && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !bulkDeleting) {
              setBulkDeleteConfirmation(false)
            }
          }}
        >
          <div className="bg-[#161b22] rounded-2xl p-6 max-w-md w-full border border-[#30363d] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Delete Multiple Cards</h2>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-3">
                Are you sure you want to delete {selectedCards.size} selected card{selectedCards.size > 1 ? 's' : ''}?
              </p>
              <div className="bg-[#0d1117] border border-[#30363d] rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#f7cc48] mb-2">
                    {selectedCards.size} Cards
                  </div>
                  <p className="text-sm text-gray-500">
                    Cards that are used in decks will be skipped automatically.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    This will permanently delete the cards, their character analyses, and associated media files.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setBulkDeleteConfirmation(false)}
                disabled={bulkDeleting}
                className="flex-1 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {bulkDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete {selectedCards.size} Cards
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !bulkImporting) {
              setShowBulkImport(false)
              setBulkCharacters('')
              setBulkImportResults(null)
              setBulkImportProgress(null)
              setBulkImportStartTime(null)
              setBulkImportElapsed(0)
            }
          }}
        >
          <div className="bg-[#161b22] rounded-2xl p-6 max-w-2xl w-full border border-[#30363d] shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#f7cc48] mb-4">Bulk Import Characters</h2>
            
            {/* Show progress if importing */}
            {bulkImporting && bulkImportProgress && (
              <div className="mb-6 bg-[#21262d] rounded-lg p-4 border border-[#30363d]">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Import Progress</h3>
                  <span className="text-sm text-[#f7cc48]">
                    Time elapsed: {formatElapsedTime(bulkImportElapsed)}
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-1">
                      <span>{bulkImportProgress.message || 'Processing...'}</span>
                      <span>
                        {bulkImportProgress.processed || 0} / {bulkImportProgress.total || 0}
                      </span>
                    </div>
                    <div className="w-full bg-[#0d1117] rounded-full h-2.5">
                      <div 
                        className="bg-[#f7cc48] h-2.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${bulkImportProgress.total > 0 
                            ? (bulkImportProgress.processed / bulkImportProgress.total) * 100 
                            : 0}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {bulkImportProgress.batchIndex && (
                    <p className="text-sm text-gray-400">
                      Batch {bulkImportProgress.batchIndex} of {bulkImportProgress.totalBatches}
                    </p>
                  )}
                  
                  {bulkImportProgress.results && (
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-green-400">
                        Created: {bulkImportProgress.results.created}
                      </div>
                      <div className="text-yellow-400">
                        Skipped: {bulkImportProgress.results.skipped}
                      </div>
                      <div className="text-red-400">
                        Errors: {bulkImportProgress.results.errors}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {!bulkImportResults && !bulkImporting ? (
              // Input form
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Enter Traditional Chinese characters (one per line)
                  </label>
                  <textarea
                    value={bulkCharacters}
                    onChange={(e) => setBulkCharacters(e.target.value)}
                    placeholder="Example:
學習
朋友
你好
謝謝"
                    className="w-full h-64 px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48] font-mono"
                    disabled={bulkImporting}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    • Traditional Chinese only
                    • One character or word per line
                    • Maximum 4 characters per word
                    • Duplicate characters will be skipped
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="enrichImmediately"
                      checked={enrichImmediately}
                      onChange={(e) => setEnrichImmediately(e.target.checked)}
                      disabled={bulkImporting}
                      className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                    />
                    <label htmlFor="enrichImmediately" className="text-sm text-gray-300">
                      Enrich cards immediately after import
                    </label>
                  </div>
                  
                </div>
                
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleBulkImport}
                    disabled={bulkImporting || !bulkCharacters.trim()}
                    className="flex-1 py-3 bg-[#f7cc48] hover:bg-[#f7cc48]/90 disabled:bg-gray-600 disabled:cursor-not-allowed text-black font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {bulkImporting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Import Characters
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      if (!bulkImporting) {
                        setShowBulkImport(false)
                        setBulkCharacters('')
                        setBulkImportResults(null)
                        setBulkImportStartTime(null)
                        setBulkImportElapsed(0)
                      }
                    }}
                    disabled={bulkImporting}
                    className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : bulkImportResults ? (
              // Results display
              <div className="space-y-4">
                <div className="bg-[#21262d] rounded-lg p-4 border border-[#30363d]">
                  <h3 className="text-lg font-semibold mb-3">Import Summary</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-400">Total Processed:</span>
                      <span className="ml-2 font-semibold">
                        {(bulkImportResults.summary.pendingEnrichment ?? 0) > 0 
                          ? bulkImportResults.summary.total - (bulkImportResults.summary.pendingEnrichment ?? 0)
                          : bulkImportResults.summary.total}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Created:</span>
                      <span className="ml-2 font-semibold text-green-400">{bulkImportResults.summary.created}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Skipped:</span>
                      <span className="ml-2 font-semibold text-yellow-400">{bulkImportResults.summary.skipped}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Errors:</span>
                      <span className="ml-2 font-semibold text-red-400">{bulkImportResults.summary.errors}</span>
                    </div>
                    {bulkImportResults.summary.enrichmentQueued > 0 && (
                      <div className="col-span-2">
                        {(bulkImportResults.summary.pendingEnrichment ?? 0) > 0 ? (
                          <>
                            <span className="text-gray-400">Enrichment Queued:</span>
                            <span className="ml-2 font-semibold text-blue-400">
                              {bulkImportResults.summary.pendingEnrichment}
                            </span>
                            {(bulkImportResults.summary.completedEnrichment ?? 0) > 0 && (
                              <span className="text-gray-400 ml-2">
                                ({bulkImportResults.summary.completedEnrichment} completed)
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-gray-400">Enrichment Completed:</span>
                            <span className="ml-2 font-semibold text-green-400">
                              {bulkImportResults.summary.completedEnrichment || 0}
                            </span>
                            <span className="text-gray-400 ml-1">
                              / {bulkImportResults.summary.enrichmentQueued}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Created cards */}
                {bulkImportResults.results.created.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {(bulkImportResults.summary.pendingEnrichment ?? 0) > 0 ? (
                        <span className="text-blue-400">
                          Currently Enriching ({bulkImportResults.summary.pendingEnrichment})
                        </span>
                      ) : (
                        <span className="text-green-400">
                          Done Importing ({bulkImportResults.results.created.length})
                        </span>
                      )}
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {bulkImportResults.results.created.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm text-gray-300 flex items-center gap-2">
                          {reEnrichingCards.has(item.cardId) ? (
                            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          ) : (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          )}
                          <span className="font-semibold">{item.hanzi}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Skipped cards */}
                {bulkImportResults.results.skipped.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400 mb-2">Skipped ({bulkImportResults.results.skipped.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {bulkImportResults.results.skipped.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm text-gray-300">
                          <span className="font-semibold">{item.hanzi}</span>
                          <span className="text-gray-500 ml-2">- {item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Errors */}
                {bulkImportResults.results.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-red-400 mb-2">Errors ({bulkImportResults.results.errors.length})</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {bulkImportResults.results.errors.map((item: any, idx: number) => (
                        <div key={idx} className="text-sm text-gray-300">
                          <span className="font-semibold">{item.hanzi}</span>
                          <span className="text-red-400 ml-2">- {item.error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-3 pt-4 border-t border-[#30363d]">
                  <button
                    onClick={() => {
                      setBulkCharacters('')
                      setBulkImportResults(null)
                    }}
                    className="flex-1 py-3 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium rounded-lg transition-colors"
                  >
                    Import More
                  </button>
                  <button
                    onClick={() => {
                      setShowBulkImport(false)
                      setBulkCharacters('')
                      setBulkImportResults(null)
                      setBulkImportStartTime(null)
                      setBulkImportElapsed(0)
                      fetchCards() // Refresh the cards list
                    }}
                    className="flex-1 py-3 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Image Prompt Edit Modal */}
      {editingImageCard && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#161b22] rounded-2xl p-6 max-w-4xl w-full border border-[#30363d] shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#f7cc48] mb-4">
              Edit Image for {editingImageCard.hanzi}
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Image */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Current Image</h3>
                {editingImageCard.imageUrl ? (
                  <img 
                    src={editingImageCard.imageUrl} 
                    alt={editingImageCard.hanzi}
                    className="w-full rounded-lg border border-[#30363d]"
                  />
                ) : (
                  <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-gray-600" />
                  </div>
                )}
                {/* Removed duplicate prompt display since it's now in the editable field */}
              </div>
              
              {/* New Image Preview */}
              <div>
                <h3 className="text-lg font-semibold mb-3">New Image Preview</h3>
                {tempImageUrl ? (
                  <img 
                    src={tempImageUrl} 
                    alt="Preview"
                    className="w-full rounded-lg border border-[#30363d]"
                  />
                ) : (
                  <div className="aspect-square bg-gray-900 rounded-lg flex items-center justify-center">
                    {generatingImage ? (
                      <Loader2 className="w-8 h-8 text-[#f7cc48] animate-spin" />
                    ) : (
                      <span className="text-gray-500 text-center px-4">
                        Generate a new image to see preview
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {/* Prompt Editor */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image Generation Prompt
              </label>
              <textarea
                value={customImagePrompt}
                onChange={(e) => setCustomImagePrompt(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] h-24 resize-none"
                placeholder="Enter a detailed prompt for image generation..."
              />
              <p className="text-xs text-gray-400 mt-2">
                Tip: Be specific about style, composition, and visual elements. The AI will create an illustration based on this prompt.
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex justify-between mt-6">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!customImagePrompt.trim()) {
                      showAlert('Please enter a prompt', { type: 'error' })
                      return
                    }
                    
                    setGeneratingImage(true)
                    try {
                      const response = await fetch('/api/admin/cards/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          cardId: editingImageCard._id,
                          prompt: customImagePrompt,
                          preview: true
                        })
                      })
                      
                      const data = await response.json()
                      if (data.success && data.imageUrl) {
                        setTempImageUrl(data.imageUrl)
                        showAlert('Preview image generated!', { type: 'success' })
                      } else {
                        showAlert(data.error || 'Failed to generate image', { type: 'error' })
                      }
                    } catch (error) {
                      console.error('Error generating image:', error)
                      showAlert('Failed to generate image', { type: 'error' })
                    } finally {
                      setGeneratingImage(false)
                    }
                  }}
                  disabled={generatingImage || !customImagePrompt.trim()}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Preview...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4" />
                      Generate Preview
                    </>
                  )}
                </button>
                
                {tempImageUrl && (
                  <button
                    onClick={async () => {
                      setSavingImage(true)
                      try {
                        const response = await fetch('/api/admin/cards/save-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            cardId: editingImageCard._id,
                            imageUrl: tempImageUrl,
                            prompt: customImagePrompt
                          })
                        })
                        
                        const data = await response.json()
                        if (data.success) {
                          showAlert('Image saved successfully!', { type: 'success' })
                          // Update the card in the local state with new image URL and path
                          setCards(cards.map(c => 
                            c._id === editingImageCard._id 
                              ? { 
                                  ...c, 
                                  imageUrl: data.imageUrl, 
                                  imagePath: data.imagePath,
                                  imagePrompt: customImagePrompt 
                                }
                              : c
                          ))
                          setEditingImageCard(null)
                          setCustomImagePrompt('')
                          setTempImageUrl(null)
                        } else {
                          showAlert(data.error || 'Failed to save image', { type: 'error' })
                        }
                      } catch (error) {
                        console.error('Error saving image:', error)
                        showAlert('Failed to save image', { type: 'error' })
                      } finally {
                        setSavingImage(false)
                      }
                    }}
                    disabled={savingImage}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    {savingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Accept & Save
                      </>
                    )}
                  </button>
                )}
              </div>
              
              <button
                onClick={() => {
                  setEditingImageCard(null)
                  setCustomImagePrompt('')
                  setTempImageUrl(null)
                }}
                className="px-6 py-3 bg-[#21262d] hover:bg-[#30363d] text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  )
}