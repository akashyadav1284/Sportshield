export interface Asset {
  id: string;
  name: string;
  type: 'Video' | 'Image' | 'Audio' | 'Document';
  threatScore: number;
  scanFrequency: 'real-time' | 'hourly' | 'daily' | 'weekly';
  status: 'protected' | 'vulnerable';
  totalViolations: number;
}

export interface Violation {
  id: string;
  assetId: string;
  platform: 'YouTube' | 'Twitter' | 'TikTok' | 'Instagram' | 'Web';
  severity: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'Resolved' | 'Escalated';
  dateDetected: string;
  views: number;
  url: string;
  revenueImpact: number;
}

export const mockAssets: Asset[] = [
  { id: 'a1', name: 'Champions League Final Highlights', type: 'Video', threatScore: 87, scanFrequency: 'hourly', status: 'vulnerable', totalViolations: 12 },
  { id: 'a2', name: 'Premier League Match Day 12', type: 'Video', threatScore: 65, scanFrequency: 'hourly', status: 'vulnerable', totalViolations: 5 },
  { id: 'a3', name: 'Official Team Jersey Launch 2026', type: 'Image', threatScore: 42, scanFrequency: 'daily', status: 'protected', totalViolations: 2 },
  { id: 'a4', name: 'Exclusive Player Interview - Messi', type: 'Video', threatScore: 92, scanFrequency: 'real-time', status: 'vulnerable', totalViolations: 18 },
  { id: 'a5', name: 'Stadium Branding Graphics', type: 'Image', threatScore: 15, scanFrequency: 'weekly', status: 'protected', totalViolations: 0 },
  { id: 'a6', name: 'World Cup Qualifier Promo', type: 'Video', threatScore: 78, scanFrequency: 'real-time', status: 'protected', totalViolations: 8 },
  { id: 'a7', name: 'Club Anthem Audio Track', type: 'Audio', threatScore: 34, scanFrequency: 'daily', status: 'protected', totalViolations: 3 },
];

// Helper to generate dates relative to today
const getPastDate = (daysAgo: number) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};

export const mockViolations: Violation[] = [
  // High Severity - YouTube
  { id: 'v1', assetId: 'a1', platform: 'YouTube', severity: 'High', status: 'Pending', dateDetected: getPastDate(1), views: 45000, url: 'https://youtube.com/watch?v=123', revenueImpact: 450 },
  { id: 'v2', assetId: 'a1', platform: 'YouTube', severity: 'High', status: 'Pending', dateDetected: getPastDate(2), views: 32000, url: 'https://youtube.com/watch?v=456', revenueImpact: 320 },
  { id: 'v3', assetId: 'a4', platform: 'YouTube', severity: 'High', status: 'Escalated', dateDetected: getPastDate(0), views: 89000, url: 'https://youtube.com/watch?v=789', revenueImpact: 890 },
  { id: 'v4', assetId: 'a6', platform: 'YouTube', severity: 'High', status: 'Resolved', dateDetected: getPastDate(5), views: 120000, url: 'https://youtube.com/watch?v=012', revenueImpact: 1200 },
  
  // Medium Severity - Twitter/TikTok
  { id: 'v5', assetId: 'a1', platform: 'Twitter', severity: 'Medium', status: 'Pending', dateDetected: getPastDate(1), views: 15000, url: 'https://twitter.com/user/status/123', revenueImpact: 75 },
  { id: 'v6', assetId: 'a2', platform: 'TikTok', severity: 'Medium', status: 'Pending', dateDetected: getPastDate(3), views: 22000, url: 'https://tiktok.com/@user/video/123', revenueImpact: 110 },
  { id: 'v7', assetId: 'a4', platform: 'Twitter', severity: 'Medium', status: 'Resolved', dateDetected: getPastDate(4), views: 5000, url: 'https://twitter.com/user/status/456', revenueImpact: 25 },
  
  // Low Severity - Instagram/Web
  { id: 'v8', assetId: 'a3', platform: 'Instagram', severity: 'Low', status: 'Pending', dateDetected: getPastDate(0), views: 800, url: 'https://instagram.com/p/123', revenueImpact: 4 },
  { id: 'v9', assetId: 'a2', platform: 'Web', severity: 'Low', status: 'Pending', dateDetected: getPastDate(2), views: 300, url: 'https://sportsblog.com/post', revenueImpact: 1.5 },
  { id: 'v10', assetId: 'a7', platform: 'TikTok', severity: 'Low', status: 'Resolved', dateDetected: getPastDate(6), views: 4000, url: 'https://tiktok.com/@user/video/456', revenueImpact: 20 },
];

export const platformStats = {
  totalProtected: 15,
  activeScans: 85,
  resolutionRate: 65, // percentage
  estimatedSavedRevenue: 12500,
};
