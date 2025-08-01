'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { 
  User, 
  Bell, 
  Palette, 
  Globe, 
  Shield, 
  Database, 
  LogOut,
  Save,
  Check,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
  AlertCircle,
  Zap,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react'
import { useAlert } from '@/hooks/useAlert'

interface UserSettings {
  email: string
  displayName: string
  notifications: {
    emailReminders: boolean
    dailyGoalReminders: boolean
    achievementNotifications: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'system'
    language: 'en' | 'zh-TW' | 'zh-CN'
    defaultDifficulty: 'easy' | 'medium' | 'hard'
    autoPlayAudio: boolean
    showPinyin: boolean
    fontSize: 'small' | 'medium' | 'large'
  }
  studyGoals: {
    dailyCards: number
    weeklyDays: number
  }
  flashSession: {
    showDemo: boolean
    reduceMotion: boolean
    brightness: number
  }
}

// Badge component for unimplemented features
const NotImplementedBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-900/50 text-yellow-300 rounded-full">
    <AlertCircle className="w-3 h-3" />
    Not Implemented
  </span>
)

export default function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { showAlert, showConfirm } = useAlert()
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<UserSettings>({
    email: 'user@example.com',
    displayName: 'User',
    notifications: {
      emailReminders: true,
      dailyGoalReminders: true,
      achievementNotifications: true
    },
    preferences: {
      theme: 'dark',
      language: 'en',
      defaultDifficulty: 'medium',
      autoPlayAudio: true,
      showPinyin: true,
      fontSize: 'medium'
    },
    studyGoals: {
      dailyCards: 20,
      weeklyDays: 5
    },
    flashSession: {
      showDemo: true,
      reduceMotion: false,
      brightness: 1.0
    }
  })
  
  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin'

  useEffect(() => {
    // Load user settings
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        showAlert('Settings saved successfully', { type: 'success' })
      } else {
        showAlert('Failed to save settings', { type: 'error' })
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      showAlert('Failed to save settings', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = async () => {
    const confirmed = await showConfirm('Are you sure you want to log out?', {
      type: 'warning',
      confirmText: 'Log Out',
      cancelText: 'Cancel'
    })

    if (confirmed) {
      // Implement logout logic
      router.push('/auth/signin')
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.',
      {
        type: 'error',
        confirmText: 'Delete Account',
        cancelText: 'Cancel'
      }
    )

    if (confirmed) {
      try {
        const response = await fetch('/api/user/delete', {
          method: 'DELETE'
        })

        if (response.ok) {
          showAlert('Account deleted successfully', { type: 'success' })
          router.push('/')
        } else {
          showAlert('Failed to delete account', { type: 'error' })
        }
      } catch (error) {
        console.error('Error deleting account:', error)
        showAlert('Failed to delete account', { type: 'error' })
      }
    }
  }

  // Define which settings are implemented
  const implementedSettings = {
    profile: {
      displayName: true,
      email: false // Email change not implemented
    },
    notifications: false, // Notifications not implemented
    preferences: {
      theme: false, // Theme switching not implemented
      language: false, // Language switching not implemented
      defaultDifficulty: false,
      autoPlayAudio: true, // This is implemented in flash sessions
      showPinyin: false,
      fontSize: false
    },
    flashSession: {
      showDemo: true, // Implemented
      reduceMotion: true, // Implemented
      brightness: true // Implemented
    },
    goals: false, // Study goals not implemented
    privacy: false, // Privacy settings not implemented
    data: false // Data management not implemented
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User, implemented: true },
    { id: 'notifications', label: 'Notifications', icon: Bell, implemented: implementedSettings.notifications },
    { id: 'preferences', label: 'Preferences', icon: Palette, implemented: true }, // Has some implemented features
    { id: 'flashSession', label: 'Flash Session', icon: Zap, implemented: true }, // New tab for flash session settings
    { id: 'goals', label: 'Study Goals', icon: Globe, implemented: implementedSettings.goals },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, implemented: implementedSettings.privacy },
    { id: 'data', label: 'Data Management', icon: Database, implemented: implementedSettings.data }
  ].filter(tab => tab.implemented || isAdmin) // Only show unimplemented tabs to admins

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-4rem)] bg-[#0d1117] text-white font-learning flex flex-col">
        <div className="flex-1 max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
          <h1 className="text-3xl font-bold text-[#f7cc48] mb-8">Settings</h1>

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
                      <span className="font-medium">{tab.label}</span>
                      {!tab.implemented && isAdmin && (
                        <NotImplementedBadge />
                      )}
                      {activeTab === tab.id && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </button>
                  )
                })}
              </nav>

              <button
                onClick={handleLogout}
                className="w-full mt-8 flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Display Name
                      </label>
                      <input
                        type="text"
                        value={settings.displayName}
                        onChange={(e) => setSettings({ ...settings, displayName: e.target.value })}
                        className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48]"
                      />
                    </div>

                    {(implementedSettings.profile.email || isAdmin) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          Email Address
                          {!implementedSettings.profile.email && isAdmin && <NotImplementedBadge />}
                        </label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                          disabled={!implementedSettings.profile.email}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold">Notification Settings</h2>
                      {isAdmin && <NotImplementedBadge />}
                    </div>
                    
                    <div className="space-y-4 opacity-50">
                      <label className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d] cursor-not-allowed">
                        <div>
                          <div className="font-medium">Email Reminders</div>
                          <div className="text-sm text-gray-400">Get reminders about your daily study sessions</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailReminders}
                          onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, emailReminders: e.target.checked }
                          })}
                          disabled
                          className="w-5 h-5 text-[#f7cc48] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#f7cc48] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d] cursor-not-allowed">
                        <div>
                          <div className="font-medium">Daily Goal Reminders</div>
                          <div className="text-sm text-gray-400">Notify when you haven't met your daily goal</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.dailyGoalReminders}
                          onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, dailyGoalReminders: e.target.checked }
                          })}
                          disabled
                          className="w-5 h-5 text-[#f7cc48] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#f7cc48] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d] cursor-not-allowed">
                        <div>
                          <div className="font-medium">Achievement Notifications</div>
                          <div className="text-sm text-gray-400">Celebrate your learning milestones</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.achievementNotifications}
                          onChange={(e) => setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, achievementNotifications: e.target.checked }
                          })}
                          disabled
                          className="w-5 h-5 text-[#f7cc48] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#f7cc48] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Learning Preferences</h2>
                    
                    {(implementedSettings.preferences.theme || isAdmin) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          Theme
                          {!implementedSettings.preferences.theme && isAdmin && <NotImplementedBadge />}
                        </label>
                        <div className={`grid grid-cols-3 gap-3 ${!implementedSettings.preferences.theme ? 'opacity-50' : ''}`}>
                          {[
                            { value: 'light', label: 'Light', icon: Sun },
                            { value: 'dark', label: 'Dark', icon: Moon },
                            { value: 'system', label: 'System', icon: Monitor }
                          ].map((theme) => {
                            const Icon = theme.icon
                            return (
                              <button
                                key={theme.value}
                                onClick={() => !implementedSettings.preferences.theme ? null : setSettings({
                                  ...settings,
                                  preferences: { ...settings.preferences, theme: theme.value as any }
                                })}
                                disabled={!implementedSettings.preferences.theme}
                                className={`flex flex-col items-center gap-2 p-4 rounded-lg border ${
                                  settings.preferences.theme === theme.value
                                    ? 'bg-[#21262d] border-[#f7cc48] text-[#f7cc48]'
                                    : 'bg-[#0d1117] border-[#30363d] text-gray-400'
                                } transition-all ${implementedSettings.preferences.theme ? 'hover:border-[#f7cc48]/30 cursor-pointer' : 'cursor-not-allowed'}`}
                              >
                                <Icon className="w-6 h-6" />
                                <span className="text-sm font-medium">{theme.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {(implementedSettings.preferences.language || isAdmin) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          Language
                          {!implementedSettings.preferences.language && isAdmin && <NotImplementedBadge />}
                        </label>
                        <select
                          value={settings.preferences.language}
                          onChange={(e) => setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, language: e.target.value as any }
                          })}
                          disabled={!implementedSettings.preferences.language}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="en">English</option>
                          <option value="zh-TW">繁體中文</option>
                          <option value="zh-CN">简体中文</option>
                        </select>
                      </div>
                    )}

                    {(implementedSettings.preferences.defaultDifficulty || isAdmin) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          Default Difficulty
                          {!implementedSettings.preferences.defaultDifficulty && isAdmin && <NotImplementedBadge />}
                        </label>
                        <select
                          value={settings.preferences.defaultDifficulty}
                          onChange={(e) => setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, defaultDifficulty: e.target.value as any }
                          })}
                          disabled={!implementedSettings.preferences.defaultDifficulty}
                          className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:outline-none focus:border-[#f7cc48] focus:ring-1 focus:ring-[#f7cc48] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>
                    )}

                    {(implementedSettings.preferences.fontSize || isAdmin) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                          Font Size
                          {!implementedSettings.preferences.fontSize && isAdmin && <NotImplementedBadge />}
                        </label>
                        <div className={`grid grid-cols-3 gap-3 ${!implementedSettings.preferences.fontSize ? 'opacity-50' : ''}`}>
                          {[
                            { value: 'small', label: 'Small', size: 'text-sm' },
                            { value: 'medium', label: 'Medium', size: 'text-base' },
                            { value: 'large', label: 'Large', size: 'text-lg' }
                          ].map((size) => (
                            <button
                              key={size.value}
                              onClick={() => !implementedSettings.preferences.fontSize ? null : setSettings({
                                ...settings,
                                preferences: { ...settings.preferences, fontSize: size.value as any }
                              })}
                              disabled={!implementedSettings.preferences.fontSize}
                              className={`p-4 rounded-lg border ${
                                settings.preferences.fontSize === size.value
                                  ? 'bg-[#21262d] border-[#f7cc48] text-[#f7cc48]'
                                  : 'bg-[#0d1117] border-[#30363d] text-gray-400'
                              } transition-all ${implementedSettings.preferences.fontSize ? 'hover:border-[#f7cc48]/30 cursor-pointer' : 'cursor-not-allowed'}`}
                            >
                              <span className={`font-medium ${size.size}`}>Aa</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d] cursor-pointer hover:border-[#f7cc48]/30 transition-colors">
                        <div>
                          <div className="font-medium">Auto-play Audio</div>
                          <div className="text-sm text-gray-400">Automatically play character pronunciation</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.preferences.autoPlayAudio}
                          onChange={(e) => setSettings({
                            ...settings,
                            preferences: { ...settings.preferences, autoPlayAudio: e.target.checked }
                          })}
                          className="w-5 h-5 text-[#f7cc48] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#f7cc48]"
                        />
                      </label>

                      {(implementedSettings.preferences.showPinyin || isAdmin) && (
                        <label className={`flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d] transition-colors ${
                          implementedSettings.preferences.showPinyin ? 'cursor-pointer hover:border-[#f7cc48]/30' : 'cursor-not-allowed opacity-50'
                        }`}>
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              Show Pinyin
                              {!implementedSettings.preferences.showPinyin && isAdmin && <NotImplementedBadge />}
                            </div>
                            <div className="text-sm text-gray-400">Display pinyin pronunciation guides</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.preferences.showPinyin}
                            onChange={(e) => setSettings({
                              ...settings,
                              preferences: { ...settings.preferences, showPinyin: e.target.checked }
                            })}
                            disabled={!implementedSettings.preferences.showPinyin}
                            className="w-5 h-5 text-[#f7cc48] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#f7cc48] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </label>
                      )}
                    </div>
                  </div>
                )}

                {/* Flash Session Tab */}
                {activeTab === 'flashSession' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Flash Session Settings</h2>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d] cursor-pointer hover:border-[#f7cc48]/30 transition-colors">
                        <div>
                          <div className="font-medium">Show Tutorial Demo</div>
                          <div className="text-sm text-gray-400">Display the interactive tutorial when starting flash sessions</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.flashSession.showDemo}
                          onChange={(e) => setSettings({
                            ...settings,
                            flashSession: { ...settings.flashSession, showDemo: e.target.checked }
                          })}
                          className="w-5 h-5 text-[#f7cc48] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#f7cc48]"
                        />
                      </label>

                      <label className="flex items-center justify-between p-4 bg-[#0d1117] rounded-lg border border-[#30363d] cursor-pointer hover:border-[#f7cc48]/30 transition-colors">
                        <div>
                          <div className="font-medium">Reduce Motion</div>
                          <div className="text-sm text-gray-400">Minimize animations and transitions for better accessibility</div>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.flashSession.reduceMotion}
                          onChange={(e) => setSettings({
                            ...settings,
                            flashSession: { ...settings.flashSession, reduceMotion: e.target.checked }
                          })}
                          className="w-5 h-5 text-[#f7cc48] bg-[#0d1117] border-[#30363d] rounded focus:ring-[#f7cc48]"
                        />
                      </label>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Display Brightness
                        </label>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4">
                            <EyeOff className="w-5 h-5 text-gray-500" />
                            <input
                              type="range"
                              min="0.5"
                              max="1"
                              step="0.1"
                              value={settings.flashSession.brightness}
                              onChange={(e) => setSettings({
                                ...settings,
                                flashSession: { ...settings.flashSession, brightness: parseFloat(e.target.value) }
                              })}
                              className="flex-1"
                            />
                            <Eye className="w-5 h-5 text-[#f7cc48]" />
                          </div>
                          <div className="text-center">
                            <span className="text-2xl font-bold text-[#f7cc48]">{Math.round(settings.flashSession.brightness * 100)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 bg-[#161b22] rounded-lg border border-[#30363d]">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-[#f7cc48]" />
                          <h3 className="font-medium text-[#f7cc48]">Preview</h3>
                        </div>
                        <p className="text-sm text-gray-400 mb-3">Your flash session will appear with these settings:</p>
                        <div 
                          className="p-4 bg-black rounded-lg text-center transition-all duration-300"
                          style={{ opacity: settings.flashSession.brightness }}
                        >
                          <div className={`text-4xl font-bold mb-2 text-white ${settings.flashSession.reduceMotion ? '' : 'transition-all duration-300'}`}>
                            漢字
                          </div>
                          <div className="text-xl text-[#f7cc48]">hàn zì</div>
                          <div className="text-sm text-gray-300 mt-2">Chinese character</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Study Goals Tab */}
                {activeTab === 'goals' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold">Study Goals</h2>
                      {isAdmin && <NotImplementedBadge />}
                    </div>
                    
                    <div className="opacity-50">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Daily Card Goal
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="5"
                          max="100"
                          step="5"
                          value={settings.studyGoals.dailyCards}
                          onChange={(e) => setSettings({
                            ...settings,
                            studyGoals: { ...settings.studyGoals, dailyCards: parseInt(e.target.value) }
                          })}
                          disabled
                          className="flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <div className="w-16 text-center">
                          <span className="text-2xl font-bold text-[#f7cc48]">{settings.studyGoals.dailyCards}</span>
                          <div className="text-xs text-gray-400">cards</div>
                        </div>
                      </div>
                    </div>

                    <div className="opacity-50">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Weekly Study Days
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                          <button
                            key={day}
                            onClick={() => {}}
                            disabled
                            className={`p-3 rounded-lg border cursor-not-allowed ${
                              settings.studyGoals.weeklyDays >= day
                                ? 'bg-[#21262d] border-[#f7cc48] text-[#f7cc48]'
                                : 'bg-[#0d1117] border-[#30363d] text-gray-400'
                            } transition-all`}
                          >
                            {day}
                          </button>
                        ))}
                      </div>
                      <p className="text-sm text-gray-400 mt-2">
                        Study {settings.studyGoals.weeklyDays} day{settings.studyGoals.weeklyDays !== 1 ? 's' : ''} per week
                      </p>
                    </div>
                  </div>
                )}

                {/* Privacy & Security Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold">Privacy & Security</h2>
                      {isAdmin && <NotImplementedBadge />}
                    </div>
                    
                    <div className="space-y-4 opacity-50">
                      <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                        <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-400 mb-4">Add an extra layer of security to your account</p>
                        <button disabled className="px-4 py-2 bg-[#21262d] text-white rounded-lg cursor-not-allowed">
                          Enable 2FA
                        </button>
                      </div>

                      <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                        <h3 className="font-medium mb-2">Login Sessions</h3>
                        <p className="text-sm text-gray-400 mb-4">Manage your active login sessions</p>
                        <button disabled className="px-4 py-2 bg-[#21262d] text-white rounded-lg cursor-not-allowed">
                          View Sessions
                        </button>
                      </div>

                      <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d]">
                        <h3 className="font-medium mb-2">Privacy Settings</h3>
                        <p className="text-sm text-gray-400 mb-4">Control how your data is used</p>
                        <button disabled className="px-4 py-2 bg-[#21262d] text-white rounded-lg cursor-not-allowed">
                          Manage Privacy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Data Management Tab */}
                {activeTab === 'data' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-xl font-semibold">Data Management</h2>
                      {isAdmin && <NotImplementedBadge />}
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d] opacity-50">
                        <h3 className="font-medium mb-2">Export Your Data</h3>
                        <p className="text-sm text-gray-400 mb-4">Download all your learning data in JSON format</p>
                        <button disabled className="px-4 py-2 bg-[#21262d] text-white rounded-lg cursor-not-allowed">
                          Export Data
                        </button>
                      </div>

                      <div className="p-4 bg-[#0d1117] rounded-lg border border-[#30363d] opacity-50">
                        <h3 className="font-medium mb-2">Import Data</h3>
                        <p className="text-sm text-gray-400 mb-4">Import learning data from a previous export</p>
                        <button disabled className="px-4 py-2 bg-[#21262d] text-white rounded-lg cursor-not-allowed">
                          Import Data
                        </button>
                      </div>

                      <div className="p-4 bg-red-900/20 rounded-lg border border-red-800/50">
                        <h3 className="font-medium mb-2 text-red-400">Delete Account</h3>
                        <p className="text-sm text-gray-400 mb-4">Permanently delete your account and all associated data</p>
                        <button 
                          onClick={handleDeleteAccount}
                          className="px-4 py-2 bg-red-900/50 hover:bg-red-900/70 text-red-400 rounded-lg transition-colors"
                        >
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-[#f7cc48] hover:bg-[#f7cc48]/90 text-black font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  )
}