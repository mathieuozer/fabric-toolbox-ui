import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useExecution } from '../useExecution';
import type { ToolManifest } from '../../data/toolsManifest';

// Mock execution service
const mockCreateExecutionState = vi.fn();
const mockCopyExecutionCommand = vi.fn();
const mockGetTerminalInstructions = vi.fn();
const mockValidateConfig = vi.fn();

vi.mock('../../services/executionService', () => ({
  createExecutionState: (...args: unknown[]) => mockCreateExecutionState(...args),
  copyExecutionCommand: (...args: unknown[]) => mockCopyExecutionCommand(...args),
  getTerminalInstructions: (...args: unknown[]) => mockGetTerminalInstructions(...args),
  validateConfig: (...args: unknown[]) => mockValidateConfig(...args),
}));

// Mock execution tracking service
const mockAddExecutionRecord = vi.fn();
const mockGetToolConfig = vi.fn();
const mockSaveToolConfig = vi.fn();
const mockGetLatestExecution = vi.fn();
const mockGetRecentTools = vi.fn();

vi.mock('../../services/executionTrackingService', () => ({
  addExecutionRecord: (...args: unknown[]) => mockAddExecutionRecord(...args),
  getToolConfig: (toolId: string) => mockGetToolConfig(toolId),
  saveToolConfig: (...args: unknown[]) => mockSaveToolConfig(...args),
  getLatestExecution: (toolId: string) => mockGetLatestExecution(toolId),
  getRecentTools: (limit: number) => mockGetRecentTools(limit),
}));

