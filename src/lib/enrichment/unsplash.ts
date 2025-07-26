import { createApi } from 'unsplash-js';

const unsplash = createApi({
  accessKey: process.env.UNSPLASH_ACCESS_KEY || '',
});

export interface UnsplashImage {
  id: string;
  urls: {
    regular: string;
    small: string;
  };
  user: {
    name: string;
    username: string;
  };
  links: {
    html: string;
  };
}

// Simple in-memory rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

export async function searchImage(query: string): Promise<UnsplashImage | null> {
  try {
    if (!process.env.UNSPLASH_ACCESS_KEY) {
      console.warn('Unsplash API key not configured');
      return null;
    }

    // Rate limiting to respect Unsplash's 50 requests per hour for demo apps
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    // Search for images with the query
    // For Chinese characters, we'll search with the meaning
    const result = await unsplash.search.getPhotos({
      query,
      perPage: 1,
      orientation: 'squarish',
    });

    if (result.errors) {
      console.error('Unsplash search error:', result.errors);
      return null;
    }

    const photos = result.response?.results;
    if (!photos || photos.length === 0) {
      return null;
    }

    const photo = photos[0];
    return {
      id: photo.id,
      urls: {
        regular: photo.urls.regular,
        small: photo.urls.small,
      },
      user: {
        name: photo.user.name || 'Unknown',
        username: photo.user.username || 'unknown',
      },
      links: {
        html: photo.links.html,
      },
    };
  } catch (error) {
    console.error('Unsplash search error:', error);
    return null;
  }
}

export function getAttributionText(image: UnsplashImage): string {
  return `Photo by ${image.user.name} on Unsplash`;
}

export function getAttributionUrl(image: UnsplashImage): string {
  return `${image.links.html}?utm_source=chinese_character_trainer&utm_medium=referral`;
}