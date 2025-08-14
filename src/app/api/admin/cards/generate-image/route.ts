import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import connectDB from "@/lib/db/mongodb";
import Card from "@/lib/db/models/Card";
import { fal } from "@fal-ai/client";
import { optimizeImagePrompt } from "@/lib/enrichment/prompt-optimization-service";

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session?.user || session.user.role !== "admin") {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { cardId, prompt: customPrompt, preview } = await req.json();

		if (!cardId) {
			return NextResponse.json({ error: "Missing cardId" }, { status: 400 });
		}

		// Configure fal.ai client
		if (!process.env.FAL_KEY) {
			return NextResponse.json(
				{ error: "Image generation service not configured" },
				{ status: 500 },
			);
		}

		fal.config({
			credentials: process.env.FAL_KEY,
		});

		// Fetch card to get hanzi, meaning, and pinyin
		await connectDB();
		const card = await Card.findById(cardId).select("hanzi meaning pinyin");

		if (!card) {
			return NextResponse.json({ error: "Card not found" }, { status: 404 });
		}

		// Optimize the prompt (either custom or generate new)
		const optimizationResult = await optimizeImagePrompt(
			card.hanzi,
			card.meaning,
			card.pinyin,
			customPrompt,
		);

		const prompt = optimizationResult.prompt;

		// Include optimization metadata in response
		const optimizationMetadata = {
			confidence: optimizationResult.confidence,
			optimizations: optimizationResult.metadata.optimizations,
			warnings: optimizationResult.metadata.warnings,
		};

		// Generate the image using the prompt with negative prompts
		const result = (await fal.run("fal-ai/imagen4/preview", {
			input: {
				prompt,
				negative_prompt:
					"No text, letters, numbers, or written characters. No stereotypes or inappropriate content.",
				steps: 20,
				cfg_scale: 7.5,
				seed: Math.floor(Math.random() * 1000000),
			} as any,
		})) as any;

		const imageUrl = result?.images?.[0]?.url || result?.data?.images?.[0]?.url;

		if (!imageUrl) {
			console.error("Fal.ai response:", result);
			return NextResponse.json(
				{ error: "Failed to generate image" },
				{ status: 500 },
			);
		}

		// If this is just a preview, return the temporary URL with optimization info
		if (preview) {
			return NextResponse.json({
				success: true,
				imageUrl,
				message: "Preview generated successfully",
				prompt: prompt,
				optimization: optimizationMetadata,
			});
		}

		// If not preview, save to database (this shouldn't happen with current flow)
		await connectDB();

		await Card.findByIdAndUpdate(cardId, {
			imageUrl,
			imagePrompt: prompt,
			updatedAt: new Date(),
		});

		return NextResponse.json({
			success: true,
			imageUrl,
			message: "Image generated and saved successfully",
		});
	} catch (error) {
		console.error("Error generating image:", error);
		return NextResponse.json(
			{
				error: "Failed to generate image",
				details: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 },
		);
	}
}
