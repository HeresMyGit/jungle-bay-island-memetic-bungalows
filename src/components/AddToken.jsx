import React, { useState } from 'react';
import { generateRandomColor } from '../utils/storage';
import { getTokenByContract, fetchTokenMarketCap } from '../api/coingecko';

const PLATFORMS = [
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'base', name: 'Base' },
  { id: 'solana', name: 'Solana' }
];

export default function AddToken({ isOpen, onClose, onAdd, existingTokenIds }) {
  const [contractAddress, setContractAddress] = useState('');
  const [platform, setPlatform] = useState('ethereum');
  const [customName, setCustomName] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contractAddress.trim()) {
      setError('Please enter a contract address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Try to fetch token info from CoinGecko
      const tokenInfo = await getTokenByContract(platform, contractAddress.trim());

      let tokenData;
      if (tokenInfo) {
        // Use CoinGecko data
        tokenData = {
          id: tokenInfo.id || `${platform}-${contractAddress.slice(0, 8)}`,
          symbol: tokenInfo.symbol?.toUpperCase() || customSymbol.toUpperCase() || 'UNKNOWN',
          name: tokenInfo.name || customName || 'Unknown Token',
          color: generateRandomColor(),
          platform,
          contract: contractAddress.trim(),
          enabled: true,
          isCustom: true
        };

        // Fetch market cap data
        const withData = await fetchTokenMarketCap(tokenData, 30);
        if (withData && withData.data) {
          tokenData.data = withData.data;
        }
      } else if (customName && customSymbol) {
        // Use custom data if CoinGecko doesn't have it
        tokenData = {
          id: `${platform}-${contractAddress.slice(0, 8)}`,
          symbol: customSymbol.toUpperCase(),
          name: customName,
          color: generateRandomColor(),
          platform,
          contract: contractAddress.trim(),
          enabled: true,
          isCustom: true,
          data: [] // No data available
        };
      } else {
        setError('Token not found on CoinGecko. Please enter name and symbol manually.');
        setIsLoading(false);
        return;
      }

      if (existingTokenIds.includes(tokenData.id)) {
        setError('This token is already in your list');
        setIsLoading(false);
        return;
      }

      onAdd(tokenData);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error adding token:', err);
      setError('Failed to fetch token data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setContractAddress('');
    setCustomName('');
    setCustomSymbol('');
    setPlatform('ethereum');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Token by Contract</h2>
          <button className="btn-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          <form onSubmit={handleSubmit} className="add-token-form">
            {/* Platform selector */}
            <div className="form-group">
              <label>Chain</label>
              <div className="platform-selector">
                {PLATFORMS.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`platform-btn ${platform === p.id ? 'active' : ''}`}
                    onClick={() => setPlatform(p.id)}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Contract address */}
            <div className="form-group">
              <label>Contract Address</label>
              <input
                type="text"
                placeholder="0x... or token address"
                value={contractAddress}
                onChange={e => setContractAddress(e.target.value)}
                className="search-input"
                autoFocus
              />
            </div>

            {/* Optional manual entry */}
            <div className="form-group optional">
              <label>Optional: Manual Entry (if not on CoinGecko)</label>
              <div className="manual-entry">
                <input
                  type="text"
                  placeholder="Token Name"
                  value={customName}
                  onChange={e => setCustomName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Symbol"
                  value={customSymbol}
                  onChange={e => setCustomSymbol(e.target.value)}
                  maxLength={10}
                />
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="form-error">{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="btn-primary btn-full"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Add Token'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
