import fs from "fs";
import readline from "readline";
import mongoose from "mongoose";
import Dictionary from "../src/lib/db/models/Dictionary";
import { logMongoConnection } from "../src/lib/db/ensure-database-url";
import dotenv from "dotenv";
import path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/danbing";
const CEDICT_FILE = "./data/cedict_ts.u8";

// Log connection info
logMongoConnection(MONGODB_URI);

async function loadCEDICT() {
	console.log("Connecting to MongoDB...");

	try {
		await mongoose.connect(MONGODB_URI, {
			dbName: "danbing", // Explicitly set database name
		});
		console.log("✓ Connected to MongoDB successfully");
		console.log(`✓ Using database: ${mongoose.connection.db?.databaseName}`);
	} catch (error) {
		console.error("✗ Failed to connect to MongoDB:");
		console.error(error);
		console.error("\nTroubleshooting:");
		console.error(
			"1. For local development: Make sure MongoDB is running (docker-compose up -d)",
		);
		console.error(
			"2. For production: Set MONGODB_URI environment variable to your cloud MongoDB instance",
		);
		console.error(
			"3. Check authentication: Verify username/password in connection string",
		);
		console.error(
			"4. Check network: Ensure MongoDB is accessible from this environment",
		);
		process.exit(1);
	}

	console.log("Clearing existing dictionary entries...");
	await Dictionary.deleteMany({});

	const fileStream = fs.createReadStream(CEDICT_FILE);
	const rl = readline.createInterface({
		input: fileStream,
		crlfDelay: Infinity,
	});

	let count = 0;
	const batch: any[] = [];
	const BATCH_SIZE = 1000;

	console.log("Loading CC-CEDICT entries...");

	for await (const line of rl) {
		// Skip comments
		if (line.startsWith("#") || !line.trim()) continue;

		// Parse line format: Traditional Simplified [pinyin] /definition1/definition2/
		const match = line.match(/^(.+?) (.+?) \[(.+?)\] \/(.+)\/$/);

		if (match) {
			const [, traditional, simplified, pinyin, definitionsStr] = match;
			const definitions = definitionsStr.split("/").filter((d) => d.trim());

			batch.push({
				traditional: traditional.trim(),
				simplified: simplified.trim(),
				pinyin: pinyin.trim(),
				definitions,
			});

			if (batch.length >= BATCH_SIZE) {
				await Dictionary.insertMany(batch);
				count += batch.length;
				batch.length = 0;

				if (count % 10000 === 0) {
					console.log(`Loaded ${count} entries...`);
				}
			}
		}
	}

	// Insert remaining batch
	if (batch.length > 0) {
		await Dictionary.insertMany(batch);
		count += batch.length;
	}

	console.log(`\nSuccessfully loaded ${count} dictionary entries!`);

	// Test a few lookups
	console.log("\nTesting lookups:");
	const testChars = ["我", "你", "好", "愛", "學"];

	for (const char of testChars) {
		const entry = await Dictionary.findOne({ traditional: char });
		if (entry) {
			console.log(`${char}: ${entry.pinyin} - ${entry.definitions[0]}`);
		}
	}

	await mongoose.connection.close();
	console.log("\nDone!");
}

loadCEDICT().catch(console.error);
