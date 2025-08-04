import mongoose from "mongoose";
import { logMongoConnection } from "./ensure-database-url";

const MONGODB_URI =
	process.env.MONGODB_URI || "mongodb://localhost:27017/danbing";

// Log connection info
if (process.env.NODE_ENV !== "production") {
	logMongoConnection(MONGODB_URI);
} else {
	// In production, just log that we're using the configured URI
	console.log("[MongoDB] Using configured MONGODB_URI with database: danbing");
}

if (!MONGODB_URI) {
	throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongoose;

if (!cached) {
	cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
	if (cached.conn) {
		return cached.conn;
	}

	if (!cached.promise) {
		const opts = {
			bufferCommands: false,
		};

		// Ensure we're connecting to the correct database
		const connectionOptions = {
			...opts,
			dbName: "danbing", // Explicitly set database name
		};

		cached.promise = mongoose
			.connect(MONGODB_URI, connectionOptions)
			.then(async (mongoose) => {
				const currentDb = mongoose.connection.db?.databaseName;

				// In production, always ensure we're using the danbing database
				if (process.env.NODE_ENV === "production" && currentDb !== "danbing") {
					console.log(
						`[MongoDB] Switching from '${currentDb}' to 'danbing' database...`,
					);
					await mongoose.connection.useDb("danbing");
				}

				console.log(
					`[MongoDB] Connected to database: ${mongoose.connection.db?.databaseName || "unknown"}`,
				);
				return mongoose;
			});
	}

	try {
		cached.conn = await cached.promise;
	} catch (e) {
		cached.promise = null;
		throw e;
	}

	return cached.conn;
}

export default connectDB;

// Export MongoDB client for GridFS operations
export async function getMongoClient() {
	await connectDB();
	return mongoose.connection.getClient();
}
