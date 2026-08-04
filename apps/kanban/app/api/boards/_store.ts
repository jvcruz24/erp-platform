// apps/kanban/app/api/boards/_store.ts
import type { BoardSummary } from '@repo/kanban-domain';
import { mockBoardSummaries } from '@/app/data/mock-data';

// module-level array = survives across requests within the same dev
// server process (Next.js doesn't reload modules per-request). This is
// NOT a real database — restarting `next dev` resets it back to the
// mock seed data. Fine for this step; a real DB replaces this file later.
export const boardsStore: BoardSummary[] = [...mockBoardSummaries];
