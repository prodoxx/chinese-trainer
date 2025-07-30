import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";

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
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

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
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: options.contentType,
      Metadata: options.metadata,
      // Disable automatic checksum for R2 compatibility
      ChecksumAlgorithm: undefined,
    });

    await r2Client.send(command);
    
    // Return the public URL
    return `${PUBLIC_URL}/${key}`;
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
    const upload = new Upload({
      client: r2Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: options.contentType,
        Metadata: options.metadata,
        // Disable automatic checksum for R2 compatibility
        ChecksumAlgorithm: undefined,
      },
    });

    await upload.done();
    
    return `${PUBLIC_URL}/${key}`;
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
    const stream = response.Body as ReadableStream;
    
    // Convert stream to buffer
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
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
 * Generate storage keys based on the Chinese character
 * This ensures maximum reuse across all cards with the same hanzi
 */
export function generateMediaKeysByHanzi(hanzi: string) {
  // Encode the hanzi to ensure valid URL paths
  const encodedHanzi = encodeURIComponent(hanzi);
  return {
    image: `media/hanzi/${encodedHanzi}/image.jpg`,
    audio: `media/hanzi/${encodedHanzi}/audio.mp3`,
    thumbnail: `media/hanzi/${encodedHanzi}/thumbnail.jpg`,
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