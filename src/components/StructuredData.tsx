export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://danbing.ai/#organization",
        "name": "Danbing AI",
        "url": "https://danbing.ai",
        "logo": {
          "@type": "ImageObject",
          "url": "https://static.danbing.ai/danbing_medium.png",
          "width": 1200,
          "height": 630
        },
        "description": "AI-powered Chinese learning platform that helps you master Traditional Chinese 10x faster",
        "sameAs": [
          "https://twitter.com/danbingai",
          "https://linkedin.com/company/danbingai"
        ],
        "founder": {
          "@type": "Person",
          "name": "Danbing AI Team",
          "alumniOf": {
            "@type": "CollegeOrUniversity",
            "name": "National Taiwan Normal University (NTNU)"
          }
        }
      },
      {
        "@type": "WebSite",
        "@id": "https://danbing.ai/#website",
        "url": "https://danbing.ai",
        "name": "Danbing AI",
        "description": "Learn Chinese 10x faster with AI-powered flashcards",
        "publisher": {
          "@id": "https://danbing.ai/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": {
            "@type": "EntryPoint",
            "urlTemplate": "https://danbing.ai/search?q={search_term_string}"
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "SoftwareApplication",
        "name": "Danbing AI Chinese Learning App",
        "applicationCategory": "EducationalApplication",
        "operatingSystem": "Web, iOS, Android",
        "offers": [
          {
            "@type": "Offer",
            "name": "Free Plan",
            "price": "0",
            "priceCurrency": "USD",
            "description": "Learn up to 20 characters per month free forever"
          },
          {
            "@type": "Offer",
            "name": "Pro Plan",
            "price": "9.99",
            "priceCurrency": "USD",
            "description": "Unlimited characters with advanced features",
            "priceValidUntil": "2025-12-31"
          }
        ],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "ratingCount": "1250",
          "bestRating": "5",
          "worstRating": "1"
        },
        "featureList": [
          "AI-powered flashcard generation",
          "Visual mnemonics",
          "Perfect pronunciation audio",
          "Spaced repetition (SM-2 algorithm)",
          "Progress tracking",
          "Cross-device sync"
        ]
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "How does Danbing AI help me learn Chinese faster?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Danbing AI uses cognitive science principles like dual coding theory, spaced repetition, and AI-generated mnemonics to optimize retention. Our 90-second sessions are designed to work with your brain's natural memory processes."
            }
          },
          {
            "@type": "Question",
            "name": "Is Danbing AI suitable for beginners?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Yes! Danbing AI is perfect for beginners. We start with the most common characters and gradually increase difficulty based on your progress. Our AI provides detailed explanations and mnemonics for every character."
            }
          },
          {
            "@type": "Question",
            "name": "What's the difference between Free and Pro plans?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Free users can learn up to 20 characters per month with basic features. Pro users get unlimited characters, advanced analytics, priority AI processing, and custom deck creation."
            }
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}