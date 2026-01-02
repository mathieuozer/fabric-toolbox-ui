import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getInitialGreeting,
  createInitialState,
  processInfraMessage,
  generateScript,
  getScriptFilename,
} from '../infrastructureService';

describe('infrastructureService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInitialGreeting', () => {
    it('returns assistant message with greeting', () => {
      const greeting = getInitialGreeting();

      expect(greeting.role).toBe('assistant');
      expect(greeting.content).toContain('infrastructure');
      expect(greeting.content).toContain('environment');
    });
  });

  describe('createInitialState', () => {
    it('creates initial conversation state', () => {
      const state = createInitialState();

      expect(state.phase).toBe('greeting');
      expect(state.currentQuestionIndex).toBe(0);
      expect(state.answers).toEqual({});
      expect(state.skippedQuestions).toEqual([]);
      expect(state.scriptFormat).toBe('powershell');
    });
  });

  describe('processInfraMessage', () => {
    it('parses environment name from user input', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'Create an environment called my-dev-env for testing',
        state
      );

      expect(newState.answers.environmentName).toBe('my-dev-env');
    });

    it('parses capacity size from user input', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'I need an F8 capacity for production',
        state
      );

      expect(newState.answers.capacitySize).toBe('F8');
    });

    it('parses lakehouse count from user input', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'Set up 3 lakehouses for data storage',
        state
      );

      expect(newState.answers.createLakehouse).toBe(true);
      expect(newState.answers.lakehouseCount).toBe(3);
    });

    it('parses warehouse requirement from user input', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'I need a warehouse for analytics',
        state
      );

      expect(newState.answers.createWarehouse).toBe(true);
    });

    it('parses git integration from user input', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'Enable CI/CD with GitHub integration',
        state
      );

      expect(newState.answers.enableGitIntegration).toBe(true);
      expect(newState.answers.gitProvider).toBe('github');
    });

    it('parses Azure DevOps as git provider', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'Set up git with Azure DevOps',
        state
      );

      expect(newState.answers.enableGitIntegration).toBe(true);
      expect(newState.answers.gitProvider).toBe('azure-devops');
    });

    it('applies smart defaults for dev environment', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'I need a development workspace with lakehouses for testing',
        state
      );

      // Dev environments default to F2
      expect(newState.answers.capacitySize).toBe('F2');
    });

    it('applies smart defaults for production environment', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'Set up a production environment with high availability',
        state
      );

      // Production environments default to F16
      expect(newState.answers.capacitySize).toBe('F16');
      expect(newState.answers.enableMonitoring).toBe(true);
      expect(newState.answers.enableRBAC).toBe(true);
    });

    it('returns guided flow when user says guide me', async () => {
      const state = createInitialState();

      const { response } = await processInfraMessage('guide me', state);

      expect(response.questions).toBeDefined();
      expect(response.questions?.length).toBeGreaterThan(0);
    });

    it('transitions to confirming phase with enough info', async () => {
      const state = createInitialState();

      const { newState } = await processInfraMessage(
        'Create a dev environment called test-env with 2 lakehouses and a warehouse for F4 capacity',
        state
      );

      expect(newState.phase).toBe('confirming');
    });

    it('generates script when user confirms', async () => {
      const state = createInitialState();
      state.phase = 'confirming';
      state.answers = {
        environmentName: 'test-env',
        capacitySize: 'F4',
        region: 'eastus',
        createLakehouse: true,
        lakehouseCount: 2,
      };

      const { response, newState } = await processInfraMessage('generate', state);

      expect(newState.phase).toBe('complete');
      expect(response.script).toBeDefined();
      expect(response.scriptFormat).toBe('powershell');
    });

    it('allows customization when requested', async () => {
      const state = createInitialState();
      state.phase = 'confirming';
      state.answers = { environmentName: 'test' };

      const { newState } = await processInfraMessage('customize', state);

      expect(newState.phase).toBe('gathering');
    });
  });

  describe('generateScript', () => {
    it('generates PowerShell script with config values', () => {
      const config = {
        environmentName: 'my-env',
        capacitySize: 'F8' as const,
        region: 'westeurope',
        workspaceName: 'My Workspace',
        createLakehouse: true,
        lakehouseCount: 2,
        createWarehouse: true,
        warehouseCount: 1,
        enableGitIntegration: true,
        gitProvider: 'github' as const,
      };

      const script = generateScript(config, 'powershell');

      expect(script).toContain('my-env');
      expect(script).toContain('F8');
      expect(script).toContain('westeurope');
      expect(script).toContain('My Workspace');
      expect(script).toContain('Lakehouse');
      expect(script).toContain('Warehouse');
      expect(script).toContain('Git');
    });

    it('generates Bicep template with config values', () => {
      const config = {
        environmentName: 'bicep-env',
        capacitySize: 'F4' as const,
        region: 'eastus',
      };

      const script = generateScript(config, 'bicep');

      expect(script).toContain('bicep-env');
      expect(script).toContain('F4');
      expect(script).toContain('eastus');
      expect(script).toContain('Microsoft.Fabric/capacities');
    });

    it('excludes warehouse section when not selected', () => {
      const config = {
        environmentName: 'no-wh-env',
        createWarehouse: false,
      };

      const script = generateScript(config, 'powershell');

      expect(script).toContain('Warehouses: Skipped');
    });

    it('excludes git section when not enabled', () => {
      const config = {
        environmentName: 'no-git-env',
        enableGitIntegration: false,
      };

      const script = generateScript(config, 'powershell');

      expect(script).toContain('Git Integration: Skipped');
    });
  });

  describe('getScriptFilename', () => {
    it('generates PowerShell filename', () => {
      const filename = getScriptFilename('powershell', 'my-env');

      expect(filename).toBe('deploy-my-env-infrastructure.ps1');
    });

    it('generates Bicep filename', () => {
      const filename = getScriptFilename('bicep', 'my-env');

      expect(filename).toBe('my-env-infrastructure.bicep');
    });

    it('sanitizes environment name', () => {
      const filename = getScriptFilename('powershell', 'My Env With Spaces');

      expect(filename).toBe('deploy-my-env-with-spaces-infrastructure.ps1');
    });

    it('uses default name when empty', () => {
      const filename = getScriptFilename('powershell', '');

      expect(filename).toBe('deploy-fabric-infrastructure.ps1');
    });
  });
});
