/**
 * Server-side only audio trimming functionality
 * This file should only be imported in server-side code (API routes, workers)
 */

import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

// Only import ffmpeg on server-side
const isServer = typeof window === 'undefined';

let ffmpeg: any = null;
let ffmpegPath: string | null = null;

async function initFFmpeg() {
  if (!isServer) {
    return null;
  }

  if (!ffmpeg) {
    try {
      // Dynamic imports to avoid webpack bundling issues
      const ffmpegModule = await eval(`import('fluent-ffmpeg')`);
      const installerModule = await eval(`import('@ffmpeg-installer/ffmpeg')`);
      
      ffmpeg = ffmpegModule.default;
      ffmpegPath = installerModule.path;
      ffmpeg.setFfmpegPath(ffmpegPath);
    } catch (error) {
      console.warn('FFmpeg not available:', error);
      ffmpeg = null;
    }
  }
  return ffmpeg;
}

/**
 * Trim audio buffer to specified duration
 * @param audioBuffer - The input audio buffer
 * @param trimStart - Start time in milliseconds
 * @param trimDuration - Duration in milliseconds
 * @param format - Audio format (default: mp3)
 * @returns Trimmed audio buffer
 */
export async function trimAudioBuffer(
  audioBuffer: Buffer,
  trimStart: number,
  trimDuration: number,
  format: string = 'mp3'
): Promise<Buffer> {
  // Initialize ffmpeg
  const ffmpegLib = await initFFmpeg();
  if (!ffmpegLib) {
    console.warn('FFmpeg not available, returning original audio');
    return audioBuffer;
  }

  // Create temporary files
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'audio-trim-'));
  const inputPath = path.join(tempDir, `input.${format}`);
  const outputPath = path.join(tempDir, `output.${format}`);

  try {
    // Write input buffer to file
    await fs.writeFile(inputPath, audioBuffer);

    // Convert milliseconds to seconds for ffmpeg
    const startSeconds = trimStart / 1000;
    const durationSeconds = trimDuration / 1000;

    // Create promise for ffmpeg processing
    await new Promise<void>((resolve, reject) => {
      ffmpegLib(inputPath)
        .setStartTime(startSeconds)
        .setDuration(durationSeconds)
        .output(outputPath)
        .outputFormat(format)
        // Keep the same audio quality
        .audioCodec('copy')
        .on('end', () => {
          console.log(`   ✓ Audio trimmed: ${trimStart}ms - ${trimStart + trimDuration}ms`);
          resolve();
        })
        .on('error', (err: any) => {
          console.error('FFmpeg error:', err);
          reject(err);
        })
        .run();
    });

    // Read the trimmed audio
    const trimmedBuffer = await fs.readFile(outputPath);
    return trimmedBuffer;
  } finally {
    // Clean up temporary files
    try {
      await fs.unlink(inputPath);
      await fs.unlink(outputPath);
      await fs.rmdir(tempDir);
    } catch (cleanupError) {
      console.warn('Failed to clean up temp files:', cleanupError);
    }
  }
}

/**
 * Check if audio trimming is available
 */
export async function isTrimmingAvailable(): Promise<boolean> {
  if (!isServer) {
    return false;
  }

  try {
    const ffmpegLib = await initFFmpeg();
    if (!ffmpegLib) {
      return false;
    }
    
    return new Promise((resolve) => {
      ffmpegLib.getAvailableFormats((err: any, formats: any) => {
        if (err) {
          console.warn('FFmpeg not available:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.warn('Failed to check FFmpeg availability:', error);
    return false;
  }
}