import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://danbing.ai'
  const currentDate = new Date().toISOString().split('T')[0]

  // Define pages with their properties
  const pages = [
    {
      url: '/',
      priority: 1.0,
      changeFrequency: 'weekly' as const,
    },
    // Core Product Pages
    {
      url: '/demo',
      priority: 0.9,
      changeFrequency: 'weekly' as const,
    },
    {
      url: '/how-it-works',
      priority: 0.9,
      changeFrequency: 'weekly' as const,
    },
    {
      url: '/features',
      priority: 0.9,
      changeFrequency: 'weekly' as const,
    },
    // Conversion Pages
    {
      url: '/pricing',
      priority: 0.9,
      changeFrequency: 'weekly' as const,
    },
    {
      url: '/auth/signup',
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    },
    {
      url: '/auth/login',
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    },
    // Educational/Trust Pages
    {
      url: '/science',
      priority: 0.8,
      changeFrequency: 'monthly' as const,
    },
    {
      url: '/about',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      url: '/methodology',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      url: '/research',
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    // Legal Pages
    {
      url: '/privacy',
      priority: 0.5,
      changeFrequency: 'yearly' as const,
    },
    {
      url: '/terms',
      priority: 0.5,
      changeFrequency: 'yearly' as const,
    },
  ]

  return pages.map((page) => ({
    url: `${baseUrl}${page.url}`,
    lastModified: currentDate,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }))
}