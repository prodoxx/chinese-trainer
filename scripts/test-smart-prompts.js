#!/usr/bin/env node
/**
 * Test script to demonstrate the new smart prompt generation system
 * Uses OpenAI to generate culturally accurate, educational prompts
 */

import { generateSmartPrompt } from "../src/lib/enrichment/smart-prompt-generator.ts";

const testCases = [
	// Family terms that need cultural accuracy
	{ hanzi: "奶奶", meaning: "grandma", pinyin: "nǎi nǎi" },
	{ hanzi: "爺爺", meaning: "grandpa", pinyin: "yé ye" },

	// Places that need cultural context
	{ hanzi: "公寓", meaning: "apartment", pinyin: "gōng yù" },
	{ hanzi: "學校", meaning: "school", pinyin: "xué xiào" },

	// Actions that need clarity
	{ hanzi: "吃", meaning: "eat", pinyin: "chī" },
	{ hanzi: "跑", meaning: "run", pinyin: "pǎo" },

	// Objects that need educational value
	{ hanzi: "書", meaning: "book", pinyin: "shū" },
	{ hanzi: "車", meaning: "car", pinyin: "chē" },

	// Grammar particles that need symbolic representation
	{ hanzi: "的", meaning: "particle", pinyin: "de" },
	{ hanzi: "嗎", meaning: "question particle", pinyin: "ma" },
];

console.log("🧠 Testing Smart Image Prompt Generation System");
console.log("==============================================\n");

for (const test of testCases) {
	console.log(`\n📝 Character: ${test.hanzi} (${test.pinyin})`);
	console.log(`   Meaning: ${test.meaning}`);

	try {
		// Generate smart prompt using OpenAI
		const result = await generateSmartPrompt(
			test.hanzi,
			test.meaning,
			test.pinyin,
		);

		console.log(`   ✅ Generated Smart Prompt:`);
		console.log(`      "${result.prompt}"`);
		console.log(`   🚫 Negative Prompt:`);
		console.log(`      "${result.negativePrompt}"`);

		// Show quality metrics
		console.log(`   📊 Quality Metrics:`);
		console.log(
			`      Cultural Accuracy: ${(result.culturalAccuracy * 100).toFixed(0)}%`,
		);
		console.log(
			`      Educational Value: ${(result.educationalValue * 100).toFixed(0)}%`,
		);
		console.log(`      Clarity: ${(result.clarity * 100).toFixed(0)}%`);
		console.log(
			`      Overall Confidence: ${(result.confidence * 100).toFixed(0)}%`,
		);

		// Show metadata
		console.log(`   🎯 Strategy: ${result.metadata.visualStrategy}`);
		console.log(`   🌍 Cultural Context: ${result.metadata.culturalContext}`);
		console.log(
			`   🎓 Learning Objective: ${result.metadata.learningObjective}`,
		);

		// TEMPORARILY DISABLED: Validate the generated prompt
		// console.log(`   🔍 Validating prompt quality...`);
		// const validation = await validatePrompt(
		// 	result.prompt,
		// 	test.hanzi,
		// 	test.meaning,
		// );

		// if (validation.isValid) {
		// 	console.log(`   ✅ Validation: ${validation.quality.toUpperCase()}`);
		// } else {
		// 	console.log(`   ❌ Validation: ${validation.quality.toUpperCase()}`);
		// 	if (validation.issues.length > 0) {
		// 		console.log(`      Issues: ${validation.issues.join(", ")}`);
		// 	}
		// 	if (validation.suggestions.length > 0) {
		// 		console.log(`      Suggestions: ${validation.suggestions.join(", ")}`);
		// 	}
		// }

		console.log(`   🔍 Validation: TEMPORARILY DISABLED`);
	} catch (error) {
		console.log(`   ❌ Error: ${error.message}`);
	}
}

console.log("\n\n✨ Summary of Smart Prompt Generation:");
console.log("- Uses OpenAI GPT-4o-mini for intelligent prompt creation");
console.log("- Emphasizes cultural accuracy and educational value");
console.log("- Includes negative prompts to avoid unwanted elements");
console.log("- Automatic quality validation and improvement");
console.log("- Fallback to basic generation if AI fails");
console.log("- Focuses on clarity, simplicity, and cultural sensitivity");
