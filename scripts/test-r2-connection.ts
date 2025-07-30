#!/usr/bin/env bun

import { S3Client, ListBucketsCommand, PutObjectCommand } from "@aws-sdk/client-s3";

// Test R2 connection
async function testR2Connection() {
  console.log("Testing R2 connection...");
  
  // Show environment variables (masked)
  console.log("R2_ACCOUNT_ID:", process.env.R2_ACCOUNT_ID);
  console.log("R2_ACCESS_KEY_ID:", process.env.R2_ACCESS_KEY_ID?.substring(0, 8) + "...");
  console.log("R2_SECRET_ACCESS_KEY:", process.env.R2_SECRET_ACCESS_KEY?.substring(0, 8) + "...");
  console.log("R2_BUCKET_NAME:", process.env.R2_BUCKET_NAME);
  
  try {
    // Create client with minimal configuration
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
    
    // Try to list buckets first
    console.log("\nTrying to list buckets...");
    try {
      const listCommand = new ListBucketsCommand({});
      const listResult = await client.send(listCommand);
      console.log("✅ List buckets successful!");
      console.log("Buckets:", listResult.Buckets?.map(b => b.Name).join(", "));
    } catch (error: any) {
      console.error("❌ List buckets failed:", error.message);
    }
    
    // Try a simple upload
    console.log("\nTrying to upload a test file...");
    const testKey = `test/connection-test-${Date.now()}.txt`;
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: testKey,
      Body: Buffer.from("Hello from R2 test!"),
      ContentType: "text/plain",
    });
    
    const result = await client.send(putCommand);
    console.log("✅ Upload successful!");
    console.log("ETag:", result.ETag);
    console.log("Test file URL:", `${process.env.R2_PUBLIC_URL}/${testKey}`);
    
  } catch (error: any) {
    console.error("\n❌ R2 connection test failed!");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    if (error.Code) console.error("Error code:", error.Code);
    if (error.$fault) console.error("Fault:", error.$fault);
    if (error.$metadata) console.error("Metadata:", JSON.stringify(error.$metadata, null, 2));
  }
}

// Run the test
testR2Connection().catch(console.error);