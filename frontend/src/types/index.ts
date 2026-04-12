/** SportShield AI — TypeScript interfaces for the entire application */

// ─── User & Auth ────────────────────────────────
export interface User {
  id: string;
  org_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst' | 'viewer';
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  org_name: string;
}

// ─── Assets ─────────────────────────────────────
export interface MediaAsset {
  id: string;
  org_id: string;
  uploaded_by: string;
  name: string;
  description: string | null;
  tags: string[];
  file_type: 'image' | 'video';
  mime_type: string;
  file_size_bytes: number;
  storage_url: string;
  phash: string | null;
  dhash: string | null;
  faiss_index_id: number | null;
  fingerprint_status: 'pending' | 'processing' | 'indexed' | 'failed';
  last_scan_at: string | null;
  scan_count: number;
  violation_count: number;
  created_at: string;
  updated_at: string;
}

export interface AssetListResponse {
  items: MediaAsset[];
  total: number;
  page: number;
  limit: number;
}

// ─── Violations ─────────────────────────────────
export interface Violation {
  id: string;
  org_id: string;
  asset_id: string;
  detected_url: string;
  platform: 'google' | 'bing' | 'twitter' | 'youtube' | 'web' | 'unknown';
  thumbnail_url: string | null;
  screenshot_url: string | null;
  phash_distance: number | null;
  cnn_similarity: number | null;
  confidence_score: number;
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'reviewed' | 'flagged' | 'dismissed';
  detected_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  asset_name?: string;
}

export interface ViolationListResponse {
  items: Violation[];
  total: number;
  page: number;
  limit: number;
}

// ─── Alerts ─────────────────────────────────────
export interface Alert {
  id: string;
  org_id: string;
  violation_id: string;
  alert_type: 'email' | 'webhook' | 'websocket';
  recipient: string | null;
  sent_at: string;
  is_read: boolean;
  metadata_json: Record<string, any> | null;
}

export interface AlertListResponse {
  items: Alert[];
  total: number;
  page: number;
  limit: number;
}

// ─── Analytics ──────────────────────────────────
export interface DashboardStats {
  total_assets: number;
  total_violations: number;
  active_violations: number;
  resolved_this_week: number;
  scans_today: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface TrendsResponse {
  data: TrendPoint[];
}

export interface PlatformBreakdown {
  platform: string;
  count: number;
}

export interface PlatformResponse {
  data: PlatformBreakdown[];
}

export interface SeverityBreakdown {
  severity: string;
  count: number;
}

export interface SeverityResponse {
  data: SeverityBreakdown[];
}

// ─── Shared ─────────────────────────────────────
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ApiError {
  detail: string;
}
