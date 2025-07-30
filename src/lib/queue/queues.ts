import { Queue } from 'bullmq';
import redis from './redis';

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

// Queue for single card enrichment jobs
export const cardEnrichmentQueue = new Queue('card-enrichment', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    removeOnComplete: {
      count: 50,
    },
    removeOnFail: {
      count: 20,
    },
  },
});

export interface DeckEnrichmentJobData {
  deckId: string;
  userId: string;
  deckName: string;
  sessionId: string;
  force?: boolean;
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
}