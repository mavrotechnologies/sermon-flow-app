/**
 * Knowledge Base Detector
 *
 * Searches the Biblical Knowledge Base for contextual scripture references.
 * Matches characters, stories, places, and concepts mentioned in sermon text.
 */

import { BIBLICAL_KNOWLEDGE_BASE, type BiblicalEntity } from './biblicalKnowledgeBase';

export interface KnowledgeBaseMatch {
  entity: BiblicalEntity;
  score: number;
  confidence: 'high' | 'medium' | 'low';
  matchedTrigger: string;
  contextWordsMatched: string[];
}

/**
 * Normalize text for matching: lowercase, remove punctuation, collapse whitespace
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['']/g, '')        // Remove apostrophes
    .replace(/[^\w\s]/g, ' ')    // Replace punctuation with space
    .replace(/\s+/g, ' ')        // Collapse whitespace
    .trim();
}

/**
 * Search the knowledge base for matches in the given text
 *
 * @param text - The sermon transcript text to search
 * @param minScore - Minimum score to return (default: 7)
 * @returns Array of matches sorted by score (highest first)
 */
export function searchKnowledgeBase(text: string, minScore: number = 7): KnowledgeBaseMatch[] {
  if (!text || text.length < 5) return [];

  const normalizedText = normalizeText(text);
  const matches: KnowledgeBaseMatch[] = [];

  for (const entity of BIBLICAL_KNOWLEDGE_BASE) {
    let score = 0;
    let bestTrigger = '';
    const contextWordsMatched: string[] = [];

    // Check triggers (primary signal)
    for (const trigger of entity.triggers) {
      const normalizedTrigger = normalizeText(trigger);
      if (normalizedText.includes(normalizedTrigger)) {
        // Longer triggers are more specific = higher confidence
        const triggerScore = 10 + Math.min(normalizedTrigger.split(' ').length, 5);
        if (triggerScore > score) {
          score = triggerScore;
          bestTrigger = trigger;
        }
      }
    }

    // If no trigger matched, skip this entity
    if (score === 0) continue;

    // Check context words (boost signal)
    for (const contextWord of entity.contextWords) {
      const normalizedContext = normalizeText(contextWord);
      if (normalizedText.includes(normalizedContext)) {
        score += 2;
        contextWordsMatched.push(contextWord);
      }
    }

    // For ambiguous entities, require at least one context word
    if (entity.ambiguous && contextWordsMatched.length === 0) {
      continue;
    }

    // Determine confidence
    let confidence: 'high' | 'medium' | 'low';
    if (score >= 15) {
      confidence = 'high';
    } else if (score >= 10) {
      confidence = 'medium';
    } else {
      confidence = 'low';
    }

    if (score >= minScore) {
      matches.push({
        entity,
        score,
        confidence,
        matchedTrigger: bestTrigger,
        contextWordsMatched,
      });
    }
  }

  // Sort by score descending, cap at 5 results
  return matches.sort((a, b) => b.score - a.score).slice(0, 5);
}
