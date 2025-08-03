'use client'

import { useState, useEffect } from 'react'
import { 
  Users, 
  Mail, 
  Calendar,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Shield
} from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'

interface User {
  id: string
  email: string
  name: string | null
  emailVerified: Date | null
  role: string | null
  createdAt: Date
  settings?: {
    showFlashDemo: boolean
    reduceMotion: boolean
    brightness: number
  } | null
  _count?: {
    accounts: number
  }
}

interface UserStats {
  totalUsers: number
  verifiedUsers: number
  unverifiedUsers: number
  adminUsers: number
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
}

export default function UsersView() {
  const { showAlert } = useAlert()
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all')
  const [refreshing, setRefreshing] = useState(false)

  const itemsPerPage = 10

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchTerm, filterVerified])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
        verified: filterVerified
      })

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')

      const data = await response.json()
      setUsers(data.users)
      setStats(data.stats)
      setTotalPages(data.totalPages)
    } catch (error) {
      console.error('Error fetching users:', error)
      showAlert('Failed to fetch users', { type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchUsers()
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

  const getTimeSince = (date: Date | string) => {
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

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-[#f7cc48]" />
              <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
            </div>
            <p className="text-sm text-gray-400">Total Users</p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span className="text-2xl font-bold text-white">{stats.verifiedUsers}</span>
            </div>
            <p className="text-sm text-gray-400">Verified Users</p>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round((stats.verifiedUsers / stats.totalUsers) * 100)}% of total
            </p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <span className="text-2xl font-bold text-white">{stats.newUsersToday}</span>
            </div>
            <p className="text-sm text-gray-400">New Today</p>
            <p className="text-xs text-gray-500 mt-1">
              This week: {stats.newUsersThisWeek} | This month: {stats.newUsersThisMonth}
            </p>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Shield className="w-5 h-5 text-purple-500" />
              <span className="text-2xl font-bold text-white">{stats.adminUsers}</span>
            </div>
            <p className="text-sm text-gray-400">Admin Users</p>
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
                placeholder="Search by email or name..."
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
              value={filterVerified}
              onChange={(e) => {
                setFilterVerified(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
            >
              <option value="all">All Users</option>
              <option value="verified">Verified Only</option>
              <option value="unverified">Unverified Only</option>
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
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 animate-spin text-[#f7cc48]" />
              <span className="text-gray-400">Loading users...</span>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <Users className="w-12 h-12 text-gray-600 mb-3" />
            <p className="text-gray-400">No users found</p>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0d1117] border-b border-[#30363d]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Settings
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d]">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-[#0d1117] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#21262d] rounded-full flex items-center justify-center">
                            <span className="text-[#f7cc48] font-medium">
                              {user.email.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-white font-medium">
                              {user.name || 'Unnamed User'}
                            </div>
                            <div className="text-sm text-gray-400 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.emailVerified ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-sm text-green-400">Verified</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-400">Unverified</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'admin' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/50 text-purple-300">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900/50 text-gray-300">
                            User
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="text-white">{getTimeSince(user.createdAt)}</div>
                          <div className="text-xs text-gray-500">{formatDate(user.createdAt)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-gray-400">
                          {user.settings ? (
                            <>
                              <div>Flash demo: {user.settings.showFlashDemo ? 'On' : 'Off'}</div>
                              <div>Motion: {user.settings.reduceMotion ? 'Reduced' : 'Normal'}</div>
                              <div>Brightness: {Math.round(user.settings.brightness * 100)}%</div>
                            </>
                          ) : (
                            <div className="text-gray-500">No settings</div>
                          )}
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