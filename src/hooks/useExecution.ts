// React hook for tool execution and tracking
import { useState, useCallback, useEffect } from 'react';
import { ToolManifest } from '../data/toolsManifest';
import {
  ExecutionState,
  createExecutionState,
  copyExecutionCommand,
  getTerminalInstructions,
  validateConfig,
  TerminalInstructions,
} from '../services/executionService';
import {
  addExecutionRecord,
  getToolConfig,
  saveToolConfig,
  getLatestExecution,
  getRecentTools,
  ExecutionRecord,
  TrackingStatus,
} from '../services/executionTrackingService';

export interface UseExecutionReturn {
  // State
  executionState: ExecutionState | null;
  isExecuting: boolean;
  error: string | null;
  terminalInstructions: TerminalInstructions[] | null;
  recentTools: ExecutionRecord[];

  // Actions
  prepareExecution: (tool: ToolManifest, configValues: Record<string, string>) => void;
  copyCommand: () => Promise<boolean>;
  showTerminalInstructions: () => void;
  hideTerminalInstructions: () => void;
  markAsExecuted: (success: boolean, notes?: string) => void;
  trackDeployment: (tool: ToolManifest, configValues: Record<string, string>) => void;
  getSavedConfig: (toolId: string) => Record<string, string> | null;
  getLastExecution: (toolId: string) => ExecutionRecord | null;
  refreshRecentTools: () => void;
}

export function useExecution(): UseExecutionReturn {
  const [executionState, setExecutionState] = useState<ExecutionState | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [terminalInstructions, setTerminalInstructions] = useState<TerminalInstructions[] | null>(null);
  const [recentTools, setRecentTools] = useState<ExecutionRecord[]>([]);
  const [currentTool, setCurrentTool] = useState<ToolManifest | null>(null);
  const [currentConfig, setCurrentConfig] = useState<Record<string, string>>({});

  // Load recent tools on mount
  useEffect(() => {
    setRecentTools(getRecentTools(5));
  }, []);

  const prepareExecution = useCallback((tool: ToolManifest, configValues: Record<string, string>) => {
    setError(null);

    // Validate config
    const validation = validateConfig(tool, configValues);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return;
    }

    // Save config
    saveToolConfig(tool.id, configValues);

    // Create execution state
    const state = createExecutionState(tool);
    state.status = 'preparing';
    state.startTime = new Date();
    setExecutionState(state);
    setCurrentTool(tool);
    setCurrentConfig(configValues);

    // Track as configured
    addExecutionRecord(tool, 'configured', configValues);
    setRecentTools(getRecentTools(5));
  }, []);

  const copyCommand = useCallback(async (): Promise<boolean> => {
    if (!currentTool) return false;

    const result = await copyExecutionCommand(currentTool, currentConfig);

    if (result.copied) {
      setExecutionState(prev => prev ? { ...prev, status: 'ready' } : null);
    }

    return result.copied;
  }, [currentTool, currentConfig]);

  const showTerminalInstructions = useCallback(() => {
    if (!currentTool) return;
    const instructions = getTerminalInstructions(currentTool, currentConfig);
    setTerminalInstructions(instructions);
  }, [currentTool, currentConfig]);

  const hideTerminalInstructions = useCallback(() => {
    setTerminalInstructions(null);
  }, []);

  const markAsExecuted = useCallback((success: boolean, notes?: string) => {
    if (!currentTool) return;

    const status: TrackingStatus = success ? 'executed' : 'failed';
    const endTime = new Date();
    const duration = executionState?.startTime
      ? endTime.getTime() - executionState.startTime.getTime()
      : undefined;

    addExecutionRecord(currentTool, status, currentConfig, {
      duration,
      notes,
      error: success ? undefined : 'Execution failed',
    });

    setExecutionState(prev => prev ? {
      ...prev,
      status: success ? 'completed' : 'failed',
      endTime,
    } : null);

    setRecentTools(getRecentTools(5));
  }, [currentTool, currentConfig, executionState]);

  const trackDeployment = useCallback((tool: ToolManifest, configValues: Record<string, string>) => {
    saveToolConfig(tool.id, configValues);
    addExecutionRecord(tool, 'deployed', configValues);
    setRecentTools(getRecentTools(5));
  }, []);

  const getSavedConfig = useCallback((toolId: string): Record<string, string> | null => {
    return getToolConfig(toolId);
  }, []);

  const getLastExecution = useCallback((toolId: string): ExecutionRecord | null => {
    return getLatestExecution(toolId);
  }, []);

  const refreshRecentTools = useCallback(() => {
    setRecentTools(getRecentTools(5));
  }, []);

  return {
    executionState,
    isExecuting,
    error,
    terminalInstructions,
    recentTools,
    prepareExecution,
    copyCommand,
    showTerminalInstructions,
    hideTerminalInstructions,
    markAsExecuted,
    trackDeployment,
    getSavedConfig,
    getLastExecution,
    refreshRecentTools,
  };
}
