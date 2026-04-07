// MultiSelect Component
// Reusable multi-select with search, chips, and debounced API fetching

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { targetingApi } from '../api/targeting';

const MultiSelect = ({
  type = 'products', // 'products' | 'collections' | 'tags'
  selectedItems = [],
  onChange,
  placeholder = 'Search...',
  maxItems = null,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Fetch data based on type
  const fetchData = useCallback(async (query) => {
    setIsLoading(true);
    try {
      let data = [];
      switch (type) {
        case 'products':
          data = await targetingApi.searchProducts(query);
          break;
        case 'collections':
          data = await targetingApi.getCollections();
          if (query) {
            data = data.filter(c => c.name.toLowerCase().includes(query.toLowerCase()));
          }
          break;
        case 'tags':
          data = await targetingApi.getCustomerTags();
          if (query) {
            data = data.filter(t => t.toLowerCase().includes(query.toLowerCase()));
          }
          break;
        default:
          data = [];
      }
      setResults(data);
    } catch (error) {
      console.error(`Error fetching ${type}:`, error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  // Initial fetch
  useEffect(() => {
    if (isOpen && results.length === 0) {
      fetchData('');
    }
  }, [isOpen, fetchData, results.length]);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      if (isOpen && searchTerm) {
        fetchData(searchTerm);
      } else if (isOpen && !searchTerm) {
        fetchData('');
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, isOpen, fetchData]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item) => {
    const itemId = type === 'tags' ? item : item.id || item;
    const itemName = type === 'tags' ? item : item.name;
    const isSelected = selectedItems.some(s => (type === 'tags' ? s : s.id) === itemId);

    if (isSelected) {
      onChange(selectedItems.filter(s => (type === 'tags' ? s : s.id) !== itemId));
    } else {
      if (maxItems && selectedItems.length >= maxItems) {
        return;
      }
      const newItem = type === 'tags' ? itemName : { id: itemId, name: itemName, image: item.image };
      onChange([...selectedItems, newItem]);
    }
  };

  const handleRemove = (item) => {
    const itemId = type === 'tags' ? item : item.id;
    onChange(selectedItems.filter(s => (type === 'tags' ? s : s.id) !== itemId));
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown') {
        setIsOpen(true);
        setHighlightedIndex(-1);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const getItemId = (item) => {
    return type === 'tags' ? item : (item.id || item);
  };

  const getItemName = (item) => {
    return type === 'tags' ? item : item.name;
  };

  const isItemSelected = (item) => {
    return selectedItems.some(s => getItemId(s) === getItemId(item));
  };

  return (
    <div className="multi-select" ref={dropdownRef}>
      {/* Selected items as chips */}
      {selectedItems.length > 0 && (
        <div className="chips-container" style={{ marginBottom: '12px' }}>
          {selectedItems.map(item => (
            <span key={getItemId(item)} className="chip">
              {type !== 'tags' && item.image && (
                <img src={item.image} alt="" style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} />
              )}
              {getItemName(item)}
              <button onClick={() => handleRemove(item)} type="button">×</button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="multi-select-input-wrapper">
        <input
          ref={inputRef}
          type="text"
          className="form-input"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          style={{ paddingRight: '40px' }}
        />
        {isLoading && (
          <div className="multi-select-spinner">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && (
        <div className="multi-select-dropdown">
          {results.length === 0 && !isLoading ? (
            <div className="multi-select-empty">
              {searchTerm ? `No ${type} found` : `No ${type} available`}
            </div>
          ) : (
            results.map((item, index) => (
              <div
                key={getItemId(item)}
                className={`multi-select-item ${isItemSelected(item) ? 'selected' : ''} ${index === highlightedIndex ? 'highlighted' : ''}`}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                {type !== 'tags' && item.image && (
                  <img src={item.image} alt="" className="multi-select-item-image" />
                )}
                {type === 'tags' && (
                  <span className="multi-select-tag-icon">#</span>
                )}
                <span className="multi-select-item-name">{getItemName(item)}</span>
                {type !== 'tags' && item.price && (
                  <span className="multi-select-item-price">${item.price.toFixed(2)}</span>
                )}
                {isItemSelected(item) && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#008060" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .multi-select {
          position: relative;
        }
        .multi-select-input-wrapper {
          position: relative;
        }
        .multi-select-spinner {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #6D7175;
        }
        .multi-select-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid #E4E4E7;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          max-height: 240px;
          overflow-y: auto;
          z-index: 1000;
        }
        .multi-select-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          cursor: pointer;
          transition: background 0.1s;
        }
        .multi-select-item:hover,
        .multi-select-item.highlighted {
          background: #F6F6F7;
        }
        .multi-select-item.selected {
          background: rgba(92, 106, 196, 0.05);
        }
        .multi-select-item-image {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          background: #F6F6F7;
        }
        .multi-select-tag-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(92, 106, 196, 0.1);
          color: #5C6AC4;
          border-radius: 4px;
          font-weight: 600;
          font-size: 12px;
        }
        .multi-select-item-name {
          flex: 1;
          font-size: 14px;
          color: #202223;
        }
        .multi-select-item-price {
          font-size: 13px;
          color: #6D7175;
        }
        .multi-select-empty {
          padding: 20px;
          text-align: center;
          color: #6D7175;
          font-size: 14px;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default MultiSelect;
