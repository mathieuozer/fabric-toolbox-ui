// React hook for AI Infrastructure Builder
import { useState, useCallback, useRef } from 'react';
import {
  InfraMessage,
  ConversationState,
  ScriptFormat,
  InfraConfig,
  getInitialGreeting,
  createInitialState,
  processInfraMessage,
  generateScript,
  getScriptFilename,
} from '../services/infrastructureService';
import { getLLMConfig } from '../services/llmService';

export interface UseInfrastructureBuilderReturn {
  // State
  messages: InfraMessage[];
  conversationState: ConversationState;
  isProcessing: boolean;
  error: string | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  reset: () => void;
  regenerateScript: (format: ScriptFormat) => void;
  downloadScript: () => void;
  getConfig: () => Partial<InfraConfig>;
}

export function useInfrastructureBuilder(): UseInfrastructureBuilderReturn {
  const [messages, setMessages] = useState<InfraMessage[]>([getInitialGreeting()]);
  const [conversationState, setConversationState] = useState<ConversationState>(createInitialState());
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const llmConfig = useRef(getLLMConfig());

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim()) return;

    setError(null);
    setIsProcessing(true);

    // Add user message to history
    const userMessage: InfraMessage = {
      role: 'user',
      content: message,
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      // Process the message
      const { response, newState } = await processInfraMessage(
        message,
        conversationState,
        llmConfig.current
      );

      // Add assistant response to history
      setMessages(prev => [...prev, response]);
      setConversationState(newState);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);

      // Add error message to chat
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I encountered an error: ${errorMessage}. Please try again.`,
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  }, [conversationState]);

  const reset = useCallback(() => {
    setMessages([getInitialGreeting()]);
    setConversationState(createInitialState());
    setError(null);
  }, []);

  const regenerateScript = useCallback((format: ScriptFormat) => {
    const script = generateScript(conversationState.answers, format);

    const newState = {
      ...conversationState,
      scriptFormat: format,
      generatedScript: script,
    };
    setConversationState(newState);

    // Add message with new script
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: `Here's the ${format === 'powershell' ? 'PowerShell' : 'Bicep'} version:`,
        script,
        scriptFormat: format,
      },
    ]);
  }, [conversationState]);

  const downloadScript = useCallback(() => {
    if (!conversationState.generatedScript) return;

    const filename = getScriptFilename(
      conversationState.scriptFormat,
      conversationState.answers.environmentName || 'fabric'
    );

    const blob = new Blob([conversationState.generatedScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [conversationState]);

  const getConfig = useCallback(() => {
    return conversationState.answers;
  }, [conversationState.answers]);

  return {
    messages,
    conversationState,
    isProcessing,
    error,
    sendMessage,
    reset,
    regenerateScript,
    downloadScript,
    getConfig,
  };
}
