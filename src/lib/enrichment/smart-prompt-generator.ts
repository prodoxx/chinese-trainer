/**
 * Smart Image Prompt Generator for Chinese Language Learning
 * Uses OpenAI to generate culturally accurate, educational prompts
 * Includes prompt supervision and quality validation
 */

import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
	? new OpenAI({
			apiKey: process.env.OPENAI_API_KEY,
		})
	: null;

export interface SmartPromptResult {
	prompt: string;
	negativePrompt: string;
	confidence: number;
	culturalAccuracy: number;
	educationalValue: number;
	clarity: number;
	metadata: {
		culturalContext: string;
		visualStrategy: string;
		targetAudience: string;
		learningObjective: string;
	};
}

export interface PromptValidationResult {
	isValid: boolean;
	quality: "excellent" | "good" | "needs_improvement" | "poor";
	issues: string[];
	suggestions: string[];
	culturalAccuracy: number;
	educationalValue: number;
	clarity: number;
}

/**
 * Generate a smart, culturally accurate prompt for Chinese vocabulary learning
 */
export async function generateSmartPrompt(
	hanzi: string,
	meaning: string,
	pinyin: string,
	context?: string,
): Promise<SmartPromptResult> {
	if (!openai) {
		throw new Error("OpenAI API key not configured");
	}

	try {
		const systemPrompt = `You are an expert in Chinese language education and cultural sensitivity. Your task is to generate image prompts that help students learn Chinese vocabulary through clear, culturally accurate visual associations.

IMPORTANT REQUIREMENTS:
1. CULTURAL ACCURACY: Be specific about cultural context (e.g., "Taiwanese apartment building" not just "apartment")
2. CLARITY: Create simple, clear scenes that immediately convey the meaning
3. EDUCATIONAL VALUE: Focus on visual learning and memory association
4. EMOTIONAL CONTEXT: Include warmth and relatability when appropriate
5. SIMPLICITY: Avoid complex scenes with too many elements

PROMPT STRUCTURE:
- Start with the main subject/scene
- Add cultural and contextual details
- Include lighting and composition notes
- End with quality and style requirements

NEGATIVE PROMPT STRUCTURE:
- No text, letters, numbers, or written characters
- No stereotypes or cultural misrepresentations
- No inappropriate content
- No complex or confusing scenes

EXAMPLES:
奶奶 (grandma): "A warm, respectful scene of a smiling elderly Chinese woman in her cozy living room, wearing traditional home clothes, sitting on a chair with a cup of tea. Family-friendly, culturally accurate, natural lighting, high quality photography."

公寓 (apartment): "A realistic exterior view of a typical apartment building in Taiwan, with balconies, air conditioners, and scooters parked outside. Modern urban architecture, natural daylight, no visible text or signs, high quality photography."

學校 (school): "A front view of a modern school building in Taiwan with students walking in uniform, natural lighting, clean architecture, no signage or characters, high quality photography."`;

		const userPrompt = `Generate an image prompt for the Chinese character: ${hanzi} (${pinyin}) meaning: "${meaning}"

${context ? `Additional context: ${context}` : ""}

Please provide:
1. A detailed, culturally accurate prompt
2. A negative prompt to avoid unwanted elements
3. Confidence scores for cultural accuracy, educational value, and clarity
4. Metadata about the cultural context and learning approach

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, backticks, or explanatory text. Just the raw JSON object.

{
  "prompt": "detailed prompt here",
  "negativePrompt": "negative prompt here", 
  "confidence": 0.95,
  "culturalAccuracy": 0.95,
  "educationalValue": 0.95,
  "clarity": 0.95,
  "metadata": {
    "culturalContext": "description",
    "visualStrategy": "strategy used",
    "targetAudience": "who this is for",
    "learningObjective": "what students will learn"
  }
}`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini", // Using GPT-4o-mini for better quality at reasonable cost
			messages: [
				{ role: "system", content: systemPrompt },
				{ role: "user", content: userPrompt },
			],
			temperature: 0.7,
			max_tokens: 800,
		});

		const responseText = completion.choices[0]?.message?.content;
		if (!responseText) {
			throw new Error("No response from OpenAI");
		}

		// Try to parse JSON response
		let result: SmartPromptResult;
		try {
			// Clean the response text to remove markdown formatting
			const cleanedResponse = responseText
				.replace(/```json\s*/g, "") // Remove opening ```json
				.replace(/```\s*$/g, "") // Remove closing ```
				.replace(/^```\s*/g, "") // Remove opening ``` if no json
				.trim();

			result = JSON.parse(cleanedResponse);
		} catch (parseError) {
			// If JSON parsing fails, try to extract the prompt manually
			console.warn(
				"Failed to parse OpenAI response as JSON, extracting manually:",
				parseError,
			);
			result = extractPromptFromText(responseText, hanzi, meaning);
		}

		const validation = await validatePrompt(result.prompt, hanzi, meaning);
		if (!validation.isValid) {
			console.warn("Generated prompt has issues, regenerating...");
			return await generateSmartPrompt(hanzi, meaning, pinyin, context);
		}

		return result;
	} catch (error) {
		console.error("Error generating smart prompt:", error);
		// Fallback to basic prompt generation
		return generateFallbackPrompt(hanzi, meaning, pinyin);
	}
}

/**
 * Extract prompt from text when JSON parsing fails
 */
function extractPromptFromText(
	text: string,
	hanzi: string,
	meaning: string,
): SmartPromptResult {
	// Clean the text first
	const cleanedText = text
		.replace(/```json\s*/g, "")
		.replace(/```\s*$/g, "")
		.replace(/^```\s*/g, "")
		.trim();

	// Try to find JSON-like content
	const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
	if (jsonMatch) {
		try {
			const parsed = JSON.parse(jsonMatch[0]);
			if (parsed.prompt && parsed.negativePrompt) {
				return {
					prompt: parsed.prompt,
					negativePrompt: parsed.negativePrompt,
					confidence: parsed.confidence || 0.7,
					culturalAccuracy: parsed.culturalAccuracy || 0.7,
					educationalValue: parsed.educationalValue || 0.7,
					clarity: parsed.clarity || 0.7,
					metadata: parsed.metadata || {
						culturalContext: "Extracted from response",
						visualStrategy: "AI generated",
						targetAudience: "Chinese language learners",
						learningObjective: "Visual vocabulary association",
					},
				};
			}
		} catch (parseError) {
			console.warn("Failed to parse extracted JSON:", parseError);
		}
	}

	// Fallback extraction logic
	const lines = cleanedText.split("\n");
	let prompt = "";
	let negativePrompt = "";

	for (const line of lines) {
		if (line.toLowerCase().includes("prompt") && line.includes(":")) {
			prompt = line.split(":")[1]?.trim() || "";
		}
		if (line.toLowerCase().includes("negative") && line.includes(":")) {
			negativePrompt = line.split(":")[1]?.trim() || "";
		}
	}

	// If extraction failed, create basic prompts
	if (!prompt) {
		prompt = `A clear, culturally accurate image of ${meaning} in appropriate context. High quality photography, natural lighting, no text or characters.`;
	}
	if (!negativePrompt) {
		negativePrompt =
			"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.";
	}

	return {
		prompt,
		negativePrompt,
		confidence: 0.7,
		culturalAccuracy: 0.7,
		educationalValue: 0.7,
		clarity: 0.7,
		metadata: {
			culturalContext: "General",
			visualStrategy: "Literal representation",
			targetAudience: "Chinese language learners",
			learningObjective: "Visual vocabulary association",
		},
	};
}

/**
 * Generate a fallback prompt when OpenAI fails
 */
function generateFallbackPrompt(
	hanzi: string,
	meaning: string,
	pinyin: string,
): SmartPromptResult {
	const meaningLower = meaning.toLowerCase();

	let prompt = "";
	if (meaningLower.includes("person") || meaningLower.includes("people")) {
		prompt = `A respectful, culturally appropriate image of ${meaning} in natural setting. High quality photography, natural lighting, full body view, no text or characters.`;
	} else if (
		meaningLower.includes("place") ||
		meaningLower.includes("building")
	) {
		prompt = `A clear view of ${meaning} in authentic cultural context. High quality photography, natural lighting, no text or characters.`;
	} else if (meaningLower.includes("action") || meaningLower.includes("verb")) {
		prompt = `A person performing the action of ${meaning} in natural setting. High quality photography, clear motion, no text or characters.`;
	} else {
		prompt = `A clear, detailed image of ${meaning} in appropriate context. High quality photography, natural lighting, no text or characters.`;
	}

	return {
		prompt,
		negativePrompt:
			"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.",
		confidence: 0.6,
		culturalAccuracy: 0.6,
		educationalValue: 0.6,
		clarity: 0.6,
		metadata: {
			culturalContext: "General",
			visualStrategy: "Fallback generation",
			targetAudience: "Chinese language learners",
			learningObjective: "Basic visual association",
		},
	};
}

/**
 * Validate the quality of a generated prompt
 */
export async function validatePrompt(
	prompt: string,
	hanzi: string,
	meaning: string,
): Promise<PromptValidationResult> {
	if (!openai) {
		// Basic validation without OpenAI
		return basicPromptValidation(prompt);
	}

	try {
		const validationPrompt = `Analyze this image prompt for Chinese language learning:

Character: ${hanzi} (${meaning})
Prompt: "${prompt}"

Rate the prompt on these criteria (0-1 scale):
1. Cultural Accuracy: How well does it represent the cultural context?
2. Educational Value: How effective is it for learning?
3. Clarity: How clear and understandable is the visual concept?

Identify any issues and provide suggestions for improvement.

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown formatting, backticks, or explanatory text. Just the raw JSON object.

{
  "quality": "excellent|good|needs_improvement|poor",
  "issues": ["list of issues"],
  "suggestions": ["list of suggestions"],
  "culturalAccuracy": 0.95,
  "educationalValue": 0.95,
  "clarity": 0.95
}`;

		const completion = await openai.chat.completions.create({
			model: "gpt-4o-mini",
			messages: [{ role: "user", content: validationPrompt }],
			temperature: 0.3,
			max_tokens: 400,
		});

		const responseText = completion.choices[0]?.message?.content;
		if (!responseText) {
			return basicPromptValidation(prompt);
		}

		try {
			// Clean the response text to remove markdown formatting
			const cleanedResponse = responseText
				.replace(/```json\s*/g, "") // Remove opening ```json
				.replace(/```\s*$/g, "") // Remove closing ```
				.replace(/^```\s*/g, "") // Remove opening ``` if no json
				.trim();

			const validation = JSON.parse(cleanedResponse);
			return {
				isValid: validation.quality !== "poor",
				quality: validation.quality,
				issues: validation.issues || [],
				suggestions: validation.suggestions || [],
				culturalAccuracy: validation.culturalAccuracy || 0.5,
				educationalValue: validation.educationalValue || 0.5,
				clarity: validation.clarity || 0.5,
			};
		} catch (parseError) {
			console.warn("Failed to parse validation response:", parseError);
			return basicPromptValidation(prompt);
		}
	} catch (error) {
		console.error("Error validating prompt:", error);
		return basicPromptValidation(prompt);
	}
}

/**
 * Basic validation without OpenAI
 */
function basicPromptValidation(prompt: string): PromptValidationResult {
	const issues: string[] = [];
	const suggestions: string[] = [];

	// Check for common issues
	if (prompt.length < 50) {
		issues.push("Prompt too short");
		suggestions.push("Add more descriptive details");
	}

	if (!prompt.includes("no text") && !prompt.includes("no characters")) {
		issues.push("Missing text prohibition");
		suggestions.push('Add "no text or written characters"');
	}

	if (!prompt.includes("culturally") && !prompt.includes("appropriate")) {
		issues.push("Missing cultural sensitivity");
		suggestions.push("Add cultural appropriateness notes");
	}

	if (prompt.includes("illustration") && !prompt.includes("photography")) {
		issues.push("Generic illustration reference");
		suggestions.push("Specify photography style and quality");
	}

	const quality =
		issues.length === 0
			? "excellent"
			: issues.length <= 2
				? "good"
				: issues.length <= 4
					? "needs_improvement"
					: "poor";

	return {
		isValid: quality !== "poor",
		quality,
		issues,
		suggestions,
		culturalAccuracy: issues.includes("Missing cultural sensitivity")
			? 0.6
			: 0.8,
		educationalValue: issues.includes("Generic illustration reference")
			? 0.6
			: 0.8,
		clarity: issues.includes("Prompt too short") ? 0.6 : 0.8,
	};
}

/**
 * Enhance an existing prompt using smart generation
 */
export async function enhancePromptSmart(
	existingPrompt: string,
	hanzi: string,
	meaning: string,
	pinyin: string,
): Promise<SmartPromptResult> {
	const validation = await validatePrompt(existingPrompt, hanzi, meaning);

	if (validation.quality === "excellent") {
		// Convert existing prompt to SmartPromptResult format
		return {
			prompt: existingPrompt,
			negativePrompt:
				"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.",
			confidence: 0.9,
			culturalAccuracy: validation.culturalAccuracy,
			educationalValue: validation.educationalValue,
			clarity: validation.clarity,
			metadata: {
				culturalContext: "Existing prompt",
				visualStrategy: "Enhanced existing",
				targetAudience: "Chinese language learners",
				learningObjective: "Visual vocabulary association",
			},
		};
	}

	return await generateSmartPrompt(
		hanzi,
		meaning,
		pinyin,
		`Original prompt had issues: ${validation.issues.join(", ")}`,
	);

	// // For now, just return the existing prompt with default values
	// return {
	// 	prompt: existingPrompt,
	// 	negativePrompt:
	// 		"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.",
	// 	confidence: 0.8,
	// 	culturalAccuracy: 0.8,
	// 	educationalValue: 0.8,
	// 	clarity: 0.8,
	// 	metadata: {
	// 		culturalContext: "Existing prompt",
	// 		visualStrategy: "Enhanced existing",
	// 		targetAudience: "Chinese language learners",
	// 		learningObjective: "Visual vocabulary association",
	// 	},
	// };
}
