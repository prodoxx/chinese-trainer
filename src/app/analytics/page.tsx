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
        <div className="flex-1">
          <Analytics onBack={() => router.push('/')} />
        </div>
        <Footer />
      </div>
    </>
  );
}