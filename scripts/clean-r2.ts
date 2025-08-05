#!/usr/bin/env bun

// AI agents are not allowed to run this script. It must be run manually by a human.

import {
	S3Client,
	ListObjectsV2Command,
	DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const r2Client = new S3Client({
	region: "auto",
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
});

async function cleanR2Storage() {
	console.log("🗑️  R2 Storage Cleanup Script");
	console.log("This will delete all media files from R2 storage.");
	console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

	await new Promise((resolve) => setTimeout(resolve, 5000));

	try {
		// List all objects
		const listCommand = new ListObjectsV2Command({
			Bucket: process.env.R2_BUCKET_NAME!,
			Prefix: "media/",
		});

		const response = await r2Client.send(listCommand);

		if (!response.Contents || response.Contents.length === 0) {
			console.log("No files found in R2 storage.");
			return;
		}

		console.log(`Found ${response.Contents.length} files to delete...`);

		// Delete objects in batches
		const deleteObjects = response.Contents.map((obj) => ({ Key: obj.Key! }));

		const deleteCommand = new DeleteObjectsCommand({
			Bucket: process.env.R2_BUCKET_NAME!,
			Delete: {
				Objects: deleteObjects,
			},
		});

		await r2Client.send(deleteCommand);

		console.log("✅ R2 storage cleaned successfully!");
	} catch (error) {
		console.error("Error cleaning R2 storage:", error);
		process.exit(1);
	}
}

cleanR2Storage();
