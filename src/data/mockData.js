// Time constants and utility functions for chart data

export const TIME_RANGES = [
  { label: '1d', days: 1 },
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: 'max', days: 'max' }
];

const DAY = 24 * 60 * 60 * 1000;

// Filter data by time range
export function filterDataByRange(data, days) {
  if (!data || data.length === 0) return [];
  if (days === null || days === 'max') return data;

  const cutoff = Date.now() - (days * DAY);
  return data.filter(point => point.x >= cutoff);
}

// Format market cap for display (handles all sizes)
export function formatMarketCap(value) {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
}

// Format for axis labels (more compact)
export function formatAxisLabel(value) {
  if (value === null || value === undefined) return '';
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return value.toFixed(0);
}

// Generate placeholder data for tokens while loading
export function generatePlaceholderData(days = 30) {
  const data = [];
  const now = Date.now();
  const interval = (days * DAY) / 100; // 100 data points

  for (let i = 0; i < 100; i++) {
    data.push({
      x: now - (days * DAY) + (i * interval),
      y: 0
    });
  }

  return data;
}
