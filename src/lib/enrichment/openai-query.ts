import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface ImageSearchQueryResult {
  query: string;
  prompt?: string;
}

export async function generateImageSearchQuery(
  hanzi: string, 
  meaning: string, 
  _pinyin: string
): Promise<ImageSearchQueryResult> {
  if (!openai) {
    console.warn('OpenAI API key not configured, using fallback');
    return {
      query: meaning.split(/[;,]/)[0].trim(),
      prompt: undefined
    };
  }

  try {
    const prompt = `Generate an image search query for: ${hanzi} (meaning: ${meaning})

First, determine if this word can be visually represented:
- Grammatical particles (的, 了, 嗎, 把, 被, etc.) → SKIP
- Abstract pronouns (我, 你, 他, 她, etc.) → SKIP
- Words that have no visual representation → SKIP

If it CAN be visually represented, create a scene-based query:

EMOTIONS/STATES → describe someone experiencing it:
- 無聊 (bored) → "bored person yawning"
- 害怕 (afraid) → "scared child hiding"
- 快樂/開心 (happy) → "happy people celebrating"
- 生氣 (angry) → "angry person frustrated"
- 累 (tired) → "tired person sleeping"

OBJECTS → the thing itself:
- 書 (book) → "books library"
- 車 (car) → "car vehicle"

ACTIONS → someone doing it:
- 吃 (eat) → "person eating food"
- 跑 (run) → "person running"

If the word cannot be visually represented, return exactly: "SKIP_IMAGE"
Otherwise, return ONLY the 2-5 word search query.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 20,
    });

    let query = completion.choices[0]?.message?.content?.trim() || meaning;
    // Remove any quotes that might have been added by the AI
    query = query.replace(/^["']|["']$/g, '').replace(/^""|""$/g, '');
    console.log(`AI generated query for ${hanzi}: "${query}"`);
    
    // Check if AI suggests skipping image
    if (query === 'SKIP_IMAGE') {
      return {
        query: 'SKIP_IMAGE',
        prompt: prompt
      };
    }
    
    return {
      query: query,
      prompt: prompt
    };
  } catch (error: unknown) {
    if (error?.status === 429 || error?.code === 'insufficient_quota') {
      console.log(`OpenAI quota exceeded, using fallback for ${hanzi}`);
    } else {
      console.error('OpenAI query generation error:', error);
    }
    
    // Default fallback: just use the meaning as the search query
    return {
      query: meaning.split(/[;,]/)[0].trim(),
      prompt: undefined // No prompt since we fell back
    };
  }
}