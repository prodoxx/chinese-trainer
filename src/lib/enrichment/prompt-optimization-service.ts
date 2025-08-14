/**
 * Prompt Optimization Service
 * Analyzes and improves prompts based on patterns and outcomes
 */

import { analyzePromptQuality } from "./intelligent-prompt-generator";
import {
	generateSmartPrompt,
	validatePrompt,
	enhancePromptSmart,
	SmartPromptResult,
} from "./smart-prompt-generator";

interface PromptPattern {
	pattern: RegExp;
	issue: string;
	replacement: string | ((match: string) => string);
}

/**
 * Common patterns that cause problems in image generation
 */
const PROBLEMATIC_PATTERNS: PromptPattern[] = [
	{
		pattern: /close[- ]?up of hands?/gi,
		issue: "Close-ups of hands often show AI anomalies",
		replacement: "hands in natural position, full body view",
	},
	{
		pattern: /detailed fingers/gi,
		issue: "Detailed fingers often have incorrect count",
		replacement: "natural hand gestures",
	},
	{
		pattern: /\b(grandmother|grandfather|elderly)\b(?!.*\bAsian\b)/gi,
		issue: "Missing cultural context for family terms",
		replacement: (match) => `Asian ${match}`,
	},
	{
		pattern: /other people(?!.*diverse)/gi,
		issue: "May not show diversity",
		replacement: "diverse group of people from different backgrounds",
	},
	{
		pattern: /^[^.]{0,30}$/,
		issue: "Prompt too short",
		replacement: (match) =>
			`${match}. High quality, educational illustration with clear details.`,
	},
];

/**
 * Quality enhancers to add to prompts
 */
const QUALITY_ENHANCERS = {
	safety: ", family-friendly, culturally appropriate, no stereotypes",
	clarity: ", clear composition, good lighting, educational focus",
	technical: ", high quality, photorealistic when appropriate",
	noText: ", no text, letters, numbers, or written characters",
	people: ", full body or three-quarter view, natural poses",
	objects: ", detailed view, typical usage context",
};

/**
 * Optimize a prompt by fixing common issues
 */
export function optimizePrompt(
	prompt: string,
	hanzi: string,
	meaning: string,
): {
	optimized: string;
	changes: string[];
	confidence: number;
} {
	let optimized = prompt;
	const changes: string[] = [];

	// Apply pattern-based fixes
	for (const pattern of PROBLEMATIC_PATTERNS) {
		if (pattern.pattern.test(optimized)) {
			const before = optimized;
			if (typeof pattern.replacement === "string") {
				optimized = optimized.replace(pattern.pattern, pattern.replacement);
			} else {
				optimized = optimized.replace(pattern.pattern, pattern.replacement);
			}
			if (before !== optimized) {
				changes.push(`Fixed: ${pattern.issue}`);
			}
		}
	}

	// Add quality enhancers if missing
	if (
		!optimized.includes("family-friendly") &&
		!optimized.includes("appropriate")
	) {
		optimized += QUALITY_ENHANCERS.safety;
		changes.push("Added safety modifiers");
	}

	if (!optimized.includes("no text") && !optimized.includes("no letters")) {
		optimized += QUALITY_ENHANCERS.noText;
		changes.push("Added no-text requirement");
	}

	// Add specific enhancers based on content
	const meaningLower = meaning.toLowerCase();
	if (meaningLower.includes("person") || meaningLower.includes("people")) {
		if (
			!optimized.includes("full body") &&
			!optimized.includes("three-quarter")
		) {
			optimized += QUALITY_ENHANCERS.people;
			changes.push("Added body view specification");
		}
	}

	// Clean up any duplicate commas or spaces
	optimized = optimized
		.replace(/,\s*,/g, ",")
		.replace(/\s+/g, " ")
		.replace(/\.\s*\./g, ".")
		.trim();

	// Calculate confidence based on changes made
	const confidence =
		changes.length === 0 ? 1.0 : Math.max(0.7, 1.0 - changes.length * 0.1);

	return {
		optimized,
		changes,
		confidence,
	};
}

/**
 * Analyze prompt for potential issues before generation
 */
export function analyzePromptBeforeGeneration(prompt: string): {
	shouldGenerate: boolean;
	warnings: string[];
	suggestions: string[];
} {
	const analysis = analyzePromptQuality(prompt);

	// Determine if we should proceed
	const shouldGenerate = analysis.quality !== "problematic";

	// Compile warnings
	const warnings = analysis.issues.map((issue) => `⚠️ ${issue}`);

	// Add specific warnings for high-risk patterns
	if (prompt.includes("detailed anatomy")) {
		warnings.push("⚠️ Detailed anatomy often results in AI artifacts");
	}

	if (prompt.includes("crowd") || prompt.includes("many people")) {
		warnings.push("⚠️ Crowds often have distorted faces and bodies");
	}

	return {
		shouldGenerate,
		warnings,
		suggestions: analysis.suggestions,
	};
}

