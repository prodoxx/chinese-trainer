import { Queue } from 'bullmq';
import getRedis from './redis';

// Lazy-initialize queues
let _deckEnrichmentQueue: Queue | null = null;
let _deckImportQueue: Queue | null = null;
let _cardEnrichmentQueue: Queue | null = null;
let _bulkImportQueue: Queue | null = null;

// Queue for deck enrichment jobs
export function getDeckEnrichmentQueue(): Queue {
  if (!_deckEnrichmentQueue) {
    _deckEnrichmentQueue = new Queue('deck-enrichment', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 3000, // Start with 3 second delay for deck enrichment
        },
        removeOnComplete: {
          count: 20,
        },
        removeOnFail: {
          count: 10,
        },
      },
    });
  }
  return _deckEnrichmentQueue;
}

// Queue for deck import jobs
export function getDeckImportQueue(): Queue {
  if (!_deckImportQueue) {
    _deckImportQueue = new Queue('deck-import', {
      connection: getRedis(),
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
  }
  return _deckImportQueue;
}

// Queue for single card enrichment jobs
export function getCardEnrichmentQueue(): Queue {
  if (!_cardEnrichmentQueue) {
    _cardEnrichmentQueue = new Queue('card-enrichment', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000, // Start with 2 second delay
        },
        removeOnComplete: {
          count: 50,
        },
        removeOnFail: {
          count: 20,
        },
      },
    });
  }
  return _cardEnrichmentQueue;
}

// Queue for bulk card import jobs
export function getBulkImportQueue(): Queue {
  if (!_bulkImportQueue) {
    _bulkImportQueue = new Queue('bulk-import', {
      connection: getRedis(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // Start with 5 second delay for bulk operations
        },
        removeOnComplete: {
          count: 100, // Keep more history for bulk operations
        },
        removeOnFail: {
          count: 50,
        },
      },
    });
  }
  return _bulkImportQueue;
}

// Export getters with the same names for compatibility
export const deckEnrichmentQueue = getDeckEnrichmentQueue;
export const deckImportQueue = getDeckImportQueue;
export const cardEnrichmentQueue = getCardEnrichmentQueue;
export const bulkImportQueue = getBulkImportQueue;

export interface DeckEnrichmentJobData {
  deckId: string;
  userId: string;
  deckName: string;
  sessionId: string;
  force?: boolean;
  aiProvider?: 'openai';
}

export interface DeckImportJobData {
  deckId: string;
  userId: string;
  deckName: string;
  hanziList: string[];
  sessionId: string;
  disambiguationSelections?: Record<string, { pinyin: string; meaning: string }>;
}

export interface CardEnrichmentJobData {
  cardId: string;
  userId: string;
  deckId: string;
  force: boolean;
  disambiguationSelection?: { pinyin: string; meaning: string };
  aiProvider?: 'openai';
}

export interface BulkImportJobData {
  characters: string[];
  userId: string;
  sessionId: string;
  enrichImmediately: boolean;
  aiProvider?: 'openai';
}