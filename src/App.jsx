import React, { useState, useEffect, useCallback } from 'react';
import Chart from './components/Chart';
import TokenList from './components/TokenList';
import AddToken from './components/AddToken';
import { getAllTokens } from './data/tokens';
import { fetchAllTokensMarketCap, fetchTokenMarketCap, daysToApiParam, clearCache } from './api/coingecko';
import { getSavedTokens, saveTokens, mergeTokenPreferences } from './utils/storage';

export default function App() {
  const [tokens, setTokens] = useState(() => {
    const defaultTokens = getAllTokens();
    const saved = getSavedTokens();
    if (saved) {
      return mergeTokenPreferences(defaultTokens, saved);
    }
    return defaultTokens;
  });

  const [selectedRange, setSelectedRange] = useState(30);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState({ current: 0, total: 0, token: '' });
  const [error, setError] = useState(null);
  const [lastFetchedRange, setLastFetchedRange] = useState(null);

  // Fetch market cap data for enabled tokens only
  const fetchData = useCallback(async (days, onlyEnabled = true) => {
    setIsLoading(true);
    setError(null);

    try {
      const apiDays = daysToApiParam(days);
      // Only fetch enabled tokens that need data
      const tokensToFetch = tokens.filter(t => {
        const needsData = !t.data || t.data.length === 0 || lastFetchedRange !== days;
        return onlyEnabled ? (t.enabled && needsData) : needsData;
      });

      if (tokensToFetch.length === 0) {
        setIsLoading(false);
        return;
      }

      const results = await fetchAllTokensMarketCap(
        tokensToFetch,
        apiDays,
        (progress) => setLoadingProgress(progress)
      );

      // Merge results with existing tokens
      setTokens(prev => {
        const resultMap = new Map(results.map(r => [r.id, r]));
        return prev.map(token => {
          const result = resultMap.get(token.id);
          if (result && result.data && result.data.length > 0) {
            return { ...token, data: result.data, error: false };
          }
          return token;
        });
      });

      setLastFetchedRange(days);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tokens, lastFetchedRange]);

  // Fetch data on initial load and when range changes significantly
  useEffect(() => {
    // Only fetch enabled tokens that need data
    const enabledTokensNeedData = tokens.some(t =>
      t.enabled && (!t.data || t.data.length === 0)
    );
    const rangeIncreased = lastFetchedRange !== null && selectedRange > lastFetchedRange;

    if (enabledTokensNeedData || rangeIncreased || lastFetchedRange === null) {
      fetchData(selectedRange);
    }
  }, [selectedRange]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save token preferences when they change
  useEffect(() => {
    saveTokens(tokens);
  }, [tokens]);

  // Fetch data for a single token on-demand
  const fetchSingleToken = useCallback(async (token) => {
    setIsLoading(true);
    setLoadingProgress({ current: 1, total: 1, token: token.symbol });

    try {
      const apiDays = daysToApiParam(selectedRange);
      const result = await fetchTokenMarketCap(token, apiDays);

      if (result && result.data && result.data.length > 0) {
        setTokens(prev =>
          prev.map(t =>
            t.id === token.id
              ? { ...t, data: result.data, error: false }
              : t
          )
        );
      }
    } catch (err) {
      console.error(`Error fetching ${token.symbol}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange]);

  const handleToggleToken = (tokenId) => {
    const token = tokens.find(t => t.id === tokenId);
    const isEnabling = token && !token.enabled;
    const needsData = token && (!token.data || token.data.length === 0);

    setTokens(prev =>
      prev.map(t =>
        t.id === tokenId
          ? { ...t, enabled: !t.enabled }
          : t
      )
    );

    // Fetch data if enabling a token that doesn't have data yet
    if (isEnabling && needsData) {
      fetchSingleToken(token);
    }
  };

  const handleAddToken = (newToken) => {
    setTokens(prev => [...prev, newToken]);
  };

  const handleRemoveToken = (tokenId) => {
    setTokens(prev => prev.filter(t => t.id !== tokenId));
  };

  const handleRefresh = () => {
    clearCache();
    setLastFetchedRange(null);
    fetchData(selectedRange);
  };

  const handleRangeChange = (days) => {
    setSelectedRange(days);
    // If new range requires more data, fetch it
    if (days === 'max' || (lastFetchedRange !== 'max' && days > lastFetchedRange)) {
      fetchData(days);
    }
  };

  // Count tokens with data
  const tokensWithData = tokens.filter(t => t.data && t.data.length > 0).length;
  const enabledTokens = tokens.filter(t => t.enabled);

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <img src="/logo.png" alt="Jungle Bay Island" className="header-logo" />
          <h1>Jungle Bay Island</h1>
        </div>
      </header>

      <main className="main">
        {/* Loading indicator */}
        {isLoading && (
          <div className="loading-bar">
            <div className="loading-progress">
              Loading {loadingProgress.token}... ({loadingProgress.current}/{loadingProgress.total})
            </div>
            <div
              className="loading-fill"
              style={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
            />
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={handleRefresh}>Retry</button>
          </div>
        )}

        {/* Chart with integrated controls */}
        <Chart
          tokens={tokens}
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
        />

        {/* Status */}
        <div className="data-status">
          {tokensWithData}/{tokens.length} tokens loaded |
          {enabledTokens.length} displayed
          {isLoading && ' | Fetching data...'}
        </div>

        {/* Token list */}
        <TokenList
          tokens={tokens}
          onToggle={handleToggleToken}
          onRemove={handleRemoveToken}
        />
      </main>

      <footer className="footer">
        <p>Data from CoinGecko API | Updates every 5 minutes</p>
      </footer>

      <AddToken
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddToken}
        existingTokenIds={tokens.map(t => t.id)}
      />
    </div>
  );
}
