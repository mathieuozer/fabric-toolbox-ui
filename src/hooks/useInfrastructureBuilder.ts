// React hook for AI Infrastructure Builder
import { useState, useCallback, useRef, useMemo } from 'react';
import {
  InfraMessage,
  ConversationState,
  ScriptFormat,
  InfraConfig,
  InfraTemplate,
  CostEstimate,
  getInitialGreeting,
  createInitialState,
  processInfraMessage,
  generateScript,
  getScriptFilename,
  INFRASTRUCTURE_TEMPLATES,
  estimateCost,
  applyTemplate,
} from '../services/infrastructureService';
import { getLLMConfig } from '../services/llmService';

export interface UseInfrastructureBuilderReturn {
  // State
  messages: InfraMessage[];
  conversationState: ConversationState;
  isProcessing: boolean;
  error: string | null;
  templates: InfraTemplate[];
  costEstimate: CostEstimate | null;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  reset: () => void;
  regenerateScript: (format: ScriptFormat) => void;
  downloadScript: () => void;
  getConfig: () => Partial<InfraConfig>;
  selectTemplate: (templateId: string) => void;
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

  const selectTemplate = useCallback((templateId: string) => {
    const templateConfig = applyTemplate(templateId);
    const template = INFRASTRUCTURE_TEMPLATES.find(t => t.id === templateId);

    if (!template) return;

    // Update state with template config
    const newState = {
      ...conversationState,
      phase: 'confirming' as const,
      answers: {
        ...conversationState.answers,
        ...templateConfig,
        environmentName: conversationState.answers.environmentName || `${templateId}-env`,
      },
    };
    setConversationState(newState);

    // Add message about template selection
    const cost = estimateCost(newState.answers);
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: `Use the "${template.name}" template`,
      },
      {
        role: 'assistant',
        content: `Great choice! I've applied the **${template.name}** template.

${template.description}

**Configuration:**
- Capacity: ${templateConfig.capacitySize || 'F4'}
- Lakehouses: ${templateConfig.createLakehouse ? (templateConfig.lakehouseCount || 1) : 0}
- Warehouses: ${templateConfig.createWarehouse ? (templateConfig.warehouseCount || 1) : 0}
- Pipelines: ${templateConfig.createPipeline ? (templateConfig.pipelineCount || 1) : 0}
- Git Integration: ${templateConfig.enableGitIntegration ? 'Yes' : 'No'}
- Monitoring: ${templateConfig.enableMonitoring ? 'Yes' : 'No'}

**Estimated Cost:** ~$${cost.monthlyTotal.toLocaleString()}/month

Ready to **generate the script**, or would you like to **customize** anything?`,
      },
    ]);
  }, [conversationState]);

  // Calculate cost estimate when config changes
  const costEstimate = useMemo(() => {
    if (Object.keys(conversationState.answers).length === 0) return null;
    return estimateCost(conversationState.answers);
  }, [conversationState.answers]);

  return {
    messages,
    conversationState,
    isProcessing,
    error,
    templates: INFRASTRUCTURE_TEMPLATES,
    costEstimate,
    sendMessage,
    reset,
    regenerateScript,
    downloadScript,
    getConfig,
    selectTemplate,
  };
}
