import type { BCApiError } from '../types/api';
export class MockApiError extends Error implements BCApiError {
  constructor(public code: string, message: string, public status: number) {
    super(message); this.name = 'MockApiError';
  }
}
