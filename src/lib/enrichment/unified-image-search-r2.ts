import { generateDALLEImageR2 } from './openai-dalle-r2';

export interface UnifiedImage {
  url: string;
  source: 'dalle' | 'placeholder';
  sourceId: string;
  attribution: string;
  attributionUrl: string;
}

export async function searchForImageR2(
  hanzi: string,
  meaning: string,
  pinyin: string,
  deckId: string,
  cardId: string
): Promise<UnifiedImage> {
  try {
    // Use DALL-E to generate images
    const dalleResult = await generateDALLEImageR2(hanzi, meaning, pinyin, deckId, cardId);
    
    if (dalleResult.url) {
      console.log(`✅ Generated DALL-E image for ${hanzi} (cached: ${dalleResult.cached})`);
      return {
        url: dalleResult.url,
        source: 'dalle',
        sourceId: dalleResult.cached ? 'cached' : 'generated',
        attribution: 'AI Generated',
        attributionUrl: '',
      };
    }
    
    // If DALL-E skipped or failed, return empty placeholder
    console.log(`No image generated for ${hanzi}`);
    return {
      url: '',
      source: 'placeholder',
      sourceId: 'skip',
      attribution: '',
      attributionUrl: '',
    };

  } catch (error) {
    console.error(`Error generating image for ${hanzi}:`, error);
    return {
      url: '',
      source: 'placeholder',
      sourceId: 'error',
      attribution: '',
      attributionUrl: '',
    };
  }
}