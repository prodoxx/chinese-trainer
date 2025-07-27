import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY!,
});

interface InterpretationResult {
	meaning: string;
	pinyin?: string;
	context?: string;
	imagePrompt?: string;
}

export async function interpretChinese(
	hanzi: string,
	context?: string,
): Promise<InterpretationResult> {
	try {
		const contextHint = context ? ` in the context of ${context}` : "";

		const prompt = `Interpret the Chinese characters "${hanzi}"${contextHint}. Provide:
1. A concise English meaning (2-5 words)
2. Pinyin with tone numbers (e.g., ni3 hao3)
3. Context if relevant (e.g., emotion, action, state)
4. A visual description for image generation (one sentence, focusing on observable actions or expressions)

Format your response as JSON:
{
  "meaning": "the English meaning",
  "pinyin": "pīn yīn (with tone marks, not numbers)",
  "context": "emotional/physical state",
  "imagePrompt": "Simple illustration showing [action/expression] that represents [meaning]. If showing a person, use diverse representation of either East Asian, Hispanic, White, or Black individual. Avoid South Asian/Indian representation. Cartoon or minimalist style preferred."
}

Important: For emotional or state words, focus on visual expressions or body language that represents the feeling.`;

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"You are a Chinese language expert helping create educational flashcards. Always provide accurate, concise interpretations suitable for language learners.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			temperature: 0.3,
			max_tokens: 200,
		});

		const content = response.choices[0]?.message?.content;
		if (!content) {
			throw new Error("No response from OpenAI");
		}

		// Parse the JSON response
		try {
			const result = JSON.parse(content);
			return {
				meaning: result.meaning || "Unknown",
				pinyin: result.pinyin,
				context: result.context,
				imagePrompt: result.imagePrompt,
			};
		} catch (parseError) {
			console.error("Failed to parse OpenAI response:", content);
			// Fallback to basic interpretation
			return {
				meaning: "Unknown phrase",
				pinyin: "",
				context: "",
				imagePrompt: `A clear illustration representing the concept of "${hanzi}"`,
			};
		}
	} catch (error) {
		console.error("OpenAI interpretation error:", error);
		throw error;
	}
}

// Batch interpretation for efficiency
export async function interpretChineseBatch(
	items: Array<{ hanzi: string; context?: string }>,
): Promise<Map<string, InterpretationResult>> {
	const results = new Map<string, InterpretationResult>();

	// Process in batches of 5 to avoid rate limits
	const batchSize = 5;
	for (let i = 0; i < items.length; i += batchSize) {
		const batch = items.slice(i, i + batchSize);

		const promises = batch.map(async (item) => {
			try {
				const result = await interpretChinese(item.hanzi, item.context);
				results.set(item.hanzi, result);
			} catch (error) {
				console.error(`Failed to interpret ${item.hanzi}:`, error);
				results.set(item.hanzi, {
					meaning: "Unknown",
					pinyin: "",
					context: "",
					imagePrompt: `An educational illustration for "${item.hanzi}"`,
				});
			}
		});

		await Promise.all(promises);

		// Small delay between batches to respect rate limits
		if (i + batchSize < items.length) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}

	return results;
}
