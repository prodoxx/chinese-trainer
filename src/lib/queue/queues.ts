import { Queue } from 'bullmq';
import redis from './redis';

// Queue for image generation jobs
export const imageGenerationQueue = new Queue('image-generation', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50, // Keep last 50 failed jobs
    },
  },
});

// Queue for deck enrichment jobs
export const deckEnrichmentQueue = new Queue('deck-enrichment', {
  connection: redis,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: {
      count: 20,
    },
    removeOnFail: {
      count: 10,
    },
  },
});

// Queue for deck import jobs
export const deckImportQueue = new Queue('deck-import', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: {
      count: 20,
    },
    removeOnFail: {
      count: 10,
    },
  },
});

export interface ImageGenerationJobData {
  cardId: string;
  hanzi: string;
  meaning: string;
  pinyin: string;
  deckId: string;
  sessionId: string; // For SSE updates
}

export interface DeckEnrichmentJobData {
  deckId: string;
  deckName: string;
  sessionId: string;
  force?: boolean;
}

export interface DeckImportJobData {
  deckId: string;
  deckName: string;
  hanziList: string[];
  sessionId: string;
}