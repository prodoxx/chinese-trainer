// AI agents are not allowed to run this script. It must be run manually by a human.

import {
	S3Client,
	ListObjectsV2Command,
	DeleteObjectsCommand,
} from "@aws-sdk/client-s3";
import "dotenv/config";

// Initialize R2 client
const r2Client = new S3Client({
	region: "auto",
	endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID!,
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
	},
	forcePathStyle: true,
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

async function cleanSharedMedia() {
	console.log("🧹 R2 Shared Media Cleanup Script\n");
	console.log("This will delete all shared media files from R2 storage.");
	console.log("This includes images and audio files for all characters.\n");
	console.log("Press Ctrl+C to cancel, or wait 5 seconds to continue...\n");

	await new Promise((resolve) => setTimeout(resolve, 5000));

	try {
		console.log("Listing shared media files...");

		// List all objects with prefix "media/shared/"
		const listCommand = new ListObjectsV2Command({
			Bucket: BUCKET_NAME,
			Prefix: "media/shared/",
		});

		const response = await r2Client.send(listCommand);

		if (!response.Contents || response.Contents.length === 0) {
			console.log("No shared media files found in R2.");
			return;
		}

		console.log(`Found ${response.Contents.length} shared media files.`);

		// Delete in batches of 1000 (AWS S3 limit)
		const objects = response.Contents.map((obj) => ({ Key: obj.Key! }));
		const batches = [];

		for (let i = 0; i < objects.length; i += 1000) {
			batches.push(objects.slice(i, i + 1000));
		}

		for (let i = 0; i < batches.length; i++) {
			console.log(`Deleting batch ${i + 1} of ${batches.length}...`);

			const deleteCommand = new DeleteObjectsCommand({
				Bucket: BUCKET_NAME,
				Delete: {
					Objects: batches[i],
				},
			});

			await r2Client.send(deleteCommand);
		}

		console.log(
			`\n✅ Successfully deleted ${response.Contents.length} shared media files from R2!`,
		);
		console.log(
			"\nYou can now re-enrich your cards with proper hanzi+pinyin based media.",
		);
	} catch (error) {
		console.error("Error cleaning R2 shared media:", error);
		process.exit(1);
	}
}

cleanSharedMedia();
