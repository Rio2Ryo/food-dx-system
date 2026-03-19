// ============================================
// LIGHT SHARING TYPE DEFINITIONS
// ============================================

/**
 * Entry data structure (subset of WeeklyEntry for sharing)
 * This is defined first so other interfaces can reference it
 */
export interface EntryData {
  id: string;
  userId: string;
  year: number;
  week: number;
  dayOfWeek: number;
  hour: number;
  content: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Shared entry data structure - only includes entry data, images, and likes
 * No user contact information is shared
 */
export interface SharedEntryData {
  id: string;
  shareToken: string;
  entryId: string;
  sharedById: string;
  sharedByName?: string; // Optional - for display purposes
  sharedByAvatarUrl?: string; // Optional - for display purposes
  viewCount: number;
  expiresAt: string | null;
  createdAt: string;
  entry: EntryData;
  images: EntryImage[];
  likeCount: number;
  userHasLiked: boolean;
  shareUrl?: string;
}

/**
 * Entry data structure (subset of WeeklyEntry for sharing)
 */
export interface EntryData {
  id: string;
  userId: string;
  year: number;
  week: number;
  dayOfWeek: number;
  hour: number;
  content: string | null;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Image associated with an entry
 */
export interface EntryImage {
  id: string;
  entryId: string;
  imageUrl: string;
  sortOrder: number;
  createdAt: string;
}

/**
 * Like data structure
 */
export interface EntryLike {
  id: string;
  entryId: string;
  userId: string | null;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Response for creating a shared entry
 */
export interface CreateSharedEntryResponse {
  success: boolean;
  shareToken: string;
  sharedEntryId: string;
  shareUrl: string;
  expiresAt?: string;
  error?: string;
}

/**
 * Response for getting shared entry data
 */
export interface GetSharedEntryResponse {
  success: boolean;
  data?: SharedEntryData;
  error?: string;
  expired?: boolean;
  invalidToken?: boolean;
}

/**
 * Response for like/unlike action
 */
export interface LikeResponse {
  success: boolean;
  likeCount: number;
  userHasLiked: boolean;
  error?: string;
}

/**
 * Request body for creating a shared entry
 */
export interface CreateSharedEntryRequest {
  entryId: string;
  expiresAt?: string; // ISO date string for optional expiration
}

/**
 * Request body for like action
 */
export interface LikeRequest {
  entryId: string;
  ipAddress?: string;
}

/**
 * Shared entry with relations for database queries
 */
export interface SharedEntryWithRelations {
  id: string;
  shareToken: string;
  viewCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  entry: {
    id: string;
    userId: string;
    year: number;
    week: number;
    dayOfWeek: number;
    hour: number;
    content: string | null;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    images: {
      id: string;
      imageUrl: string;
      sortOrder: number;
      createdAt: Date;
    }[];
    likes: {
      id: string;
      userId: string | null;
      ipAddress: string | null;
      createdAt: Date;
    }[];
  };
  sharedBy: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
}

/**
 * Token validation result
 */
export interface TokenValidationResult {
  isValid: boolean;
  sharedEntry?: SharedEntryWithRelations;
  error?: string;
  expired?: boolean;
}
