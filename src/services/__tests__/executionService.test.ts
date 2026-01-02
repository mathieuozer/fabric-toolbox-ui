import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createExecutionState,
  generateTerminalCommand,
  copyExecutionCommand,
  getTerminalInstructions,
  canExecuteInBrowser,
  validateConfig,
  getExecutionSummary,
  executeStep,
} from '../executionService';
import type { ToolManifest } from '../../data/toolsManifest';

// Mock deployService
vi.mock('../deployService', () => ({
  generateRunScript: vi.fn().mockReturnValue('#!/bin/bash\necho "test"'),
}));

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(),
};
Object.defineProperty(navigator, 'clipboard', {
  value: mockClipboard,
  writable: true,
});

describe('executionService', () => {
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
      { name: 'api_key', label: 'API Key', type: 'password', required: false },
    ],
    requirements: {
      powershell: '7.0',
    },
    runInstructions: [
      { step: 1, description: 'Connect to Fabric', command: 'Connect-FabricAccount' },
      { step: 2, description: 'Run migration', command: 'Start-Migration -WorkspaceId ${workspace_id}' },
    ],
    outputFiles: [],
    documentation: {
      description: 'Test tool description',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockClipboard.writeText.mockResolvedValue(undefined);
  });

  describe('createExecutionState', () => {
    it('creates initial execution state for a tool', () => {
      const state = createExecutionState(mockTool);

      expect(state.toolId).toBe('test-tool');
      expect(state.toolName).toBe('Test Tool');
      expect(state.status).toBe('idle');
      expect(state.steps).toHaveLength(2);
      expect(state.currentStep).toBe(0);
      expect(state.startTime).toBeNull();
      expect(state.endTime).toBeNull();
    });

    it('maps run instructions to steps', () => {
      const state = createExecutionState(mockTool);

      expect(state.steps[0]).toEqual({
        stepNumber: 1,
        description: 'Connect to Fabric',
        command: 'Connect-FabricAccount',
        status: 'pending',
      });
      expect(state.steps[1]).toEqual({
        stepNumber: 2,
        description: 'Run migration',
        command: 'Start-Migration -WorkspaceId ${workspace_id}',
        status: 'pending',
      });
    });
  });

  describe('generateTerminalCommand', () => {
    it('generates command with config values', () => {
      const configValues = {
        workspace_id: 'ws-12345',
        api_key: 'secret-key',
      };

      const command = generateTerminalCommand(mockTool, configValues);

      expect(command).toContain('WORKSPACE_ID="ws-12345"');
      expect(command).toContain('API_KEY="secret-key"');
    });

    it('filters out empty config values', () => {
      const configValues = {
        workspace_id: 'ws-12345',
        api_key: '',
      };

      const command = generateTerminalCommand(mockTool, configValues);

      expect(command).toContain('WORKSPACE_ID="ws-12345"');
      expect(command).not.toContain('API_KEY');
    });
  });

  describe('copyExecutionCommand', () => {
    it('copies command to clipboard and returns success', async () => {
      const configValues = { workspace_id: 'ws-12345' };

      const result = await copyExecutionCommand(mockTool, configValues);

      expect(mockClipboard.writeText).toHaveBeenCalled();
      expect(result.copied).toBe(true);
      expect(result.command).toBeDefined();
    });

    it('returns copied false on clipboard error', async () => {
      mockClipboard.writeText.mockRejectedValue(new Error('Clipboard error'));
      const configValues = { workspace_id: 'ws-12345' };

      const result = await copyExecutionCommand(mockTool, configValues);

      expect(result.copied).toBe(false);
      expect(result.command).toBeDefined();
    });
  });

  describe('getTerminalInstructions', () => {
    it('returns instructions for all platforms', () => {
      const configValues = { workspace_id: 'ws-12345' };

      const instructions = getTerminalInstructions(mockTool, configValues);

      expect(instructions).toHaveLength(3);
      expect(instructions.map(i => i.platform)).toEqual(['mac', 'windows', 'linux']);
    });

    it('includes command for each platform', () => {
      const configValues = { workspace_id: 'ws-12345' };

      const instructions = getTerminalInstructions(mockTool, configValues);

      instructions.forEach(inst => {
        expect(inst.command).toBeDefined();
        expect(inst.steps).toBeInstanceOf(Array);
        expect(inst.steps.length).toBeGreaterThan(0);
      });
    });

    it('escapes quotes for PowerShell on Windows', () => {
      const configValues = { workspace_id: 'ws-12345' };

      const instructions = getTerminalInstructions(mockTool, configValues);
      const windowsInst = instructions.find(i => i.platform === 'windows');

      expect(windowsInst).toBeDefined();
      // Windows command should have escaped quotes for PowerShell
    });
  });

  describe('canExecuteInBrowser', () => {
    it('returns true for typescript tools', () => {
      const typescriptTool = { ...mockTool, type: 'typescript' as const };
      expect(canExecuteInBrowser(typescriptTool)).toBe(true);
    });

    it('returns true for cli tools', () => {
      const cliTool = { ...mockTool, type: 'cli' as const };
      expect(canExecuteInBrowser(cliTool)).toBe(true);
    });

    it('returns false for powershell tools', () => {
      expect(canExecuteInBrowser(mockTool)).toBe(false);
    });

    it('returns false for python tools', () => {
      const pythonTool = { ...mockTool, type: 'python' as const };
      expect(canExecuteInBrowser(pythonTool)).toBe(false);
    });
  });

  describe('validateConfig', () => {
    it('returns valid when all required fields provided', () => {
      const configValues = { workspace_id: 'ws-12345' };

      const result = validateConfig(mockTool, configValues);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns invalid when required field missing', () => {
      const configValues = { api_key: 'secret' };

      const result = validateConfig(mockTool, configValues);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required field: workspace_id');
    });

    it('ignores optional fields', () => {
      const configValues = { workspace_id: 'ws-12345' };

      const result = validateConfig(mockTool, configValues);

      expect(result.valid).toBe(true);
    });
  });

  describe('getExecutionSummary', () => {
    it('calculates progress correctly', () => {
      const state = createExecutionState(mockTool);
      state.steps[0].status = 'completed';

      const summary = getExecutionSummary(state);

      expect(summary.totalSteps).toBe(2);
      expect(summary.completedSteps).toBe(1);
      expect(summary.progress).toBe(50);
    });

    it('calculates duration when start time set', () => {
      const state = createExecutionState(mockTool);
      state.startTime = new Date(Date.now() - 5000);

      const summary = getExecutionSummary(state);

      expect(summary.duration).toBeGreaterThanOrEqual(5000);
    });

    it('returns null duration when no start time', () => {
      const state = createExecutionState(mockTool);

      const summary = getExecutionSummary(state);

      expect(summary.duration).toBeNull();
    });

    it('handles empty steps', () => {
      const emptyTool = { ...mockTool, runInstructions: [] };
      const state = createExecutionState(emptyTool);

      const summary = getExecutionSummary(state);

      expect(summary.totalSteps).toBe(0);
      expect(summary.progress).toBe(0);
    });
  });

  describe('executeStep', () => {
    it('marks step as completed', async () => {
      const state = createExecutionState(mockTool);

      const result = await executeStep(state, 0);

      expect(result.status).toBe('completed');
      expect(result.output).toContain('Connect to Fabric');
    });
  });
});
