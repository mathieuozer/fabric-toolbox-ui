// Tool Execution Service
// Handles tool execution in browser environment
import { ToolManifest } from '../data/toolsManifest';
import { generateRunScript } from './deployService';

export type ExecutionStatus = 'idle' | 'preparing' | 'ready' | 'running' | 'completed' | 'failed';

export interface ExecutionStep {
  stepNumber: number;
  description: string;
  command?: string;
  status: 'pending' | 'current' | 'completed' | 'skipped';
  output?: string;
  error?: string;
}

export interface ExecutionState {
  toolId: string;
  toolName: string;
  status: ExecutionStatus;
  steps: ExecutionStep[];
  currentStep: number;
  startTime: Date | null;
  endTime: Date | null;
  error?: string;
}

// Create initial execution state for a tool
export function createExecutionState(tool: ToolManifest): ExecutionState {
  return {
    toolId: tool.id,
    toolName: tool.name,
    status: 'idle',
    steps: tool.runInstructions.map((r, i) => ({
      stepNumber: r.step,
      description: r.description,
      command: r.command,
      status: 'pending',
    })),
    currentStep: 0,
    startTime: null,
    endTime: null,
  };
}

// Generate terminal command for execution
export function generateTerminalCommand(
  tool: ToolManifest,
  configValues: Record<string, string>
): string {
  const script = generateRunScript(tool, configValues);

  // Create a one-liner that can be pasted into terminal
  const envVars = Object.entries(configValues)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k.toUpperCase()}="${v}"`)
    .join(' ');

  const firstCommand = tool.runInstructions
    .filter(r => r.command && !r.isOptional)
    .map(r => {
      let cmd = r.command || '';
      // Replace placeholders with env vars
      tool.config.forEach(c => {
        const value = configValues[c.name] || '';
        cmd = cmd.replace(new RegExp(`\\$\\{?${c.name}\\}?`, 'g'), value);
      });
      return cmd;
    })
    .join(' && ');

  return envVars ? `${envVars} ${firstCommand}` : firstCommand;
}

// Copy command to clipboard and show instructions
export async function copyExecutionCommand(
  tool: ToolManifest,
  configValues: Record<string, string>
): Promise<{ command: string; copied: boolean }> {
  const command = generateTerminalCommand(tool, configValues);

  try {
    await navigator.clipboard.writeText(command);
    return { command, copied: true };
  } catch {
    return { command, copied: false };
  }
}

// Open terminal instructions modal
export interface TerminalInstructions {
  platform: 'mac' | 'windows' | 'linux';
  steps: string[];
  command: string;
}

export function getTerminalInstructions(
  tool: ToolManifest,
  configValues: Record<string, string>
): TerminalInstructions[] {
  const command = generateTerminalCommand(tool, configValues);

  return [
    {
      platform: 'mac',
      steps: [
        'Open Terminal (Cmd + Space, type "Terminal")',
        'Navigate to your project directory',
        'Paste and run the command below',
      ],
      command,
    },
    {
      platform: 'windows',
      steps: [
        'Open PowerShell (Win + X, select "Windows PowerShell")',
        'Navigate to your project directory',
        'Paste and run the command below',
      ],
      command: command.replace(/"/g, '`"'), // Escape for PowerShell
    },
    {
      platform: 'linux',
      steps: [
        'Open Terminal (Ctrl + Alt + T)',
        'Navigate to your project directory',
        'Paste and run the command below',
      ],
      command,
    },
  ];
}

// Check if a tool can potentially be executed in browser
export function canExecuteInBrowser(tool: ToolManifest): boolean {
  // Tools that could potentially use browser APIs
  const browserCompatibleTypes = ['typescript', 'cli'];
  return browserCompatibleTypes.includes(tool.type);
}

// Execute a step (simulation for browser - actual execution requires backend)
export async function executeStep(
  state: ExecutionState,
  stepIndex: number
): Promise<ExecutionStep> {
  const step = state.steps[stepIndex];

  // In browser, we can only simulate/prepare execution
  // Real execution would require a backend service

  return {
    ...step,
    status: 'completed',
    output: `Step "${step.description}" prepared for execution.`,
  };
}

// Validate configuration before execution
export function validateConfig(
  tool: ToolManifest,
  configValues: Record<string, string>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  tool.config.forEach(c => {
    if (c.required && !configValues[c.name]) {
      errors.push(`Missing required field: ${c.name}`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Get execution summary
export function getExecutionSummary(state: ExecutionState): {
  totalSteps: number;
  completedSteps: number;
  progress: number;
  duration: number | null;
} {
  const completedSteps = state.steps.filter(s => s.status === 'completed').length;
  const totalSteps = state.steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  let duration: number | null = null;
  if (state.startTime) {
    const end = state.endTime || new Date();
    duration = end.getTime() - state.startTime.getTime();
  }

  return {
    totalSteps,
    completedSteps,
    progress,
    duration,
  };
}
