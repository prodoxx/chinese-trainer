/**
 * Audio trimming functionality stub
 * The actual implementation is in audio-trimmer-server.ts
 * This file exists to prevent webpack bundling issues
 */

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
  // In client-side or when ffmpeg is not available, return original audio
  console.warn('Audio trimming not available in this environment');
  return audioBuffer;
}

/**
 * Check if audio trimming is available
 */
export async function isTrimmingAvailable(): Promise<boolean> {
  // Audio trimming is only available on server-side
  return false;
}