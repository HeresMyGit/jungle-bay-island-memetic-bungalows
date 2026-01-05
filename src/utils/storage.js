const STORAGE_KEY = 'casavarse_tokens_v5'; // v5: GeckoTerminal API

// Get saved token preferences from localStorage
export function getSavedTokens() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Failed to load saved tokens:', e);
  }
  return null;
}

// Save token preferences to localStorage
export function saveTokens(tokens) {
  try {
    // Only save the token configs, not the full data
    const toSave = tokens.map(t => ({
      id: t.id,
      symbol: t.symbol,
      name: t.name,
      color: t.color,
      enabled: t.enabled,
      isCustom: t.isCustom || false
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('Failed to save tokens:', e);
  }
}

// Merge saved preferences with default/current tokens
export function mergeTokenPreferences(tokens, savedPrefs) {
  if (!savedPrefs) return tokens;

  const prefsMap = new Map(savedPrefs.map(p => [p.id, p]));

  return tokens.map(token => {
    const pref = prefsMap.get(token.id);
    if (pref) {
      return { ...token, enabled: pref.enabled };
    }
    return token;
  });
}

// Generate a random color for custom tokens
export function generateRandomColor() {
  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#7BC225', '#E91E63'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
