import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getExecutionHistory,
  addExecutionRecord,
  getToolExecutionHistory,
  getLatestExecution,
  clearExecutionHistory,
  getAllToolConfigs,
  saveToolConfig,
  getToolConfig,
  clearToolConfig,
  clearAllToolConfigs,
  getToolStats,
  getAllToolStats,
  getRecentTools,
  getExecutionCounts,
  exportTrackingData,
  importTrackingData,
} from '../executionTrackingService';
import type { ToolManifest } from '../../data/toolsManifest';

describe('executionTrackingService', () => {
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
    config: [],
    requirements: {},
    runInstructions: [],
    outputFiles: [],
    documentation: { description: 'Test' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
  });

  describe('Execution History', () => {
    describe('getExecutionHistory', () => {
      it('returns empty array when no history stored', () => {
        const result = getExecutionHistory();
        expect(result).toEqual([]);
      });

      it('returns parsed history from localStorage', () => {
        const history = [
          {
            id: 'exec-1',
            toolId: 'test-tool',
            toolName: 'Test Tool',
            status: 'executed',
            configValues: {},
            timestamp: '2024-01-01T00:00:00Z',
          },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const result = getExecutionHistory();
        expect(result).toEqual(history);
      });

      it('returns empty array on parse error', () => {
        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue('invalid json');

        const result = getExecutionHistory();
        expect(result).toEqual([]);
      });
    });

    describe('addExecutionRecord', () => {
      it('adds new execution record', () => {
        const configValues = { workspace_id: 'ws-123' };

        const record = addExecutionRecord(mockTool, 'executed', configValues);

        expect(record.toolId).toBe('test-tool');
        expect(record.toolName).toBe('Test Tool');
        expect(record.status).toBe('executed');
        expect(record.configValues).toEqual(configValues);
        expect(record.id).toBeDefined();
        expect(record.timestamp).toBeDefined();
      });

      it('includes optional properties', () => {
        const record = addExecutionRecord(mockTool, 'failed', {}, {
          duration: 5000,
          error: 'Something went wrong',
          notes: 'Test note',
        });

        expect(record.duration).toBe(5000);
        expect(record.error).toBe('Something went wrong');
        expect(record.notes).toBe('Test note');
      });

      it('saves to localStorage', () => {
        addExecutionRecord(mockTool, 'configured', {});

        expect(localStorage.setItem).toHaveBeenCalled();
      });
    });

    describe('getToolExecutionHistory', () => {
      it('filters history by tool id', () => {
        const history = [
          { id: '1', toolId: 'test-tool', toolName: 'Test', status: 'executed', configValues: {}, timestamp: '2024-01-01' },
          { id: '2', toolId: 'other-tool', toolName: 'Other', status: 'executed', configValues: {}, timestamp: '2024-01-02' },
          { id: '3', toolId: 'test-tool', toolName: 'Test', status: 'failed', configValues: {}, timestamp: '2024-01-03' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const result = getToolExecutionHistory('test-tool');

        expect(result).toHaveLength(2);
        expect(result.every(r => r.toolId === 'test-tool')).toBe(true);
      });
    });

    describe('getLatestExecution', () => {
      it('returns latest execution for tool', () => {
        const history = [
          { id: '1', toolId: 'test-tool', toolName: 'Test', status: 'configured', configValues: {}, timestamp: '2024-01-01' },
          { id: '2', toolId: 'test-tool', toolName: 'Test', status: 'executed', configValues: {}, timestamp: '2024-01-02' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const result = getLatestExecution('test-tool');

        expect(result?.id).toBe('2');
        expect(result?.status).toBe('executed');
      });

      it('returns null when no history for tool', () => {
        const result = getLatestExecution('nonexistent-tool');
        expect(result).toBeNull();
      });
    });

    describe('clearExecutionHistory', () => {
      it('removes history from localStorage', () => {
        clearExecutionHistory();

        expect(localStorage.removeItem).toHaveBeenCalledWith('fabric-toolbox-execution-history');
      });
    });
  });

  describe('Saved Configurations', () => {
    describe('getAllToolConfigs', () => {
      it('returns empty object when no configs stored', () => {
        const result = getAllToolConfigs();
        expect(result).toEqual({});
      });

      it('returns parsed configs from localStorage', () => {
        const configs = {
          'test-tool': { workspace_id: 'ws-123' },
        };

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(configs));

        const result = getAllToolConfigs();
        expect(result).toEqual(configs);
      });
    });

    describe('saveToolConfig', () => {
      it('saves config for tool', () => {
        const config = { workspace_id: 'ws-123' };

        saveToolConfig('test-tool', config);

        expect(localStorage.setItem).toHaveBeenCalledWith(
          'fabric-toolbox-tool-configs',
          expect.stringContaining('test-tool')
        );
      });
    });

    describe('getToolConfig', () => {
      it('returns config for specific tool', () => {
        const configs = {
          'test-tool': { workspace_id: 'ws-123' },
          'other-tool': { api_key: 'key-456' },
        };

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(configs));

        const result = getToolConfig('test-tool');
        expect(result).toEqual({ workspace_id: 'ws-123' });
      });

      it('returns null for nonexistent tool', () => {
        const result = getToolConfig('nonexistent-tool');
        expect(result).toBeNull();
      });
    });

    describe('clearToolConfig', () => {
      it('removes config for specific tool', () => {
        const configs = {
          'test-tool': { workspace_id: 'ws-123' },
          'other-tool': { api_key: 'key-456' },
        };

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(configs));

        clearToolConfig('test-tool');

        expect(localStorage.setItem).toHaveBeenCalled();
        const savedData = JSON.parse(
          (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1]
        );
        expect(savedData['test-tool']).toBeUndefined();
        expect(savedData['other-tool']).toBeDefined();
      });
    });

    describe('clearAllToolConfigs', () => {
      it('removes all configs from localStorage', () => {
        clearAllToolConfigs();

        expect(localStorage.removeItem).toHaveBeenCalledWith('fabric-toolbox-tool-configs');
      });
    });
  });

  describe('Statistics', () => {
    describe('getToolStats', () => {
      it('calculates stats for tool', () => {
        const history = [
          { id: '1', toolId: 'test-tool', toolName: 'Test', status: 'configured', configValues: { a: '1' }, timestamp: '2024-01-01' },
          { id: '2', toolId: 'test-tool', toolName: 'Test', status: 'executed', configValues: { a: '2' }, timestamp: '2024-01-02' },
          { id: '3', toolId: 'test-tool', toolName: 'Test', status: 'executed', configValues: { a: '3' }, timestamp: '2024-01-03' },
          { id: '4', toolId: 'test-tool', toolName: 'Test', status: 'failed', configValues: { a: '4' }, timestamp: '2024-01-04' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const stats = getToolStats('test-tool', 'Test Tool');

        expect(stats.toolId).toBe('test-tool');
        expect(stats.toolName).toBe('Test Tool');
        expect(stats.totalExecutions).toBe(4);
        expect(stats.successfulExecutions).toBe(2);
        expect(stats.lastExecuted).toBe('2024-01-04');
        expect(stats.lastConfig).toEqual({ a: '4' });
      });

      it('handles tool with no history', () => {
        const stats = getToolStats('nonexistent', 'Nonexistent Tool');

        expect(stats.totalExecutions).toBe(0);
        expect(stats.successfulExecutions).toBe(0);
        expect(stats.lastExecuted).toBeNull();
        expect(stats.lastConfig).toBeNull();
      });
    });

    describe('getAllToolStats', () => {
      it('returns stats for all tools', () => {
        const history = [
          { id: '1', toolId: 'tool-1', toolName: 'Tool 1', status: 'executed', configValues: {}, timestamp: '2024-01-01' },
          { id: '2', toolId: 'tool-2', toolName: 'Tool 2', status: 'executed', configValues: {}, timestamp: '2024-01-02' },
          { id: '3', toolId: 'tool-1', toolName: 'Tool 1', status: 'failed', configValues: {}, timestamp: '2024-01-03' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const stats = getAllToolStats();

        expect(stats).toHaveLength(2);

        const tool1Stats = stats.find(s => s.toolId === 'tool-1');
        expect(tool1Stats?.totalExecutions).toBe(2);
        expect(tool1Stats?.successfulExecutions).toBe(1);
      });
    });

    describe('getRecentTools', () => {
      it('returns unique recent tools', () => {
        const history = [
          { id: '1', toolId: 'tool-1', toolName: 'Tool 1', status: 'executed', configValues: {}, timestamp: '2024-01-01' },
          { id: '2', toolId: 'tool-2', toolName: 'Tool 2', status: 'executed', configValues: {}, timestamp: '2024-01-02' },
          { id: '3', toolId: 'tool-1', toolName: 'Tool 1', status: 'executed', configValues: {}, timestamp: '2024-01-03' },
          { id: '4', toolId: 'tool-3', toolName: 'Tool 3', status: 'executed', configValues: {}, timestamp: '2024-01-04' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const recent = getRecentTools(3);

        expect(recent).toHaveLength(3);
        expect(recent[0].toolId).toBe('tool-3'); // Most recent
        expect(recent[1].toolId).toBe('tool-1'); // Second most recent unique
        expect(recent[2].toolId).toBe('tool-2');
      });

      it('respects limit parameter', () => {
        const history = [
          { id: '1', toolId: 'tool-1', toolName: 'Tool 1', status: 'executed', configValues: {}, timestamp: '2024-01-01' },
          { id: '2', toolId: 'tool-2', toolName: 'Tool 2', status: 'executed', configValues: {}, timestamp: '2024-01-02' },
          { id: '3', toolId: 'tool-3', toolName: 'Tool 3', status: 'executed', configValues: {}, timestamp: '2024-01-03' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const recent = getRecentTools(2);

        expect(recent).toHaveLength(2);
      });
    });

    describe('getExecutionCounts', () => {
      it('counts executions by status', () => {
        const history = [
          { id: '1', toolId: 't1', toolName: 'T1', status: 'configured', configValues: {}, timestamp: '2024-01-01' },
          { id: '2', toolId: 't1', toolName: 'T1', status: 'deployed', configValues: {}, timestamp: '2024-01-02' },
          { id: '3', toolId: 't1', toolName: 'T1', status: 'executed', configValues: {}, timestamp: '2024-01-03' },
          { id: '4', toolId: 't2', toolName: 'T2', status: 'executed', configValues: {}, timestamp: '2024-01-04' },
          { id: '5', toolId: 't2', toolName: 'T2', status: 'failed', configValues: {}, timestamp: '2024-01-05' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(history));

        const counts = getExecutionCounts();

        expect(counts.configured).toBe(1);
        expect(counts.deployed).toBe(1);
        expect(counts.executed).toBe(2);
        expect(counts.failed).toBe(1);
      });
    });
  });

  describe('Export/Import', () => {
    describe('exportTrackingData', () => {
      it('exports all tracking data', () => {
        const history = [
          { id: '1', toolId: 'test', toolName: 'Test', status: 'executed', configValues: {}, timestamp: '2024-01-01' },
        ];
        const configs = { 'test': { key: 'value' } };

        (localStorage.getItem as ReturnType<typeof vi.fn>)
          .mockReturnValueOnce(JSON.stringify(history))
          .mockReturnValueOnce(JSON.stringify(configs));

        const exported = exportTrackingData();

        expect(exported.history).toEqual(history);
        expect(exported.configs).toEqual(configs);
        expect(exported.exportedAt).toBeDefined();
      });
    });

    describe('importTrackingData', () => {
      it('imports history data', () => {
        const importData = {
          history: [
            { id: 'new-1', toolId: 'test', toolName: 'Test', status: 'executed' as const, configValues: {}, timestamp: '2024-01-01' },
          ],
        };

        importTrackingData(importData);

        expect(localStorage.setItem).toHaveBeenCalled();
      });

      it('merges with existing data', () => {
        const existing = [
          { id: 'old-1', toolId: 'test', toolName: 'Test', status: 'configured', configValues: {}, timestamp: '2024-01-01' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(existing));

        const importData = {
          history: [
            { id: 'new-1', toolId: 'test', toolName: 'Test', status: 'executed' as const, configValues: {}, timestamp: '2024-01-02' },
          ],
        };

        importTrackingData(importData);

        const savedData = JSON.parse(
          (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1]
        );
        expect(savedData).toHaveLength(2);
      });

      it('deduplicates by id', () => {
        const existing = [
          { id: 'same-id', toolId: 'test', toolName: 'Test', status: 'configured', configValues: {}, timestamp: '2024-01-01' },
        ];

        (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(existing));

        const importData = {
          history: [
            { id: 'same-id', toolId: 'test', toolName: 'Test', status: 'executed' as const, configValues: {}, timestamp: '2024-01-02' },
          ],
        };

        importTrackingData(importData);

        const savedData = JSON.parse(
          (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1]
        );
        expect(savedData).toHaveLength(1);
      });

      it('imports configs', () => {
        const existingConfigs = { 'tool-1': { key: 'old' } };

        // Only mock for configs - history branch is skipped when data.history is undefined
        (localStorage.getItem as ReturnType<typeof vi.fn>)
          .mockReturnValueOnce(JSON.stringify(existingConfigs)); // for configs

        const importData = {
          configs: { 'tool-2': { key: 'new' } },
        };

        importTrackingData(importData);

        const savedData = JSON.parse(
          (localStorage.setItem as ReturnType<typeof vi.fn>).mock.calls[0][1]
        );
        expect(savedData['tool-1']).toBeDefined();
        expect(savedData['tool-2']).toBeDefined();
      });
    });
  });
});
