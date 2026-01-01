// React hook for LLM chat functionality
import { useState, useCallback } from 'react';
import {
  chatWithConfigExtraction,
  getLLMConfig,
  saveLLMConfig,
  LLMConfig,
  ToolRecommendation,
  ExtractedConfig,
} from '../services/llmService';

export interface ChatEntry {
  id: string;
  query: string;
  response: string;
  recommendations: ToolRecommendation[];
  extractedConfigs: Map<string, ExtractedConfig>;
  timestamp: Date;
}

export interface UseLLMReturn {
  // State
  history: ChatEntry[];
  isLoading: boolean;
  error: string | null;
  config: LLMConfig;

  // Actions
  sendMessage: (query: string) => Promise<void>;
  clearHistory: () => void;
  updateConfig: (config: LLMConfig) => void;
  getExtractedConfig: (toolId: string) => ExtractedConfig | undefined;
}

export function useLLM(): UseLLMReturn {
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<LLMConfig>(getLLMConfig);

  const sendMessage = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await chatWithConfigExtraction(query, config);

      const entry: ChatEntry = {
        id: Date.now().toString(),
        query,
        response: result.response,
        recommendations: result.recommendations,
        extractedConfigs: result.extractedConfigs,
        timestamp: new Date(),
      };

      setHistory(prev => [...prev, entry]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [config]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setError(null);
  }, []);

  const updateConfig = useCallback((newConfig: LLMConfig) => {
    setConfig(newConfig);
    saveLLMConfig(newConfig);
  }, []);

  // Get extracted config for a specific tool from the latest history entry
  const getExtractedConfig = useCallback((toolId: string): ExtractedConfig | undefined => {
    // Search history from newest to oldest
    for (let i = history.length - 1; i >= 0; i--) {
      const extracted = history[i].extractedConfigs.get(toolId);
      if (extracted && Object.keys(extracted).length > 0) {
        return extracted;
      }
    }
    return undefined;
  }, [history]);

  return {
    history,
    isLoading,
    error,
    config,
    sendMessage,
    clearHistory,
    updateConfig,
    getExtractedConfig,
  };
}
