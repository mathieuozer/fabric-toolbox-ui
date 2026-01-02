// Execution Tracking Service
// Tracks tool execution history and status
import { ToolManifest } from '../data/toolsManifest';

export type TrackingStatus = 'configured' | 'deployed' | 'executed' | 'failed';

export interface ExecutionRecord {
  id: string;
  toolId: string;
  toolName: string;
  status: TrackingStatus;
  configValues: Record<string, string>;
  timestamp: string;
  duration?: number;
  error?: string;
  notes?: string;
}

export interface ToolStats {
  toolId: string;
  toolName: string;
  totalExecutions: number;
  successfulExecutions: number;
  lastExecuted: string | null;
  lastConfig: Record<string, string> | null;
}

// Storage keys
const EXECUTION_HISTORY_KEY = 'fabric-toolbox-execution-history';
const TOOL_CONFIGS_KEY = 'fabric-toolbox-tool-configs';

// ============ EXECUTION HISTORY ============

// Get all execution records
export function getExecutionHistory(): ExecutionRecord[] {
  try {
    const stored = localStorage.getItem(EXECUTION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Save execution history
function saveExecutionHistory(records: ExecutionRecord[]): void {
  // Keep only last 100 records
  const trimmed = records.slice(-100);
  localStorage.setItem(EXECUTION_HISTORY_KEY, JSON.stringify(trimmed));
}

// Add execution record
export function addExecutionRecord(
  tool: ToolManifest,
  status: TrackingStatus,
  configValues: Record<string, string>,
  options?: { duration?: number; error?: string; notes?: string }
): ExecutionRecord {
  const record: ExecutionRecord = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    toolId: tool.id,
    toolName: tool.name,
    status,
    configValues,
    timestamp: new Date().toISOString(),
    ...options,
  };

  const history = getExecutionHistory();
  history.push(record);
  saveExecutionHistory(history);

  // Also save as last config for this tool
  saveToolConfig(tool.id, configValues);

  return record;
}

// Get execution records for a specific tool
export function getToolExecutionHistory(toolId: string): ExecutionRecord[] {
  return getExecutionHistory().filter(r => r.toolId === toolId);
}

// Get latest execution record for a tool
export function getLatestExecution(toolId: string): ExecutionRecord | null {
  const records = getToolExecutionHistory(toolId);
  return records.length > 0 ? records[records.length - 1] : null;
}

// Clear execution history
export function clearExecutionHistory(): void {
  localStorage.removeItem(EXECUTION_HISTORY_KEY);
}

// ============ SAVED CONFIGURATIONS ============

// Get all saved tool configs
export function getAllToolConfigs(): Record<string, Record<string, string>> {
  try {
    const stored = localStorage.getItem(TOOL_CONFIGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save tool config
export function saveToolConfig(toolId: string, config: Record<string, string>): void {
  const configs = getAllToolConfigs();
  configs[toolId] = config;
  localStorage.setItem(TOOL_CONFIGS_KEY, JSON.stringify(configs));
}

// Get saved config for a tool
export function getToolConfig(toolId: string): Record<string, string> | null {
  const configs = getAllToolConfigs();
  return configs[toolId] || null;
}

// Clear saved config for a tool
export function clearToolConfig(toolId: string): void {
  const configs = getAllToolConfigs();
  delete configs[toolId];
  localStorage.setItem(TOOL_CONFIGS_KEY, JSON.stringify(configs));
}

// Clear all saved configs
export function clearAllToolConfigs(): void {
  localStorage.removeItem(TOOL_CONFIGS_KEY);
}

// ============ STATISTICS ============

// Get stats for a specific tool
export function getToolStats(toolId: string, toolName: string): ToolStats {
  const records = getToolExecutionHistory(toolId);
  const executed = records.filter(r => r.status === 'executed');
  const lastRecord = records.length > 0 ? records[records.length - 1] : null;

  return {
    toolId,
    toolName,
    totalExecutions: records.length,
    successfulExecutions: executed.length,
    lastExecuted: lastRecord?.timestamp || null,
    lastConfig: lastRecord?.configValues || null,
  };
}

// Get stats for all tools
export function getAllToolStats(): ToolStats[] {
  const history = getExecutionHistory();
  const toolMap = new Map<string, { name: string; records: ExecutionRecord[] }>();

  // Group by tool
  history.forEach(record => {
    if (!toolMap.has(record.toolId)) {
      toolMap.set(record.toolId, { name: record.toolName, records: [] });
    }
    toolMap.get(record.toolId)!.records.push(record);
  });

  // Convert to stats
  return Array.from(toolMap.entries()).map(([toolId, { name, records }]) => {
    const executed = records.filter(r => r.status === 'executed');
    const lastRecord = records[records.length - 1];

    return {
      toolId,
      toolName: name,
      totalExecutions: records.length,
      successfulExecutions: executed.length,
      lastExecuted: lastRecord?.timestamp || null,
      lastConfig: lastRecord?.configValues || null,
    };
  });
}

// Get recently used tools
export function getRecentTools(limit: number = 5): ExecutionRecord[] {
  const history = getExecutionHistory();
  const seen = new Set<string>();
  const recent: ExecutionRecord[] = [];

  // Iterate from newest to oldest
  for (let i = history.length - 1; i >= 0 && recent.length < limit; i--) {
    const record = history[i];
    if (!seen.has(record.toolId)) {
      seen.add(record.toolId);
      recent.push(record);
    }
  }

  return recent;
}

// Get execution counts by status
export function getExecutionCounts(): Record<TrackingStatus, number> {
  const history = getExecutionHistory();
  const counts: Record<TrackingStatus, number> = {
    configured: 0,
    deployed: 0,
    executed: 0,
    failed: 0,
  };

  history.forEach(record => {
    counts[record.status]++;
  });

  return counts;
}

// ============ EXPORT/IMPORT ============

// Export all tracking data
export function exportTrackingData(): {
  history: ExecutionRecord[];
  configs: Record<string, Record<string, string>>;
  exportedAt: string;
} {
  return {
    history: getExecutionHistory(),
    configs: getAllToolConfigs(),
    exportedAt: new Date().toISOString(),
  };
}

// Import tracking data
export function importTrackingData(data: {
  history?: ExecutionRecord[];
  configs?: Record<string, Record<string, string>>;
}): void {
  if (data.history) {
    const existing = getExecutionHistory();
    const merged = [...existing, ...data.history];
    // Remove duplicates by id
    const unique = merged.filter(
      (record, index, self) => index === self.findIndex(r => r.id === record.id)
    );
    saveExecutionHistory(unique);
  }

  if (data.configs) {
    const existing = getAllToolConfigs();
    const merged = { ...existing, ...data.configs };
    localStorage.setItem(TOOL_CONFIGS_KEY, JSON.stringify(merged));
  }
}
