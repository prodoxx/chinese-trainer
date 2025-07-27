'use client';

import Analytics from '@/components/Analytics';
import { useRouter } from 'next/navigation';

export default function AnalyticsPage() {
  const router = useRouter();

  return <Analytics onBack={() => router.push('/')} />;
}