import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getInitialGreeting,
  createInitialState,
  processInfraMessage,
  generateScript,
  getScriptFilename,
  INFRASTRUCTURE_TEMPLATES,
  CAPACITY_COSTS,
  estimateCost,
  formatCurrency,
  getTemplateById,
  applyTemplate,
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

    it('generates Terraform config with config values', () => {
      const config = {
        environmentName: 'tf-env',
        capacitySize: 'F8' as const,
        region: 'westeurope',
        workspaceName: 'TF Workspace',
        createLakehouse: true,
        lakehouseCount: 2,
        createWarehouse: true,
        warehouseCount: 1,
        enableGitIntegration: true,
        gitProvider: 'github' as const,
      };

      const script = generateScript(config, 'terraform');

      expect(script).toContain('tf-env');
      expect(script).toContain('F8');
      expect(script).toContain('westeurope');
      expect(script).toContain('azapi_resource');
      expect(script).toContain('fabric_capacity');
      expect(script).toContain('terraform {');
      expect(script).toContain('required_providers');
    });

    it('generates Terraform config with lakehouses', () => {
      const config = {
        environmentName: 'lh-tf-env',
        createLakehouse: true,
        lakehouseCount: 3,
      };

      const script = generateScript(config, 'terraform');

      expect(script).toContain('create_lakehouse = true');
      expect(script).toContain('lakehouse_count  = 3');
    });

    it('generates Terraform config with warehouses', () => {
      const config = {
        environmentName: 'wh-tf-env',
        createWarehouse: true,
        warehouseCount: 2,
      };

      const script = generateScript(config, 'terraform');

      expect(script).toContain('create_warehouse = true');
      expect(script).toContain('warehouse_count  = 2');
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

    it('generates Terraform filename', () => {
      const filename = getScriptFilename('terraform', 'my-env');

      expect(filename).toBe('my-env-infrastructure.tf');
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

  describe('INFRASTRUCTURE_TEMPLATES', () => {
    it('has at least 5 templates', () => {
      expect(INFRASTRUCTURE_TEMPLATES.length).toBeGreaterThanOrEqual(5);
    });

    it('each template has required fields', () => {
      for (const template of INFRASTRUCTURE_TEMPLATES) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.icon).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.config).toBeDefined();
        expect(template.estimatedSetupTime).toBeDefined();
        expect(template.useCases).toBeDefined();
        expect(template.useCases.length).toBeGreaterThan(0);
      }
    });

    it('has starter template with minimal config', () => {
      const starter = INFRASTRUCTURE_TEMPLATES.find(t => t.id === 'starter');
      expect(starter).toBeDefined();
      expect(starter?.config.capacitySize).toBe('F2');
      expect(starter?.config.enableMonitoring).toBe(false);
    });

    it('has enterprise template with full config', () => {
      const enterprise = INFRASTRUCTURE_TEMPLATES.find(t => t.id === 'enterprise-full');
      expect(enterprise).toBeDefined();
      expect(enterprise?.config.capacitySize).toBe('F32');
      expect(enterprise?.config.createLakehouse).toBe(true);
      expect(enterprise?.config.createWarehouse).toBe(true);
      expect(enterprise?.config.enableMonitoring).toBe(true);
    });
  });

  describe('getTemplateById', () => {
    it('returns template by id', () => {
      const template = getTemplateById('data-lakehouse');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Data Lakehouse');
    });

    it('returns undefined for unknown id', () => {
      const template = getTemplateById('nonexistent');
      expect(template).toBeUndefined();
    });
  });

  describe('applyTemplate', () => {
    it('returns template config', () => {
      const config = applyTemplate('starter');
      expect(config.capacitySize).toBe('F2');
      expect(config.createLakehouse).toBe(true);
    });

    it('returns empty object for unknown template', () => {
      const config = applyTemplate('nonexistent');
      expect(config).toEqual({});
    });
  });

  describe('CAPACITY_COSTS', () => {
    it('has costs for all capacity sizes', () => {
      const expectedSizes = ['F2', 'F4', 'F8', 'F16', 'F32', 'F64', 'F128', 'F256', 'F512', 'F1024', 'F2048'];
      for (const size of expectedSizes) {
        const cost = CAPACITY_COSTS.find(c => c.sku === size);
        expect(cost).toBeDefined();
        expect(cost?.pricePerMonth).toBeGreaterThan(0);
      }
    });

    it('costs increase with capacity size', () => {
      const f2 = CAPACITY_COSTS.find(c => c.sku === 'F2');
      const f64 = CAPACITY_COSTS.find(c => c.sku === 'F64');
      expect(f64?.pricePerMonth).toBeGreaterThan(f2?.pricePerMonth || 0);
    });
  });

  describe('estimateCost', () => {
    it('calculates cost for basic config', () => {
      const estimate = estimateCost({ capacitySize: 'F4' });

      expect(estimate.capacityCost.sku).toBe('F4');
      expect(estimate.monthlyTotal).toBeGreaterThan(0);
      expect(estimate.breakdown.capacity).toBe(526);
    });

    it('includes storage costs for lakehouses', () => {
      const withoutLakehouse = estimateCost({ capacitySize: 'F4', createLakehouse: false });
      const withLakehouse = estimateCost({ capacitySize: 'F4', createLakehouse: true, lakehouseCount: 2 });

      expect(withLakehouse.monthlyTotal).toBeGreaterThan(withoutLakehouse.monthlyTotal);
      expect(withLakehouse.breakdown.storage).toBe(100); // 2 * $50
    });

    it('includes storage costs for warehouses', () => {
      const withWarehouse = estimateCost({
        capacitySize: 'F4',
        createWarehouse: true,
        warehouseCount: 1,
      });

      expect(withWarehouse.breakdown.storage).toBe(100); // 1 * $100
    });

    it('includes compute costs for pipelines', () => {
      const withPipeline = estimateCost({
        capacitySize: 'F4',
        createPipeline: true,
        pipelineCount: 2,
      });

      expect(withPipeline.breakdown.compute).toBe(50); // 2 * $25
    });

    it('generates recommendations for enterprise without monitoring', () => {
      const estimate = estimateCost({
        capacitySize: 'F512',
        enableMonitoring: false,
      });

      expect(estimate.recommendations).toContain(
        'Enable monitoring for enterprise workloads to track performance'
      );
    });

    it('generates savings tips for high cost', () => {
      const estimate = estimateCost({ capacitySize: 'F64' });

      expect(estimate.savingsTips).toContain(
        'Consider reserved capacity for 40%+ savings on long-term workloads'
      );
    });

    it('always includes scale-up tip', () => {
      const estimate = estimateCost({ capacitySize: 'F2' });

      expect(estimate.savingsTips).toContain(
        'Start with lower capacity and scale up based on actual usage'
      );
    });
  });

  describe('formatCurrency', () => {
    it('formats number as USD', () => {
      expect(formatCurrency(1000)).toBe('$1,000');
      expect(formatCurrency(526)).toBe('$526');
      expect(formatCurrency(10000)).toBe('$10,000');
    });

    it('rounds to whole numbers', () => {
      expect(formatCurrency(1000.5)).toBe('$1,001');
      expect(formatCurrency(999.4)).toBe('$999');
    });
  });
});
