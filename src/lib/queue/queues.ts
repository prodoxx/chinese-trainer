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