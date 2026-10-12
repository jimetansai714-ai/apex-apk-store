import { APKApp, AppReview } from '../types';

// Catalog starts completely clean without mock data so user can test uploading real APKs
export const INITIAL_APPS: APKApp[] = [];

export const MOCK_REVIEWS: Record<string, AppReview[]> = {};
