/**
 * PeoplePicker — search and select a colleague for @mention.
 *
 * Team plan only. Uses Graph People API with 300ms debounce.
 * Shows max 5 results in a dropdown below the search input.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, User } from 'lucide-react';
import { searchPeople, type GraphUser } from '../services/graphPeople';
import type { FindingAssignee } from '@variscout/core';

interface PeoplePickerProps {
  /** Currently selected user (if any) */
  selected: FindingAssignee | null;
  /** Called when a user is selected */
  onSelect: (assignee: FindingAssignee) => void;
  /** Called when selection is cleared */
  onClear: () => void;
  /** Placeholder text */
  placeholder?: string;
}

const DEBOUNCE_MS = 300;

const PeoplePicker: React.FC<PeoplePickerProps> = ({
  selected,
  onSelect,
  onClear,
  placeholder = 'Search people...',
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GraphUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!value.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const people = await searchPeople(value);
        setResults(people);
        setShowDropdown(people.length > 0);
      } catch {
        setResults([]);
        setShowDropdown(false);
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const handleSelect = useCallback(
    (user: GraphUser) => {
      onSelect({
        upn: user.userPrincipalName,
        displayName: user.displayName,
        userId: user.id,
      });
      setQuery('');
      setResults([]);
      setShowDropdown(false);
    },
    [onSelect]
  );

  const handleClear = useCallback(() => {
    onClear();
    setQuery('');
    setResults([]);
    setShowDropdown(false);
  }, [onClear]);

  // Selected state: show chip
  if (selected) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 bg-blue-600/10 border border-blue-500/30 rounded-xl"
        data-testid="people-picker-selected"
      >
        <User size={16} className="text-blue-400 flex-none" />
        <span className="text-sm text-content font-medium truncate">{selected.displayName}</span>
        <button
          onClick={handleClear}
          className="ml-auto p-1 rounded-full hover:bg-surface-tertiary transition-colors"
          style={{ minWidth: 32, minHeight: 32 }}
          aria-label="Clear selection"
          data-testid="people-picker-clear"
        >
          <X size={14} className="text-content-secondary" />
        </button>
      </div>
    );
  }

  // Search state
  return (
    <div ref={containerRef} className="relative" data-testid="people-picker">
      <div className="flex items-center gap-2 px-3 py-2 bg-surface-secondary border border-edge rounded-xl focus-within:border-blue-500 transition-colors">
        <Search size={16} className="text-content-secondary flex-none" />
        <input
          type="text"
          value={query}
          onChange={e => handleSearch(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="flex-1 text-sm bg-transparent text-content placeholder:text-content-muted focus:outline-none"
          data-testid="people-picker-input"
        />
        {isLoading && (
          <div
            className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"
            data-testid="people-picker-loading"
          />
        )}
      </div>

      {/* Dropdown results */}
      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 bg-surface border border-edge rounded-xl shadow-lg overflow-hidden z-50"
          data-testid="people-picker-dropdown"
        >
          {results.map(user => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-surface-secondary transition-colors"
              style={{ minHeight: 44 }}
              data-testid={`people-picker-result-${user.id}`}
            >
              <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-none">
                <User size={14} className="text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-content truncate">{user.displayName}</div>
                <div className="text-xs text-content-secondary truncate">
                  {user.userPrincipalName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default PeoplePicker;
