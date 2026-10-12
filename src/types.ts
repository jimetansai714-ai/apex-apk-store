export type AppCategory = 
  | 'all'
  | 'games'
  | 'tools'
  | 'social'
  | 'entertainment'
  | 'productivity'
  | 'photography'
  | 'myanmar';

export interface AppReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  helpfulCount: number;
}

export interface DownloadAuditLog {
  id: string;
  appId: string;
  appName: string;
  timestamp: string; // Readable ISO string
  unixTime: number;
  sessionId: string;
  deviceType: string;
  browser: string;
  os: string;
  screen?: string;
  isUnique: boolean;
  version: string;
  source?: string;
}

export interface APKApp {
  id: string;
  name: string;
  nameMy?: string;
  packageName: string;
  developer: string;
  category: AppCategory;
  categoryName: string;
  rating: number;
  ratingsCount: number;
  downloads: string;
  downloadCount: number;
  uniqueDownloads?: number;
  lastDownloadAt?: string;
  size: string;
  version: string;
  minAndroid: string;
  sha256: string;
  shortDescription: string;
  shortDescriptionMy?: string;
  description: string;
  descriptionMy?: string;
  changelog: string;
  changelogMy?: string;
  iconBg: string; // Gradient or solid bg for styled icon
  iconSvgType: 'game' | 'tool' | 'chat' | 'music' | 'camera' | 'book' | 'globe' | 'code' | 'wallet' | 'shield';
  bannerBg: string;
  bannerTagline: string;
  screenshots: string[];
  permissions: string[];
  uploadedAt: string;
  isVerified: boolean;
  isEditorChoice?: boolean;
  isNew?: boolean;
  customUploaded?: boolean;
  downloadUrl?: string;
  githubReleaseUrl?: string;
  iconUrl?: string;
  versionHistory?: {
    version: string;
    date: string;
    size?: string;
    changelog?: string;
    downloadUrl?: string;
  }[];
}

export type Language = 'en' | 'my';
