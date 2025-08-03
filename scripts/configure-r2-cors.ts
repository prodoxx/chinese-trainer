/**
 * Script to configure CORS for R2 buckets
 * This allows local development to access media files
 * Run with: npx tsx scripts/configure-r2-cors.ts
 */

import { S3Client, PutBucketCorsCommand } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';

dotenv.config();

async function configureCORS() {
  // Configure for the static bucket (static.danbing.ai)
  const staticR2Client = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  const corsConfiguration = {
    CORSRules: [
      {
        AllowedHeaders: ["*"],
        AllowedMethods: ["GET", "HEAD"],
        AllowedOrigins: [
          "http://localhost:3000",
          "http://localhost:3001", 
          "https://localhost:3000",
          "https://danbing.ai",
          "https://*.danbing.ai",
          "https://*.vercel.app" // For preview deployments
        ],
        ExposeHeaders: ["Content-Length", "Content-Type", "ETag"],
        MaxAgeSeconds: 3600
      }
    ]
  };

  try {
    // Configure CORS for static bucket
    console.log('🔧 Configuring CORS for static bucket (danbing-static-media)...');
    
    const command = new PutBucketCorsCommand({
      Bucket: 'danbing-static-media',
      CORSConfiguration: corsConfiguration
    });

    await staticR2Client.send(command);
    console.log('✅ CORS configured successfully for static bucket!');

    // Also configure for the main bucket if needed
    const mainR2Client = new S3Client({
      region: "auto", 
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });

    if (process.env.R2_BUCKET_NAME) {
      console.log(`\n🔧 Configuring CORS for main bucket (${process.env.R2_BUCKET_NAME})...`);
      
      const mainCommand = new PutBucketCorsCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        CORSConfiguration: corsConfiguration
      });

      await mainR2Client.send(mainCommand);
      console.log('✅ CORS configured successfully for main bucket!');
    }

    console.log('\n📌 CORS Configuration applied:');
    console.log('- Allowed origins: localhost:3000, danbing.ai, *.vercel.app');
    console.log('- Allowed methods: GET, HEAD');
    console.log('- Max age: 3600 seconds');
    
  } catch (error) {
    console.error('❌ Error configuring CORS:', error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  configureCORS()
    .then(() => {
      console.log('\n✨ CORS configuration complete!');
      console.log('Audio files should now be accessible from localhost:3000');
    })
    .catch((error) => {
      console.error('Failed to configure CORS:', error);
      process.exit(1);
    });
}

export { configureCORS };