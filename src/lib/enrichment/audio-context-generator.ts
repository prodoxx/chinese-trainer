import { interpretChinese } from "./openai-interpret";

interface AudioContext {
	contextPhrase: string;
	trimStart: number; // milliseconds
	trimDuration: number; // milliseconds
}

/**
 * Generate audio context for disambiguated characters
 * Returns a context phrase that forces the correct pronunciation
 */
export async function generateAudioContext(
	hanzi: string,
	pinyin: string,
	meaning: string,
): Promise<AudioContext | null> {
	// First check if this is a known disambiguated character
	const knownContexts = getKnownContexts();
	const key = `${hanzi}-${pinyin.toLowerCase()}`;

	if (knownContexts[key]) {
		return knownContexts[key];
	}

	// For unknown disambiguated characters, use AI to generate context
	try {
		console.log(`   🤖 Generating audio context for ${hanzi} (${pinyin})...`);

		// Ask OpenAI to generate a short phrase that forces the correct pronunciation
		const response = await fetch("https://api.openai.com/v1/chat/completions", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "gpt-4-turbo-preview",
				messages: [
					{
						role: "system",
						content: `You are a Chinese language expert. Generate a SHORT 2-character phrase in Traditional Chinese that:
1. Contains the character "${hanzi}" with pronunciation "${pinyin}"
2. Forces Azure TTS to pronounce it with the correct tone
3. The character "${hanzi}" should be at the START of the phrase
4. The phrase should relate to the meaning "${meaning}"

Return ONLY the 2-character phrase, nothing else.`,
					},
					{
						role: "user",
						content: `Generate context phrase for: ${hanzi} (${pinyin}) meaning "${meaning}"`,
					},
				],
				max_tokens: 10,
				temperature: 0.3,
			}),
		});

		if (!response.ok) {
			throw new Error(`OpenAI API error: ${response.status}`);
		}

		const data = await response.json();
		const contextPhrase = data.choices[0]?.message?.content?.trim();

		if (contextPhrase && contextPhrase.includes(hanzi)) {
			// For 2-character phrases, assume first character takes ~600ms
			return {
				contextPhrase,
				trimStart: 0,
				trimDuration: 600,
			};
		}
	} catch (error) {
		console.error("Failed to generate audio context:", error);
	}

	return null;
}

/**
 * Known context phrases for common disambiguated characters
 * These are manually tuned for optimal pronunciation
 */
function getKnownContexts(): Record<string, AudioContext> {
	return {
		// 累 pronunciations
		"累-lěi": {
			contextPhrase: "累積",
			trimStart: 0,
			trimDuration: 500,
		},
		"累-lèi": {
			contextPhrase: "好累",
			trimStart: 500, // Skip "好"
			trimDuration: 500,
		},

		// 長 pronunciations
		"長-zhǎng": {
			contextPhrase: "長大",
			trimStart: 0,
			trimDuration: 500,
		},
		"長-cháng": {
			contextPhrase: "長的",
			trimStart: 0,
			trimDuration: 500,
		},

		// 行 pronunciations
		"行-xíng": {
			contextPhrase: "行走",
			trimStart: 0,
			trimDuration: 500,
		},
		"行-háng": {
			contextPhrase: "銀行",
			trimStart: 500, // Skip "銀"
			trimDuration: 500,
		},

		// 得 pronunciations
		"得-dé": {
			contextPhrase: "得到",
			trimStart: 0,
			trimDuration: 500,
		},
		"得-de": {
			contextPhrase: "走得",
			trimStart: 500, // Skip "走"
			trimDuration: 300, // Shorter for neutral tone
		},
		"得-děi": {
			contextPhrase: "得去",
			trimStart: 0,
			trimDuration: 500,
		},

		// 重 pronunciations
		"重-zhòng": {
			contextPhrase: "重要",
			trimStart: 0,
			trimDuration: 500,
		},
		"重-chóng": {
			contextPhrase: "重複",
			trimStart: 0,
			trimDuration: 500,
		},

		// 好 pronunciations
		"好-hǎo": {
			contextPhrase: "好的",
			trimStart: 0,
			trimDuration: 500,
		},
		"好-hào": {
			contextPhrase: "好學",
			trimStart: 0,
			trimDuration: 500,
		},

		// 少 pronunciations
		"少-shǎo": {
			contextPhrase: "少數",
			trimStart: 0,
			trimDuration: 500,
		},
		"少-shào": {
			contextPhrase: "少年",
			trimStart: 0,
			trimDuration: 500,
		},

		// 當 pronunciations
		"當-dāng": {
			contextPhrase: "當然",
			trimStart: 0,
			trimDuration: 500,
		},
		"當-dàng": {
			contextPhrase: "當作",
			trimStart: 0,
			trimDuration: 500,
		},

		// 相 pronunciations
		"相-xiāng": {
			contextPhrase: "相同",
			trimStart: 0,
			trimDuration: 500,
		},
		"相-xiàng": {
			contextPhrase: "相片",
			trimStart: 0,
			trimDuration: 500,
		},

		// 傳 pronunciations
		"傳-chuán": {
			contextPhrase: "傳播",
			trimStart: 0,
			trimDuration: 500,
		},
		"傳-zhuàn": {
			contextPhrase: "傳記",
			trimStart: 0,
			trimDuration: 500,
		},
	};
}

/**
 * Check if a character needs context-based audio generation
 */
export function needsAudioContext(hanzi: string, pinyin: string): boolean {
	// Check if it's in our known list
	const knownContexts = getKnownContexts();
	const key = `${hanzi}-${pinyin.toLowerCase()}`;

	if (knownContexts[key]) {
		return true;
	}

	// Check dictionary for multiple pronunciations
	// This would be done by checking if the character has multiple entries
	// For now, we'll use a simple list of known multi-pronunciation characters
	const multiPronunciationChars = [
		"累",
		"長",
		"行",
		"得",
		"重",
		"好",
		"少",
		"當",
		"相",
		"傳",
		"和",
		"為",
		"了",
		"著",
		"過",
		"給",
		"要",
		"將",
		"調",
		"轉",
		"乾",
		"難",
		"分",
		"發",
		"中",
		"還",
		"場",
		"種",
		"只",
		"系",
	];

	return multiPronunciationChars.includes(hanzi);
}
