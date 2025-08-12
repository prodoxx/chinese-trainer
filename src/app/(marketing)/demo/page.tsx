import { redirectIfAuthenticated } from "@/lib/auth-helpers"
import DemoPageClient from '@/components/DemoPageClient'

export const metadata = {
  title: "Interactive Demo - Try Danbing AI's Chinese Learning System",
  description: "Experience our AI-powered flashcard system firsthand. See how visual mnemonics, perfect pronunciation, and smart repetition make learning Chinese effortless. No signup required.",
  keywords: "Chinese learning demo, try Chinese flashcards free, interactive language learning, AI flashcard demo, Taiwan Mandarin demo, test spaced repetition, free Chinese lesson, sample Chinese learning, try before buy",
  openGraph: {
    title: "Try Danbing AI Free - Interactive Chinese Learning Demo",
    description: "Experience AI-powered Chinese flashcards. See why our method works in just 90 seconds. No signup required.",
    url: "https://danbing.ai/demo",
    siteName: "Danbing AI",
    images: [
      {
        url: "https://static.danbing.ai/danbing_medium.png",
        width: 1200,
        height: 630,
        alt: "Try Danbing AI - Interactive Demo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Try Danbing AI's Chinese Learning System",
    description: "90-second interactive demo. Experience the future of language learning. No signup needed.",
    images: ["https://static.danbing.ai/danbing_medium.png"],
    creator: "@danbingai",
  },
  alternates: {
    canonical: "https://danbing.ai/demo",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function DemoPage() {
  // Redirect to dashboard if authenticated
  await redirectIfAuthenticated()
  
  return <DemoPageClient />
}