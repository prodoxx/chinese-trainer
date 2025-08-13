'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { 
  ChevronLeft,
  Activity,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Package,
  Users,
  BarChart3,
  Server,
  Cpu,
  HardDrive,
  Gauge,
  Trash2
} from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

interface WorkerStatus {
  name: string
  lastHeartbeat: string
  isHealthy: boolean
  processedJobs: number
  failedJobs: number
}

interface QueueStats {
  name: string
  waiting: number
  active: number
  completed: number
  failed: number
  delayed: number
  total: number
}

interface WorkerHealth {
  status: 'healthy' | 'degraded' | 'error'
  workers: WorkerStatus[]
  queues: QueueStats[]
  summary: {
    totalWorkers: number
    healthyWorkers: number
    totalQueued: number
    totalCompleted: number
    totalFailed: number
  }
  timestamp: string
}

export default function AdminWorkersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { showAlert } = useAlert()
  const [health, setHealth] = useState<WorkerHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [showClearModal, setShowClearModal] = useState(false)
  const [clearingQueues, setClearingQueues] = useState(false)
  const [selectedQueues, setSelectedQueues] = useState<string[]>([])
  const [clearOptions, setClearOptions] = useState({
    clearWaiting: true,
    clearDelayed: true,
    clearFailed: false,
    clearCompleted: false
  })
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null)

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

    fetchHealth()
  }, [session, status, router, showAlert])

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      refreshIntervalRef.current = setInterval(() => {
        fetchHealth(true)
      }, 5000) // Refresh every 5 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current)
      }
    }
  }, [autoRefresh])

  const fetchHealth = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true)
      }
      
      const response = await fetch('/api/admin/workers/health')
      if (!response.ok) throw new Error('Failed to fetch worker health')
      
      const data = await response.json()
      setHealth(data)
      
      // Add to historical data (keep last 20 data points)
      setHistoricalData(prev => {
        const newPoint = {
          time: new Date(data.timestamp).toLocaleTimeString(),
          queued: data.summary.totalQueued,
          completed: data.summary.totalCompleted,
          failed: data.summary.totalFailed,
          healthy: data.summary.healthyWorkers
        }
        const updated = [...prev, newPoint]
        return updated.slice(-20)
      })
    } catch (error) {
      console.error('Error fetching worker health:', error)
      if (!silent) {
        showAlert('Failed to fetch worker health', { type: 'error' })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchHealth()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-500'
      case 'degraded':
        return 'text-yellow-500'
      case 'error':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'degraded':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />
    }
  }

  const formatHeartbeat = (heartbeat: string) => {
    const date = new Date(heartbeat)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const calculateSuccessRate = (completed: number, failed: number) => {
    const total = completed + failed
    if (total === 0) return 100
    return Math.round((completed / total) * 100)
  }

  // Prepare pie chart data
  const getPieChartData = () => {
    if (!health) return []
    
    return health.queues.map(queue => ({
      name: queue.name.replace('-', ' '),
      value: queue.total,
      completed: queue.completed,
      failed: queue.failed
    }))
  }

  const COLORS = ['#f7cc48', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6']

  const handleClearQueues = async () => {
    if (selectedQueues.length === 0) {
      showAlert('Please select at least one queue to clear', { type: 'warning' })
      return
    }

    setClearingQueues(true)
    try {
      const response = await fetch('/api/admin/workers/clear-queues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queues: selectedQueues,
          ...clearOptions
        })
      })

      if (!response.ok) {
        throw new Error('Failed to clear queues')
      }

      const result = await response.json()
      showAlert(result.message, { type: 'success' })
      setShowClearModal(false)
      setSelectedQueues([])
      
      // Refresh the health status
      await fetchHealth()
    } catch (error) {
      console.error('Error clearing queues:', error)
      showAlert('Failed to clear queues', { type: 'error' })
    } finally {
      setClearingQueues(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#f7cc48]" />
            <span className="text-lg">Loading worker status...</span>
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
                  <Activity className="w-8 h-8 text-[#f7cc48]" />
                  <h1 className="text-3xl font-bold text-[#f7cc48]">Worker Monitoring</h1>
                </div>
                <p className="text-gray-400">Monitor background job workers and queue health</p>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                  />
                  Auto-refresh (5s)
                </label>
                <button
                  onClick={() => setShowClearModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear Queues
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
          </div>

          {health && (
            <>
              {/* Overall Status */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {getStatusIcon(health.status)}
                    System Status
                  </h2>
                  <span className={`text-lg font-medium ${getStatusColor(health.status)}`}>
                    {health.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="bg-[#0d1117] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Server className="w-4 h-4" />
                      <span className="text-sm">Total Workers</span>
                    </div>
                    <p className="text-2xl font-bold text-white">{health.summary.totalWorkers}</p>
                  </div>
                  
                  <div className="bg-[#0d1117] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Healthy</span>
                    </div>
                    <p className="text-2xl font-bold text-green-400">{health.summary.healthyWorkers}</p>
                  </div>
                  
                  <div className="bg-[#0d1117] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Queued</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-400">{health.summary.totalQueued.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-[#0d1117] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-sm">Completed</span>
                    </div>
                    <p className="text-2xl font-bold text-[#f7cc48]">{health.summary.totalCompleted.toLocaleString()}</p>
                  </div>
                  
                  <div className="bg-[#0d1117] rounded-lg p-4">
                    <div className="flex items-center gap-2 text-gray-400 mb-1">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">Failed</span>
                    </div>
                    <p className="text-2xl font-bold text-red-400">{health.summary.totalFailed.toLocaleString()}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {calculateSuccessRate(health.summary.totalCompleted, health.summary.totalFailed)}% success
                    </p>
                  </div>
                </div>
              </div>

              {/* Real-time Chart */}
              {historicalData.length > 0 && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-[#f7cc48]" />
                    Real-time Activity
                  </h2>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
                      <XAxis dataKey="time" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}
                        labelStyle={{ color: '#f7cc48' }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="queued" stroke="#3b82f6" name="Queued" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="healthy" stroke="#10b981" name="Healthy Workers" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Workers Status */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-[#f7cc48]" />
                  Worker Status
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#0d1117] border-b border-[#30363d]">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Worker Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Last Heartbeat
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Processed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Failed
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                          Success Rate
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363d]">
                      {health.workers.map((worker) => (
                        <tr key={worker.name} className="hover:bg-[#0d1117] transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-white">
                            {worker.name}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {worker.isHealthy ? (
                                <>
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                  <span className="text-sm text-green-500">Healthy</span>
                                </>
                              ) : (
                                <>
                                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                                  <span className="text-sm text-red-500">Unhealthy</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {formatHeartbeat(worker.lastHeartbeat)}
                          </td>
                          <td className="px-6 py-4 text-sm text-white">
                            {worker.processedJobs.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-400">
                            {worker.failedJobs.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-[#0d1117] rounded-full h-2 max-w-[100px]">
                                <div
                                  className={`h-2 rounded-full ${
                                    calculateSuccessRate(worker.processedJobs, worker.failedJobs) >= 95
                                      ? 'bg-green-500'
                                      : calculateSuccessRate(worker.processedJobs, worker.failedJobs) >= 80
                                      ? 'bg-yellow-500'
                                      : 'bg-red-500'
                                  }`}
                                  style={{
                                    width: `${calculateSuccessRate(worker.processedJobs, worker.failedJobs)}%`
                                  }}
                                />
                              </div>
                              <span className="text-sm text-gray-400">
                                {calculateSuccessRate(worker.processedJobs, worker.failedJobs)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Queue Statistics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Queue Table */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#f7cc48]" />
                    Queue Statistics
                  </h2>
                  <div className="space-y-3">
                    {health.queues.map((queue) => (
                      <div key={queue.name} className="bg-[#0d1117] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-white capitalize">
                            {queue.name.replace('-', ' ')}
                          </h3>
                          {queue.active > 0 && (
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                              <span className="text-xs text-green-500">Active</span>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Waiting:</span>
                            <span className="ml-1 text-yellow-400 font-medium">{queue.waiting}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Active:</span>
                            <span className="ml-1 text-green-400 font-medium">{queue.active}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Delayed:</span>
                            <span className="ml-1 text-blue-400 font-medium">{queue.delayed}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Completed:</span>
                            <span className="ml-1 text-[#f7cc48] font-medium">{queue.completed.toLocaleString()}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Failed:</span>
                            <span className="ml-1 text-red-400 font-medium">{queue.failed}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Success:</span>
                            <span className="ml-1 text-gray-300 font-medium">
                              {calculateSuccessRate(queue.completed, queue.failed)}%
                            </span>
                          </div>
                        </div>
                        {queue.total > 0 && (
                          <div className="mt-2">
                            <div className="w-full bg-[#21262d] rounded-full h-2">
                              <div
                                className="bg-[#f7cc48] h-2 rounded-full transition-all"
                                style={{
                                  width: `${Math.min(100, (queue.active / queue.total) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Queue Distribution Pie Chart */}
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <Gauge className="w-5 h-5 text-[#f7cc48]" />
                    Queue Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={getPieChartData()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getPieChartData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #30363d' }}
                        labelStyle={{ color: '#f7cc48' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Important Information */}
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-[#f7cc48]" />
                  Important Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-[#f7cc48] mb-2">Worker Types</h3>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>• <strong>deck-import:</strong> Processes CSV deck imports</li>
                      <li>• <strong>deck-enrichment:</strong> Enriches entire decks</li>
                      <li>• <strong>card-enrichment:</strong> Enriches individual cards</li>
                      <li>• <strong>bulk-import:</strong> Handles bulk character imports</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-[#f7cc48] mb-2">Health Indicators</h3>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>• <strong>Healthy:</strong> All workers running, low queue backlog</li>
                      <li>• <strong>Degraded:</strong> High backlog or failure rate {'>'} 10%</li>
                      <li>• <strong>Error:</strong> Workers down or system failure</li>
                      <li>• <strong>Heartbeat:</strong> Workers ping every 30 seconds</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-[#f7cc48] mb-2">Performance Metrics</h3>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>• <strong>Batch Size:</strong> 10 characters per batch</li>
                      <li>• <strong>Rate Limits:</strong> OpenAI 2/s, Fal.ai 1/s</li>
                      <li>• <strong>Concurrency:</strong> 3 enrichments in parallel</li>
                      <li>• <strong>Lock Duration:</strong> 5-10 minutes per job</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-[#f7cc48] mb-2">Troubleshooting</h3>
                    <ul className="space-y-1 text-sm text-gray-400">
                      <li>• <strong>High backlog:</strong> Scale workers horizontally</li>
                      <li>• <strong>High failures:</strong> Check API keys and limits</li>
                      <li>• <strong>Stuck jobs:</strong> Check Redis connection</li>
                      <li>• <strong>No heartbeat:</strong> Restart worker process</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Clear Queues Modal */}
      {showClearModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !clearingQueues) {
              setShowClearModal(false)
            }
          }}
        >
          <div className="bg-[#161b22] rounded-2xl p-6 max-w-lg w-full border border-[#30363d] shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-900/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Clear Job Queues</h2>
                <p className="text-sm text-gray-400">Remove jobs from selected queues</p>
              </div>
            </div>
            
            {/* Queue Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Select Queues to Clear</h3>
              <div className="space-y-2">
                {health?.queues.map((queue) => (
                  <label key={queue.name} className="flex items-center gap-3 p-3 bg-[#0d1117] rounded-lg cursor-pointer hover:bg-[#21262d] transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedQueues.includes(queue.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQueues([...selectedQueues, queue.name])
                        } else {
                          setSelectedQueues(selectedQueues.filter(q => q !== queue.name))
                        }
                      }}
                      className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">{queue.name}</div>
                      <div className="text-xs text-gray-500">
                        {queue.waiting} waiting, {queue.active} active, {queue.failed} failed
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            {/* Clear Options */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-300 mb-3">Job Types to Clear</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={clearOptions.clearWaiting}
                    onChange={(e) => setClearOptions({ ...clearOptions, clearWaiting: e.target.checked })}
                    className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                  />
                  <span className="text-sm text-gray-300">Waiting Jobs</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={clearOptions.clearDelayed}
                    onChange={(e) => setClearOptions({ ...clearOptions, clearDelayed: e.target.checked })}
                    className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                  />
                  <span className="text-sm text-gray-300">Delayed Jobs</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={clearOptions.clearFailed}
                    onChange={(e) => setClearOptions({ ...clearOptions, clearFailed: e.target.checked })}
                    className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                  />
                  <span className="text-sm text-gray-300">Failed Jobs</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={clearOptions.clearCompleted}
                    onChange={(e) => setClearOptions({ ...clearOptions, clearCompleted: e.target.checked })}
                    className="rounded border-gray-600 text-[#f7cc48] focus:ring-[#f7cc48]"
                  />
                  <span className="text-sm text-gray-300">Completed Jobs</span>
                </label>
              </div>
            </div>
            
            {/* Warning */}
            <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3 mb-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                <div className="text-sm text-red-400">
                  <p className="font-medium mb-1">Warning</p>
                  <p>This action cannot be undone. Active jobs cannot be cleared and will continue running.</p>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowClearModal(false)
                  setSelectedQueues([])
                }}
                disabled={clearingQueues}
                className="flex-1 py-2 bg-[#21262d] hover:bg-[#30363d] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleClearQueues}
                disabled={clearingQueues || selectedQueues.length === 0}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {clearingQueues ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Clear Selected
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </>
  )
}