/**
 * Learn from successful prompts (for future ML integration)
 */
export function recordPromptSuccess(
	prompt: string,
	hanzi: string,
	meaning: string,
	success: boolean,
	issues?: string[],
): void {
	// This could be extended to save to a database for ML training
	// For now, just log for analysis
	if (!success && issues) {
		console.log("Prompt issues recorded:", {
			hanzi,
			meaning,
			prompt: prompt.substring(0, 100),
			issues,
		});
	}
}

/**
 * Generate alternative prompts if the first one fails
 */
export function generateAlternativePrompts(
	originalPrompt: string,
	hanzi: string,
	meaning: string,
	previousIssues: string[],
): string[] {
	const alternatives: string[] = [];

	// Strategy 1: Simplify the scene
	if (
		previousIssues.some(
			(issue) => issue.includes("complex") || issue.includes("crowd"),
		)
	) {
		alternatives.push(
			`Simple, minimalist illustration of "${meaning}". Single focus element, clean background, educational style.`,
		);
	}

	// Strategy 2: Use symbolic representation
	if (
		previousIssues.some(
			(issue) => issue.includes("anatomy") || issue.includes("anomal"),
		)
	) {
		alternatives.push(
			`Symbolic or stylized representation of "${meaning}". Abstract visual metaphor, no detailed anatomy required.`,
		);
	}

	// Strategy 3: Change perspective
	if (
		previousIssues.some(
			(issue) => issue.includes("hands") || issue.includes("feet"),
		)
	) {
		alternatives.push(
			`Wide shot showing "${meaning}" from a distance. Environmental context, no close-up details.`,
		);
	}

	// Strategy 4: Use objects instead of people
	if (
		previousIssues.some(
			(issue) => issue.includes("face") || issue.includes("person"),
		)
	) {
		alternatives.push(
			`Objects or symbols representing "${meaning}". No human figures, focus on conceptual representation.`,
		);
	}

	// Always include a safe fallback
	alternatives.push(
		`Educational diagram or infographic for "${meaning}". Clear, simple, symbolic representation suitable for language learning.`,
	);

	return alternatives;
}

/**
 * Main optimization pipeline
 */
export async function optimizeImagePrompt(
	hanzi: string,
	meaning: string,
	pinyin: string,
	initialPrompt?: string,
): Promise<{
	prompt: string;
	confidence: number;
	metadata: {
		optimizations: string[];
		warnings: string[];
		alternatives: string[];
	};
}> {
	// Start with initial prompt or generate one
	let prompt = initialPrompt;
	if (!prompt) {
		const { generateIntelligentPrompt } = await import(
			"./intelligent-prompt-generator"
		);
		prompt = generateIntelligentPrompt(hanzi, meaning, pinyin);
	}

	// Optimize the prompt
	const optimization = optimizePrompt(prompt, hanzi, meaning);

	// Analyze for issues
	const analysis = analyzePromptBeforeGeneration(optimization.optimized);

	// Generate alternatives in case of issues
	const alternatives =
		analysis.warnings.length > 0
			? generateAlternativePrompts(
					optimization.optimized,
					hanzi,
					meaning,
					analysis.warnings,
				)
			: [];

	return {
		prompt: optimization.optimized,
		confidence: optimization.confidence,
		metadata: {
			optimizations: optimization.changes,
			warnings: analysis.warnings,
			alternatives,
		},
	};
}

/**
 * Smart optimization pipeline using OpenAI for better prompts
 */
export async function optimizeImagePromptSmart(
	hanzi: string,
	meaning: string,
	pinyin: string,
	initialPrompt?: string,
): Promise<SmartPromptResult> {
	try {
		// Try to generate a smart prompt first
		const smartResult = await generateSmartPrompt(
			hanzi,
			meaning,
			pinyin,
			initialPrompt,
		);

		const validation = await validatePrompt(smartResult.prompt, hanzi, meaning);

		if (validation.isValid && validation.quality === "excellent") {
			return smartResult;
		}

		// If the smart prompt has issues, try to enhance it
		if (initialPrompt) {
			return await enhancePromptSmart(initialPrompt, hanzi, meaning, pinyin);
		}

		// Fallback to the smart result even if it has minor issues
		return smartResult;
	} catch (error) {
		console.error(
			"Smart prompt generation failed, falling back to basic optimization:",
			error,
		);

		// Fallback to basic optimization
		const basicResult = await optimizeImagePrompt(
			hanzi,
			meaning,
			pinyin,
			initialPrompt,
		);

		// Convert to SmartPromptResult format
		return {
			prompt: basicResult.prompt,
			negativePrompt:
				"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.",
			confidence: basicResult.confidence,
			culturalAccuracy: 0.7,
			educationalValue: 0.7,
			clarity: 0.7,
			metadata: {
				culturalContext: "Fallback generation",
				visualStrategy: "Basic optimization",
				targetAudience: "Chinese language learners",
				learningObjective: "Visual vocabulary association",
			},
		};
	}
}
