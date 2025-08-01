import { redirectIfAuthenticated } from "@/lib/auth-helpers"
import DemoPageClient from '@/components/DemoPageClient'

export default async function DemoPage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated()
  
  return <DemoPageClient />
}