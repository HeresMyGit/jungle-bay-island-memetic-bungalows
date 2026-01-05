import React, { useState } from 'react';

export default function TokenList({ tokens, onToggle, onRemove }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const enabledCount = tokens.filter(t => t.enabled).length;

  const handleSelectAll = () => {
    tokens.forEach(token => {
      if (!token.enabled) {
        onToggle(token.id);
      }
    });
  };

  const handleDeselectAll = () => {
    tokens.forEach(token => {
      if (token.enabled) {
        onToggle(token.id);
      }
    });
  };

  return (
    <div className={`token-list ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div
        className="token-list-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="token-header-left">
          <span className="token-expand-icon">{isExpanded ? '▼' : '▶'}</span>
          <span className="token-count">Tokens {enabledCount}/{tokens.length}</span>
        </div>
        <div className="token-list-actions" onClick={e => e.stopPropagation()}>
          <button onClick={handleSelectAll} className="btn-small">
            All
          </button>
          <button onClick={handleDeselectAll} className="btn-small">
            None
          </button>
        </div>
      </div>
      <div className="token-grid">
        {tokens.map(token => (
          <div
            key={token.id}
            className={`token-item ${token.enabled ? 'enabled' : 'disabled'}`}
            onClick={() => onToggle(token.id)}
          >
            <div
              className="token-color"
              style={{ backgroundColor: token.color }}
            />
            <span className="token-symbol">{token.symbol}</span>
            {token.isCustom && (
              <button
                className="btn-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(token.id);
                }}
                title="Remove token"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
