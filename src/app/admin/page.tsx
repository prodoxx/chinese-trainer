'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { 
  Users, 
  FolderOpen,
  ChevronRight,
  Shield,
  BarChart3,
  RefreshCw,
  Calendar,
  Mail,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  BookOpen
} from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'

// Import admin components
import UsersView from './components/UsersView'
import DecksView from './components/DecksView'

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { showAlert } = useAlert()
  const [activeTab, setActiveTab] = useState('users')
  const [loading, setLoading] = useState(true)

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

    setLoading(false)
  }, [session, status, router, showAlert])

  if (loading || status === 'loading') {
    return (
      <>
        <Navigation />
        <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-[#f7cc48]" />
            <span className="text-lg">Loading admin panel...</span>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  const tabs = [
    { id: 'users', label: 'Users', icon: Users, description: 'Manage user accounts' },
    { id: 'decks', label: 'Decks', icon: FolderOpen, description: 'View all user decks' },
    { id: 'cards', label: 'Cards', icon: BookOpen, description: 'Manage all cards' },
  ]

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-8 h-8 text-[#f7cc48]" />
            <h1 className="text-3xl font-bold text-[#f7cc48]">Admin Panel</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeTab === tab.id
                          ? 'bg-[#21262d] text-[#f7cc48] border border-[#30363d]'
                          : 'text-gray-400 hover:text-white hover:bg-[#161b22]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div className="flex-1 text-left">
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-gray-500">{tab.description}</div>
                      </div>
                      {activeTab === tab.id && (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {activeTab === 'users' && <UsersView />}
              {activeTab === 'decks' && <DecksView />}
              {activeTab === 'cards' && (
                <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
                  <h2 className="text-xl font-bold text-white mb-4">Cards Management</h2>
                  <p className="text-gray-400 mb-6">View and manage all cards in the database.</p>
                  <Link 
                    href="/admin/cards"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-medium rounded-lg transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    Go to Cards Page
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  )
}