'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  initializeSemanticSearch,
  searchBibleVerses,
  isSemanticSearchReady,
  SemanticMatch,
} from '@/lib/semanticSearch';

interface UseSemanticSearchResult {
  isReady: boolean;
  isLoading: boolean;
  isSearching: boolean;
  loadingProgress: string;
  error: string | null;
  matches: SemanticMatch[];
  search: (text: string) => Promise<SemanticMatch[]>;
  initialize: () => Promise<void>;
}

/**
 * Hook for semantic Bible verse search
 * Handles model loading, search, and state management
 */
export function useSemanticSearch(): UseSemanticSearchResult {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<SemanticMatch[]>([]);

  // Debounce search to avoid overwhelming the model
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');

  /**
   * Initialize the semantic search model
   */
  const initialize = useCallback(async () => {
    if (isReady || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      await initializeSemanticSearch((progress) => {
        setLoadingProgress(progress);
      });

      setIsReady(isSemanticSearchReady());
      setLoadingProgress('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to initialize';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isReady, isLoading]);

  /**
   * Search for semantically similar verses
   * Accumulates unique matches instead of replacing
   */
  const search = useCallback(async (text: string): Promise<SemanticMatch[]> => {
    if (!isReady) {
      console.warn('Semantic search not ready');
      return [];
    }

    // Skip if same as last search
    if (text === lastSearchRef.current) {
      return matches;
    }

    // Skip short text
    if (text.trim().length < 20) {
      return [];
    }

    lastSearchRef.current = text;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    return new Promise((resolve) => {
      // Debounce by 500ms
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);

        try {
          const results = await searchBibleVerses(text, 3, 'medium');

          // Accumulate unique matches (by book+chapter+verse)
          setMatches(prev => {
            const newMatches = [...prev];
            for (const result of results) {
              const key = `${result.book}-${result.chapter}-${result.verse}`;
              const existingIndex = newMatches.findIndex(
                m => `${m.book}-${m.chapter}-${m.verse}` === key
              );

              if (existingIndex === -1) {
                // Add new match
                newMatches.unshift(result); // Add to top
              } else if (result.similarity > newMatches[existingIndex].similarity) {
                // Update if higher confidence
                newMatches[existingIndex] = result;
              }
            }
            // Keep only top 20 matches
            return newMatches.slice(0, 20);
          });

          resolve(results);
        } catch (err) {
          console.error('Search error:', err);
          resolve([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
    });
  }, [isReady, matches]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    isReady,
    isLoading,
    isSearching,
    loadingProgress,
    error,
    matches,
    search,
    initialize,
  };
}
