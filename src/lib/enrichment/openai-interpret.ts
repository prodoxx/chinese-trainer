import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY!,
});

interface InterpretationResult {
	meaning: string;
	pinyin?: string;
	context?: string;
	imagePrompt?: string;
	interpretationPrompt?: string; // The prompt used for this interpretation
}

export async function interpretChinese(
	hanzi: string,
	context?: string,
): Promise<InterpretationResult> {
	try {
		const contextHint = context ? ` in the context of ${context}` : "";

		const prompt = `Interpret the Chinese characters "${hanzi}"${contextHint} for students learning Chinese in Taiwan. Provide:
1. A SHORT, SIMPLE English meaning (2-5 words MAX) using COMMON everyday words that everyone knows
2. Pinyin with tone MARKS as used in TAIWAN (e.g., cōng míng for 聰明, not cōng ming)
3. Context or common usage (when/how this word is typically used)
4. A mnemonic visual description for image generation (one sentence, creating a memorable visual association that helps students recall the meaning)

For example:
- 隨便 should be "casual/whatever" (simple), not "as one wishes" (too formal)
- 麻煩 should be "troublesome" (common word), not "bothersome" (less common)
- 煩 should be "annoyed/irritated" (the emotion), not "trouble" (the noun)
- 責任 should be "responsibility" (clear), not "duty and obligation" (too long)
- 固執 should be "stubborn" (simple), not "obstinate" (too advanced)
- 聰明 should be "smart/clever" (easy), not "intelligent" (more formal)
- 高興 should be "happy" (simple), not "joyful" or "elated" (too formal)

Format your response as JSON:
{
  "meaning": "SHORT, SIMPLE meaning using BASIC English words (2-5 words MAX)",
  "pinyin": "pīn yīn (with tone MARKS, Taiwan pronunciation)",
  "context": "common usage or situation where this is used",
  "imagePrompt": "Mnemonic illustration: [describe the subject based on semantic category]. CRITICAL RULES: For OBJECTS (food, drinks, items, things): Focus ONLY on the object itself - close-up shot, no people, show the object's details and characteristics. For EMOTIONS/FEELINGS: Show human facial expressions and body language. For ACTIONS: Show people performing the action. For PLACES: Show the location/environment. For ABSTRACT CONCEPTS: Use symbolic visuals or metaphors. Photorealistic style, natural lighting, real-world setting, absolutely no text, letters, or numbers."
}

Important: 
- Focus on HOW the word is actually used in everyday Taiwan Mandarin, not dictionary definitions
- Provide meanings that students would hear in real conversations
- Use Taiwan Mandarin pronunciation standards, not mainland China pronunciations
- Use tone MARKS (ā á ǎ à), not tone numbers
- Be clear and specific - avoid vague or overly formal meanings
- For imagePrompt: CRITICAL - Determine the semantic category first:
  * OBJECTS (coffee, food, items): Show ONLY the object in detail, NO people holding or using it
  * EMOTIONS/FEELINGS: Focus on human expressions and body language
  * ACTIONS/VERBS: Show people performing the action
  * PLACES: Show the environment or location
  * ABSTRACT CONCEPTS: Use symbolic representations
  Examples: 
  - 咖啡 (coffee): "Close-up of steaming hot coffee in a ceramic cup, rich brown crema on top, coffee beans scattered around"
  - 快樂 (happy): "Person with genuine bright smile, eyes crinkled with joy, radiating happiness"
  - 跑步 (run): "Athletic person mid-stride running in park, dynamic motion"
  No text allowed as it would give away the answer`;

		const response = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [
				{
					role: "system",
					content:
						"You are a Taiwan Mandarin teacher creating flash cards for language learners. Use SIMPLE, COMMON English words that everyone knows (avoid advanced vocabulary). Keep meanings SHORT (2-5 words max). For emotion/feeling characters, focus on the emotional state (e.g., 煩='annoyed' not 'trouble'). For image prompts: CRITICAL - First identify if the word is an OBJECT (物品/東西), EMOTION (情緒/感覺), ACTION (動作), PLACE (地方), or ABSTRACT concept. For OBJECTS like 咖啡, 書, 電腦, 水果 etc., describe ONLY the object itself in detail - no people, just the item. For EMOTIONS, show human expressions. For ACTIONS, show people doing the action. Focus on creating memorable visual associations that help students recall meanings.",
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

		// Parse the JSON response - handle markdown code blocks
		try {
			// Remove markdown code blocks if present
			let jsonContent = content.trim();
			if (jsonContent.startsWith("```json")) {
				jsonContent = jsonContent
					.replace(/^```json\s*/, "")
					.replace(/\s*```$/, "");
			} else if (jsonContent.startsWith("```")) {
				jsonContent = jsonContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
			}

			const result = JSON.parse(jsonContent);

			// Validate that we got meaningful results
			if (!result.meaning || result.meaning.toLowerCase().includes("unknown")) {
				console.warn("OpenAI returned unknown meaning, falling back");
				throw new Error("Invalid meaning returned");
			}

			return {
				meaning: result.meaning || "Unknown",
				pinyin: result.pinyin || "",
				context: result.context || "",
				imagePrompt:
					result.imagePrompt ||
					`A clear illustration representing the concept of "${hanzi}"`,
				interpretationPrompt: prompt, // Include the prompt used
			};
		} catch (parseError) {
			console.error("Failed to parse OpenAI response:", content);
			console.error("Parse error:", parseError);

			// Better fallback - try to extract meaning from the raw content
			let fallbackMeaning = "Unknown";
			try {
				// Look for meaning in quotes or after "meaning"
				const meaningMatch =
					content.match(/"meaning":\s*"([^"]+)"/i) ||
					content.match(/meaning[:\s]+([^\n,}]+)/i);
				if (
					meaningMatch &&
					meaningMatch[1] &&
					!meaningMatch[1].toLowerCase().includes("unknown")
				) {
					fallbackMeaning = meaningMatch[1].trim().replace(/[",]/g, "");
				}
			} catch (e) {
				console.warn("Could not extract meaning from fallback parsing");
			}

			return {
				meaning: fallbackMeaning,
				pinyin: "",
				context: "",
				imagePrompt: `A clear illustration representing the concept of "${hanzi}"`,
				interpretationPrompt: prompt, // Include the prompt used
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