describe('useExecution', () => {
  const mockTool: ToolManifest = {
    id: 'test-tool',
    name: 'Test Tool',
    description: 'A test tool',
    category: 'Migration',
    type: 'powershell',
    version: '1.0.0',
    author: 'Test Author',
    lastUpdated: '2024-01-01',
    tags: ['test'],
    config: [
      { name: 'workspace_id', label: 'Workspace ID', type: 'text', required: true },
    ],
    requirements: {},
    runInstructions: [
      { step: 1, description: 'Run tool', command: 'Start-Tool' },
    ],
    outputFiles: [],
    documentation: { description: 'Test' },
  };

  const mockExecutionState = {
    toolId: 'test-tool',
    toolName: 'Test Tool',
    status: 'idle',
    steps: [{ stepNumber: 1, description: 'Run tool', command: 'Start-Tool', status: 'pending' }],
    currentStep: 0,
    startTime: null,
    endTime: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetRecentTools.mockReturnValue([]);
    mockValidateConfig.mockReturnValue({ valid: true, errors: [] });
    mockCreateExecutionState.mockReturnValue(mockExecutionState);
    mockAddExecutionRecord.mockReturnValue({ id: 'rec-1', toolId: 'test-tool' });
  });

  describe('initial state', () => {
    it('starts with empty state', () => {
      const { result } = renderHook(() => useExecution());

      expect(result.current.executionState).toBeNull();
      expect(result.current.isExecuting).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.terminalInstructions).toBeNull();
    });

    it('loads recent tools on mount', () => {
      const recentTools = [
        { id: 'rec-1', toolId: 'tool-1', toolName: 'Tool 1', status: 'executed' },
      ];
      mockGetRecentTools.mockReturnValue(recentTools);

      const { result } = renderHook(() => useExecution());

      expect(mockGetRecentTools).toHaveBeenCalledWith(5);
      expect(result.current.recentTools).toEqual(recentTools);
    });
  });

  describe('prepareExecution', () => {
    it('validates config before preparing', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      expect(mockValidateConfig).toHaveBeenCalledWith(mockTool, { workspace_id: 'ws-123' });
    });

    it('sets error on invalid config', () => {
      mockValidateConfig.mockReturnValue({
        valid: false,
        errors: ['Missing required field: workspace_id'],
      });

      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, {});
      });

      expect(result.current.error).toBe('Missing required field: workspace_id');
      expect(result.current.executionState).toBeNull();
    });

    it('creates execution state on valid config', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      expect(mockCreateExecutionState).toHaveBeenCalledWith(mockTool);
      expect(result.current.executionState).not.toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('saves config to localStorage', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      expect(mockSaveToolConfig).toHaveBeenCalledWith('test-tool', { workspace_id: 'ws-123' });
    });

    it('adds execution record as configured', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      expect(mockAddExecutionRecord).toHaveBeenCalledWith(
        mockTool,
        'configured',
        { workspace_id: 'ws-123' }
      );
    });

    it('refreshes recent tools after preparing', () => {
      const { result } = renderHook(() => useExecution());

      // Clear initial call
      mockGetRecentTools.mockClear();

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      expect(mockGetRecentTools).toHaveBeenCalled();
    });
  });

  describe('copyCommand', () => {
    it('returns false when no tool prepared', async () => {
      const { result } = renderHook(() => useExecution());

      let copied = true;
      await act(async () => {
        copied = await result.current.copyCommand();
      });

      expect(copied).toBe(false);
    });

    it('copies command after preparing execution', async () => {
      mockCopyExecutionCommand.mockResolvedValue({ command: 'test-cmd', copied: true });

      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      let copied = false;
      await act(async () => {
        copied = await result.current.copyCommand();
      });

      expect(mockCopyExecutionCommand).toHaveBeenCalledWith(mockTool, { workspace_id: 'ws-123' });
      expect(copied).toBe(true);
    });

    it('updates execution state to ready on copy', async () => {
      mockCopyExecutionCommand.mockResolvedValue({ command: 'test-cmd', copied: true });

      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      await act(async () => {
        await result.current.copyCommand();
      });

      expect(result.current.executionState?.status).toBe('ready');
    });
  });

  describe('showTerminalInstructions', () => {
    it('does nothing when no tool prepared', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.showTerminalInstructions();
      });

      expect(mockGetTerminalInstructions).not.toHaveBeenCalled();
      expect(result.current.terminalInstructions).toBeNull();
    });

    it('shows instructions after preparing execution', () => {
      const instructions = [
        { platform: 'mac', steps: ['Step 1'], command: 'cmd' },
      ];
      mockGetTerminalInstructions.mockReturnValue(instructions);

      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      act(() => {
        result.current.showTerminalInstructions();
      });

      expect(mockGetTerminalInstructions).toHaveBeenCalledWith(mockTool, { workspace_id: 'ws-123' });
      expect(result.current.terminalInstructions).toEqual(instructions);
    });
  });

  describe('hideTerminalInstructions', () => {
    it('clears terminal instructions', () => {
      const instructions = [
        { platform: 'mac', steps: ['Step 1'], command: 'cmd' },
      ];
      mockGetTerminalInstructions.mockReturnValue(instructions);

      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      act(() => {
        result.current.showTerminalInstructions();
      });

      expect(result.current.terminalInstructions).not.toBeNull();

      act(() => {
        result.current.hideTerminalInstructions();
      });

      expect(result.current.terminalInstructions).toBeNull();
    });
  });

  describe('markAsExecuted', () => {
    it('does nothing when no tool prepared', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.markAsExecuted(true);
      });

      // Should not call addExecutionRecord (except for the initial configure if prepared)
      expect(mockAddExecutionRecord).not.toHaveBeenCalled();
    });

    it('marks execution as success', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      // Clear the configured record call
      mockAddExecutionRecord.mockClear();

      act(() => {
        result.current.markAsExecuted(true, 'Success notes');
      });

      expect(mockAddExecutionRecord).toHaveBeenCalledWith(
        mockTool,
        'executed',
        { workspace_id: 'ws-123' },
        expect.objectContaining({
          notes: 'Success notes',
        })
      );

      expect(result.current.executionState?.status).toBe('completed');
    });

    it('marks execution as failed', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.prepareExecution(mockTool, { workspace_id: 'ws-123' });
      });

      mockAddExecutionRecord.mockClear();

      act(() => {
        result.current.markAsExecuted(false);
      });

      expect(mockAddExecutionRecord).toHaveBeenCalledWith(
        mockTool,
        'failed',
        { workspace_id: 'ws-123' },
        expect.objectContaining({
          error: 'Execution failed',
        })
      );

      expect(result.current.executionState?.status).toBe('failed');
    });
  });

  describe('trackDeployment', () => {
    it('saves config and records deployment', () => {
      const { result } = renderHook(() => useExecution());

      act(() => {
        result.current.trackDeployment(mockTool, { workspace_id: 'ws-123' });
      });

      expect(mockSaveToolConfig).toHaveBeenCalledWith('test-tool', { workspace_id: 'ws-123' });
      expect(mockAddExecutionRecord).toHaveBeenCalledWith(
        mockTool,
        'deployed',
        { workspace_id: 'ws-123' }
      );
    });

    it('refreshes recent tools after tracking', () => {
      const { result } = renderHook(() => useExecution());

      mockGetRecentTools.mockClear();

      act(() => {
        result.current.trackDeployment(mockTool, { workspace_id: 'ws-123' });
      });

      expect(mockGetRecentTools).toHaveBeenCalled();
    });
  });

  describe('getSavedConfig', () => {
    it('returns saved config for tool', () => {
      mockGetToolConfig.mockReturnValue({ workspace_id: 'saved-ws' });

      const { result } = renderHook(() => useExecution());

      const config = result.current.getSavedConfig('test-tool');

      expect(mockGetToolConfig).toHaveBeenCalledWith('test-tool');
      expect(config).toEqual({ workspace_id: 'saved-ws' });
    });

    it('returns null for nonexistent tool', () => {
      mockGetToolConfig.mockReturnValue(null);

      const { result } = renderHook(() => useExecution());

      const config = result.current.getSavedConfig('nonexistent');

      expect(config).toBeNull();
    });
  });

  describe('getLastExecution', () => {
    it('returns last execution record', () => {
      const record = { id: 'rec-1', toolId: 'test-tool', status: 'executed' };
      mockGetLatestExecution.mockReturnValue(record);

      const { result } = renderHook(() => useExecution());

      const execution = result.current.getLastExecution('test-tool');

      expect(mockGetLatestExecution).toHaveBeenCalledWith('test-tool');
      expect(execution).toEqual(record);
    });
  });

  describe('refreshRecentTools', () => {
    it('refreshes the recent tools list', () => {
      const { result } = renderHook(() => useExecution());

      const newRecentTools = [
        { id: 'rec-2', toolId: 'tool-2', toolName: 'Tool 2', status: 'executed' },
      ];
      mockGetRecentTools.mockReturnValue(newRecentTools);

      act(() => {
        result.current.refreshRecentTools();
      });

      expect(mockGetRecentTools).toHaveBeenCalledWith(5);
      expect(result.current.recentTools).toEqual(newRecentTools);
    });
  });
});
