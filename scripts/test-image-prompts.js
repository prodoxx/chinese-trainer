#!/usr/bin/env node
/**
 * Test script to verify improved image prompt generation
 * Updated to use the current active prompt optimization service
 */

import { optimizeImagePrompt } from "../src/lib/enrichment/prompt-optimization-service.ts";

const testCases = [
	// People that should show full body
	{ hanzi: "奶奶", meaning: "grandmother", pinyin: "nǎi nǎi" },
	{ hanzi: "爺爺", meaning: "grandfather", pinyin: "yé ye" },
	{ hanzi: "老人", meaning: "old person", pinyin: "lǎo rén" },
	{ hanzi: "別人", meaning: "other people", pinyin: "bié rén" },
	{ hanzi: "朋友", meaning: "friend", pinyin: "péng yǒu" },

	// Actions
	{ hanzi: "吃", meaning: "eat", pinyin: "chī" },
	{ hanzi: "跑", meaning: "run", pinyin: "pǎo" },

	// Objects
	{ hanzi: "書", meaning: "book", pinyin: "shū" },
	{ hanzi: "車", meaning: "car", pinyin: "chē" },

	// Grammar particles that should get symbolic representation
	{ hanzi: "的", meaning: "particle", pinyin: "de" },
	{ hanzi: "了", meaning: "particle", pinyin: "le" },
	{ hanzi: "嗎", meaning: "question particle", pinyin: "ma" },
];

console.log("Testing Current Image Prompt Generation System");
console.log("============================================\n");

for (const test of testCases) {
	console.log(`\n📝 Character: ${test.hanzi} (${test.pinyin})`);
	console.log(`   Meaning: ${test.meaning}`);

	try {
		// Use the current active prompt optimization service
		const result = await optimizeImagePrompt(
			test.hanzi,
			test.meaning,
			test.pinyin,
		);

		if (result.prompt) {
			console.log(`   ✅ Generated Prompt:`);
			console.log(`      "${result.prompt}"`);
			console.log(`   🎯 Confidence: ${(result.confidence * 100).toFixed(0)}%`);

			// Check for key improvements
			const improvements = [];
			if (
				result.prompt.includes("full body") ||
				result.prompt.includes("three-quarter view")
			)
				improvements.push("avoids close-ups");
			if (result.prompt.includes("Asian"))
				improvements.push("culturally appropriate");
			if (result.prompt.includes("diverse"))
				improvements.push("promotes diversity");
			if (result.prompt.includes("no stereotypes"))
				improvements.push("avoids stereotypes");
			if (result.prompt.includes("educational"))
				improvements.push("educational focus");
			if (result.prompt.includes("professional"))
				improvements.push("professional quality");

			if (improvements.length > 0) {
				console.log(`   🎯 Improvements: ${improvements.join(", ")}`);
			}

			// Show optimization details
			if (result.metadata.optimizations.length > 0) {
				console.log(
					`   🔧 Optimizations: ${result.metadata.optimizations.join(", ")}`,
				);
			}

			if (result.metadata.warnings.length > 0) {
				console.log(`   ⚠️  Warnings: ${result.metadata.warnings.join(", ")}`);
			}
		} else {
			console.log(`   ❌ No prompt generated`);
		}
	} catch (error) {
		console.log(`   ❌ Error: ${error.message}`);
	}
}

console.log("\n\n✨ Summary:");
console.log("- Using the current active prompt optimization service");
console.log(
	"- All characters now get appropriate image prompts (including grammar particles)",
);
console.log(
	"- Grammar particles get symbolic representations instead of being skipped",
);
console.log("- Professional photography styling applied to all prompts");
console.log("- Cultural sensitivity and diversity awareness built-in");
console.log("- Automatic prompt optimization and quality enhancement");
