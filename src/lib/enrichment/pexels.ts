import { createClient, Photo } from 'pexels';

const client = process.env.PEXELS_API_KEY ? createClient(process.env.PEXELS_API_KEY) : null;

export interface PexelsImage {
  id: number;
  url: string;
  photographer: string;
  photographerUrl: string;
  src: {
    original: string;
    large: string;
    medium: string;
  };
}

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 100ms between requests

export async function searchPexelsImage(query: string): Promise<PexelsImage | null> {
  try {
    if (!client) {
      console.warn('Pexels API key not configured');
      return null;
    }

    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const response = await client.photos.search({
      query,
      per_page: 1,
      orientation: 'square',
    });

    if ('error' in response) {
      console.error('Pexels search error:', response.error);
      return null;
    }

    if (response.photos.length === 0) {
      return null;
    }

    const photo = response.photos[0] as Photo;
    return {
      id: photo.id,
      url: photo.url,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      src: {
        original: photo.src.original,
        large: photo.src.large,
        medium: photo.src.medium,
      },
    };
  } catch (error) {
    console.error('Pexels search error:', error);
    return null;
  }
}

export function getPexelsAttribution(image: PexelsImage): string {
  return `Photo by ${image.photographer} on Pexels`;
}

export function getPexelsAttributionUrl(image: PexelsImage): string {
  return image.url;
}