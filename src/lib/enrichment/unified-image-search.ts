import { generateImageSearchQuery } from './openai-query';
import { searchImage as searchUnsplash, getAttributionText as getUnsplashAttribution, getAttributionUrl as getUnsplashAttributionUrl } from './unsplash';
import { searchPexelsImage, getPexelsAttribution, getPexelsAttributionUrl } from './pexels';

export interface UnifiedImage {
  url: string;
  source: 'unsplash' | 'pexels' | 'placeholder';
  sourceId: string;
  attribution: string;
  attributionUrl: string;
}

export async function searchForImage(
  hanzi: string,
  meaning: string,
  pinyin: string
): Promise<UnifiedImage> {
  try {
    // Step 1: Generate optimized search query using AI (if available)
    let searchQuery = await generateImageSearchQuery(hanzi, meaning, pinyin);
    console.log(`AI generated query for ${hanzi}: "${searchQuery}"`);
    
    // Check if AI suggests skipping image for this word
    if (searchQuery === 'SKIP_IMAGE') {
      console.log(`Skipping image for ${hanzi} - no visual representation needed`);
      return {
        url: '',
        source: 'placeholder',
        sourceId: 'skip',
        attribution: '',
        attributionUrl: '',
      };
    }
    
    console.log(`Searching images for ${hanzi} with query: "${searchQuery}"`);

    // Step 2: Try Unsplash with original query
    const unsplashImage = await searchUnsplash(searchQuery);
    if (unsplashImage) {
      console.log(`✅ Found Unsplash image for ${hanzi}`);
      return {
        url: unsplashImage.urls.regular,
        source: 'unsplash',
        sourceId: unsplashImage.id,
        attribution: getUnsplashAttribution(unsplashImage),
        attributionUrl: getUnsplashAttributionUrl(unsplashImage),
      };
    }

    // Step 3: Try Pexels as fallback
    const pexelsImage = await searchPexelsImage(searchQuery);
    if (pexelsImage) {
      console.log(`✅ Found Pexels image for ${hanzi}`);
      return {
        url: pexelsImage.src.large,
        source: 'pexels',
        sourceId: String(pexelsImage.id),
        attribution: getPexelsAttribution(pexelsImage),
        attributionUrl: getPexelsAttributionUrl(pexelsImage),
      };
    }

    // Step 4: If AI query didn't work, try with original meaning
    if (searchQuery !== meaning) {
      console.log(`Retrying with original meaning for ${hanzi}`);
      
      const unsplashFallback = await searchUnsplash(meaning);
      if (unsplashFallback) {
        return {
          url: unsplashFallback.urls.regular,
          source: 'unsplash',
          sourceId: unsplashFallback.id,
          attribution: getUnsplashAttribution(unsplashFallback),
          attributionUrl: getUnsplashAttributionUrl(unsplashFallback),
        };
      }

      const pexelsFallback = await searchPexelsImage(meaning);
      if (pexelsFallback) {
        return {
          url: pexelsFallback.src.large,
          source: 'pexels',
          sourceId: String(pexelsFallback.id),
          attribution: getPexelsAttribution(pexelsFallback),
          attributionUrl: getPexelsAttributionUrl(pexelsFallback),
        };
      }
    }

    // Step 5: Final fallback to placeholder
    console.log(`❌ No image found for ${hanzi}, using placeholder`);
    // Use a more reliable placeholder service that handles Unicode better
    return {
      url: `https://dummyimage.com/400x400/333333/ffffff&text=${hanzi}`,
      source: 'placeholder',
      sourceId: 'placeholder',
      attribution: '',
      attributionUrl: '',
    };

  } catch (error) {
    console.error(`Error searching images for ${hanzi}:`, error);
    return {
      url: `https://dummyimage.com/400x400/333333/ffffff&text=${hanzi}`,
      source: 'placeholder',
      sourceId: 'placeholder',
      attribution: '',
      attributionUrl: '',
    };
  }
}