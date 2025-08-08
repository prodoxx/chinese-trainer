import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import crypto from "crypto";

// Initialize R2 client
const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
  // Force path-style addressing for R2 compatibility
  forcePathStyle: true,
  // Disable checksums for R2 compatibility
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export interface UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

/**
 * Upload a file to R2 storage
 */
export async function uploadToR2(
  key: string,
  body: Buffer | Uint8Array | string | ReadableStream,
  options: UploadOptions = {}
): Promise<string> {
  try {
    // Filter out empty metadata values
    let filteredMetadata: Record<string, string> | undefined = undefined;
    
    if (options.metadata) {
      const nonEmptyMetadata: Record<string, string> = {};
      for (const [key, value] of Object.entries(options.metadata)) {
        // Only include if value is non-empty string
        if (value && typeof value === 'string' && value.trim() !== '') {
          nonEmptyMetadata[key] = value;
        }
      }
      
      // Only set metadata if there are non-empty values
      if (Object.keys(nonEmptyMetadata).length > 0) {
        filteredMetadata = nonEmptyMetadata;
      }
    }
    
    // Build command parameters, only including defined values
    const commandParams: any = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
    };
    
    if (options.contentType) {
      commandParams.ContentType = options.contentType;
    }
    
    if (filteredMetadata && Object.keys(filteredMetadata).length > 0) {
      commandParams.Metadata = filteredMetadata;
    }
    
    const command = new PutObjectCommand(commandParams);

    await r2Client.send(command);
    
    // Return the key for internal reference
    return key;
  } catch (error) {
    console.error("Error uploading to R2:", error);
    throw new Error(`Failed to upload file to R2: ${error}`);
  }
}

/**
 * Upload a large file using multipart upload
 */
export async function uploadLargeFileToR2(
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  options: UploadOptions = {}
): Promise<string> {
  try {
    // Filter out empty metadata values
    let filteredMetadata: Record<string, string> | undefined = undefined;
    
    if (options.metadata) {
      const nonEmptyMetadata: Record<string, string> = {};
      for (const [key, value] of Object.entries(options.metadata)) {
        // Only include if value is non-empty string
        if (value && typeof value === 'string' && value.trim() !== '') {
          nonEmptyMetadata[key] = value;
        }
      }
      
      // Only set metadata if there are non-empty values
      if (Object.keys(nonEmptyMetadata).length > 0) {
        filteredMetadata = nonEmptyMetadata;
      }
    }
    
    // Build command parameters, only including defined values
    const uploadParams: any = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
    };
    
    if (options.contentType) {
      uploadParams.ContentType = options.contentType;
    }
    
    if (filteredMetadata && Object.keys(filteredMetadata).length > 0) {
      uploadParams.Metadata = filteredMetadata;
    }
    
    const upload = new Upload({
      client: r2Client,
      params: uploadParams,
    });

    await upload.done();
    
    return key;
  } catch (error) {
    console.error("Error uploading large file to R2:", error);
    throw new Error(`Failed to upload large file to R2: ${error}`);
  }
}

/**
 * Download a file from R2 storage
 */
export async function downloadFromR2(key: string): Promise<Buffer> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await r2Client.send(command);
    
    // In Node.js, Body is a readable stream that needs to be converted to buffer
    if (!response.Body) {
      throw new Error('No body in response');
    }
    
    // Convert the stream to a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of response.Body as any) {
      chunks.push(Buffer.from(chunk));
    }
    
    return Buffer.concat(chunks);
  } catch (error) {
    console.error("Error downloading from R2:", error);
    throw new Error(`Failed to download file from R2: ${error}`);
  }
}

/**
 * Delete a file from R2 storage
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
  } catch (error) {
    console.error("Error deleting from R2:", error);
    throw new Error(`Failed to delete file from R2: ${error}`);
  }
}

/**
 * Check if a file exists in R2
 */
export async function existsInR2(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await r2Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a presigned URL for temporary access
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(r2Client, command, { expiresIn });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error(`Failed to generate presigned URL: ${error}`);
  }
}

/**
 * Generate storage keys for card media
 * Uses only cardId to ensure media is shared across decks
 */
export function generateMediaKeys(deckId: string, cardId: string) {
  // Use only cardId for storage to share media across decks
  return {
    image: `cards/${cardId}/image.jpg`,
    audio: `cards/${cardId}/audio.mp3`,
    thumbnail: `cards/${cardId}/thumbnail.jpg`,
  };
}

/**
 * Generate storage keys based on the Chinese character and pinyin
 * Uses SHA256 hash to prevent predictable URLs while maintaining consistency
 * Always includes both hanzi and pinyin for consistent key generation
 */
export function generateMediaKeysByHanziPinyin(hanzi: string, pinyin: string) {
  // Always include both hanzi and pinyin in the hash
  const keyBase = `${hanzi}-${pinyin}`;
  
  // Create a hash of the key to prevent predictable URLs
  const hash = crypto.createHash('sha256').update(keyBase).digest('hex');
  
  // Use first 12 characters of hash for shorter paths
  const shortHash = hash.substring(0, 12);
  
  console.log(`🔑 Generating media keys for "${hanzi}" (${pinyin})`);
  console.log(`   Key base: ${keyBase}`);
  console.log(`   Full hash: ${hash}`);
  console.log(`   Short hash: ${shortHash}`);
  
  return {
    image: `media/shared/${shortHash}/image.jpg`,
    audio: `media/shared/${shortHash}/audio.mp3`,
    thumbnail: `media/shared/${shortHash}/thumbnail.jpg`,
  };
}

/**
 * Generate unique storage keys with random filenames for cache busting
 * This ensures that when we regenerate media, the browser will fetch the new version
 */
export function generateUniqueMediaKeys(hanzi: string, pinyin: string) {
  // Always include both hanzi and pinyin in the hash
  const keyBase = `${hanzi}-${pinyin}`;
  
  // Create a hash of the key to prevent predictable URLs
  const hash = crypto.createHash('sha256').update(keyBase).digest('hex');
  
  // Use first 12 characters of hash for shorter paths
  const shortHash = hash.substring(0, 12);
  
  // Generate random filenames using crypto.randomBytes
  const imageFilename = crypto.randomBytes(8).toString('hex');
  const audioFilename = crypto.randomBytes(8).toString('hex');
  
  console.log(`🔑 Generating unique media keys for "${hanzi}" (${pinyin})`);
  console.log(`   Base hash: ${shortHash}`);
  console.log(`   Image filename: ${imageFilename}.jpg`);
  console.log(`   Audio filename: ${audioFilename}.mp3`);
  
  return {
    image: `media/shared/${shortHash}/${imageFilename}.jpg`,
    audio: `media/shared/${shortHash}/${audioFilename}.mp3`,
    thumbnail: `media/shared/${shortHash}/thumb_${imageFilename}.jpg`,
  };
}

/**
 * Upload an image from a URL to R2
 */
export async function uploadImageFromUrl(
  url: string,
  key: string
): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return await uploadToR2(key, Buffer.from(buffer), {
      contentType,
      metadata: {
        sourceUrl: url,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error uploading image from URL:", error);
    throw new Error(`Failed to upload image from URL: ${error}`);
  }
}