'use client';

import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import Analytics from '@/components/Analytics';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();

  return (
    <>
      <Navigation />
      <div className="min-h-[calc(100vh-4rem)] bg-[#1a1f2e] flex flex-col">
        {/* Beta Banner */}
        <div className="bg-[#161b22] border-y border-[#30363d]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 text-blue-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">Beta Version</span>
              </span>
              <span className="text-[#7d8590]">
                We're actively improving this experience. Some features may not work as expected. Please report any issues you encounter.
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex-1">
          <Analytics onBack={() => router.push('/')} />
        </div>
        <Footer />
      </div>
    </>
  );
}