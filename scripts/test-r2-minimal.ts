#!/usr/bin/env bun

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Minimal R2 test without checksums
async function testR2Minimal() {
  console.log("Testing minimal R2 upload...");
  
  try {
    const client = new S3Client({
      region: "auto",
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      // Disable automatic checksum calculation
      checksumAlgorithm: undefined,
    });
    
    // Test with the exact same path structure as the error
    const testKey = `decks/6888f5dd5ffef1243182e5a2/cards/6888f5de61a98c4daa86ca95/test-audio.mp3`;
    console.log("Testing with key:", testKey);
    
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: testKey,
      Body: Buffer.from("Test audio data"),
      ContentType: "audio/mpeg",
      // Disable checksum
      ChecksumAlgorithm: undefined,
      Metadata: {
        text: "test",
        voice: "test-voice",
        generatedAt: new Date().toISOString(),
      }
    });
    
    const result = await client.send(command);
    console.log("✅ Upload successful!");
    console.log("ETag:", result.ETag);
    
  } catch (error: any) {
    console.error("\n❌ Upload failed!");
    console.error("Error:", error.message);
    if (error.Code) console.error("Code:", error.Code);
    if (error.StringToSign) console.error("StringToSign:", error.StringToSign);
  }
}

testR2Minimal().catch(console.error);