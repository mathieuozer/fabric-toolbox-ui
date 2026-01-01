// Tool manifest with runnable configurations
// Each tool has metadata about how to run it on client side

export type ToolType = 'python' | 'powershell' | 'notebook' | 'sql' | 'powerbi' | 'typescript' | 'cli';

export interface ToolConfig {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  default?: string;
  options?: string[];
}

export interface ToolManifest {
  id: string;
  name: string;
  description: string;
  category: 'monitoring' | 'accelerators' | 'samples' | 'scripts' | 'tools';
  type: ToolType;
  tags: string[];
  path: string;

  // Prerequisites
  prerequisites: {
    name: string;
    installCmd?: string;
    checkCmd?: string;
    url?: string;
  }[];

  // Configuration parameters
  config: ToolConfig[];

  // How to run
  runInstructions: {
    step: number;
    description: string;
    command?: string;
    isOptional?: boolean;
  }[];

  // Output description
  output?: string;
}

export const TOOLS_MANIFEST: ToolManifest[] = [
  // ============ MONITORING ============
  {
    id: 'fca',
    name: 'Fabric Cost Analysis',
    description: 'Monitor and analyze your Fabric capacity costs with detailed PowerBI reports',
    category: 'monitoring',
    type: 'powerbi',
    tags: ['UPDATED', 'PowerBI'],
    path: '/fabric-tools/monitoring/FabricCostAnalysis',
    prerequisites: [
      { name: 'Power BI Desktop', url: 'https://powerbi.microsoft.com/desktop/' },
      { name: 'Fabric Capacity Metrics App', url: 'https://learn.microsoft.com/fabric/enterprise/metrics-app' }
    ],
    config: [
      { name: 'workspaceId', type: 'string', description: 'Your Fabric Workspace ID', required: true },
      { name: 'capacityId', type: 'string', description: 'Your Fabric Capacity ID', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Download the .pbix file from the tool folder' },
      { step: 2, description: 'Open in Power BI Desktop' },
      { step: 3, description: 'Update data source parameters with your Workspace and Capacity IDs' },
      { step: 4, description: 'Refresh the data to load your cost metrics' },
      { step: 5, description: 'Publish to your Power BI workspace', isOptional: true }
    ],
    output: 'Interactive Power BI dashboard showing Fabric capacity costs and usage patterns'
  },
  {
    id: 'fuam',
    name: 'Fabric Unified Admin Monitoring',
    description: 'Centralized admin monitoring for your Fabric tenant with comprehensive dashboards',
    category: 'monitoring',
    type: 'powerbi',
    tags: ['UPDATED', 'PowerBI'],
    path: '/fabric-tools/monitoring/FabricUnifiedAdminMonitoring',
    prerequisites: [
      { name: 'Power BI Desktop', url: 'https://powerbi.microsoft.com/desktop/' },
      { name: 'Fabric Admin API access', url: 'https://learn.microsoft.com/fabric/admin/admin-overview' }
    ],
    config: [
      { name: 'tenantId', type: 'string', description: 'Your Azure AD Tenant ID', required: true },
      { name: 'clientId', type: 'string', description: 'App Registration Client ID', required: true },
      { name: 'clientSecret', type: 'string', description: 'App Registration Client Secret', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Create an App Registration in Azure AD with Fabric Admin API permissions' },
      { step: 2, description: 'Download the .pbix file and open in Power BI Desktop' },
      { step: 3, description: 'Configure the data source with your tenant credentials' },
      { step: 4, description: 'Refresh to load tenant-wide monitoring data' }
    ],
    output: 'Unified admin dashboard with workspace, user, and capacity insights'
  },
  {
    id: 'fsm',
    name: 'Fabric Spark Monitoring',
    description: 'Monitor Spark workloads with Real-Time Intelligence dashboards',
    category: 'monitoring',
    type: 'notebook',
    tags: ['RTI', 'Spark'],
    path: '/fabric-tools/monitoring/FabricSparkMonitoring',
    prerequisites: [
      { name: 'Fabric Workspace with Spark', url: 'https://learn.microsoft.com/fabric/data-engineering/spark-compute' },
      { name: 'Real-Time Intelligence enabled', url: 'https://learn.microsoft.com/fabric/real-time-intelligence/' }
    ],
    config: [
      { name: 'workspaceId', type: 'string', description: 'Fabric Workspace ID', required: true },
      { name: 'eventhouseConnection', type: 'string', description: 'Eventhouse connection string', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Import the notebook into your Fabric workspace' },
      { step: 2, description: 'Configure the Eventhouse connection in the notebook' },
      { step: 3, description: 'Run all cells to set up Spark monitoring' },
      { step: 4, description: 'Access the RTI dashboard for real-time metrics' }
    ],
    output: 'Real-time Spark job monitoring with performance metrics and alerts'
  },

  // ============ ACCELERATORS ============
  {
    id: 'bcdr',
    name: 'BCDR Accelerator',
    description: 'Business Continuity and Disaster Recovery patterns for Fabric',
    category: 'accelerators',
    type: 'python',
    tags: ['Python'],
    path: '/fabric-tools/accelerators/BCDR',
    prerequisites: [
      { name: 'Python 3.9+', installCmd: 'brew install python3', checkCmd: 'python3 --version' },
      { name: 'Azure CLI', installCmd: 'brew install azure-cli', checkCmd: 'az --version' },
      { name: 'Fabric SDK', installCmd: 'pip install azure-fabric', checkCmd: 'pip show azure-fabric' }
    ],
    config: [
      { name: 'sourceWorkspaceId', type: 'string', description: 'Source Workspace ID', required: true },
      { name: 'targetWorkspaceId', type: 'string', description: 'Target/DR Workspace ID', required: true },
      { name: 'backupFrequency', type: 'string', description: 'Backup frequency', options: ['hourly', 'daily', 'weekly'], default: 'daily' }
    ],
    runInstructions: [
      { step: 1, description: 'Install dependencies', command: 'pip install -r requirements.txt' },
      { step: 2, description: 'Configure Azure credentials', command: 'az login' },
      { step: 3, description: 'Set environment variables for workspace IDs' },
      { step: 4, description: 'Run the BCDR setup script', command: 'python setup_bcdr.py' }
    ],
    output: 'Configured backup and recovery pipeline between workspaces'
  },
  {
    id: 'cicd-git',
    name: 'Git-Based Deployments',
    description: 'CI/CD patterns using Git integration for Fabric deployments',
    category: 'accelerators',
    type: 'cli',
    tags: ['CICD', 'Git'],
    path: '/fabric-tools/accelerators/CICD/Git-based-deployments',
    prerequisites: [
      { name: 'Git', installCmd: 'brew install git', checkCmd: 'git --version' },
      { name: 'Azure DevOps or GitHub Actions', url: 'https://github.com/features/actions' }
    ],
    config: [
      { name: 'repoUrl', type: 'string', description: 'Git repository URL', required: true },
      { name: 'branch', type: 'string', description: 'Deployment branch', default: 'main' },
      { name: 'workspaceId', type: 'string', description: 'Target Fabric Workspace ID', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Connect your Fabric workspace to Git' },
      { step: 2, description: 'Copy the CI/CD pipeline templates to your repo' },
      { step: 3, description: 'Configure pipeline variables with workspace credentials' },
      { step: 4, description: 'Enable the pipeline and trigger a deployment' }
    ],
    output: 'Automated CI/CD pipeline for Fabric artifact deployments'
  },
  {
    id: 'dw-backup',
    name: 'DW Backup & Recovery',
    description: 'Data Warehouse backup and recovery automation scripts',
    category: 'accelerators',
    type: 'python',
    tags: ['T-SQL', 'Python'],
    path: '/fabric-tools/accelerators/data-warehouse-backup-and-recovery',
    prerequisites: [
      { name: 'Python 3.9+', installCmd: 'brew install python3', checkCmd: 'python3 --version' },
      { name: 'pyodbc', installCmd: 'pip install pyodbc', checkCmd: 'pip show pyodbc' }
    ],
    config: [
      { name: 'warehouseConnection', type: 'string', description: 'Fabric DW connection string', required: true },
      { name: 'storageAccount', type: 'string', description: 'Azure Storage account for backups', required: true },
      { name: 'containerName', type: 'string', description: 'Blob container name', default: 'dw-backups' }
    ],
    runInstructions: [
      { step: 1, description: 'Install dependencies', command: 'pip install -r requirements.txt' },
      { step: 2, description: 'Configure connection strings in config.json' },
      { step: 3, description: 'Run backup script', command: 'python backup_warehouse.py' },
      { step: 4, description: 'Schedule via cron or Azure Automation', isOptional: true }
    ],
    output: 'Automated backup files stored in Azure Blob Storage'
  },
  {
    id: 'policy-weaver',
    name: 'Policy Weaver',
    description: 'Mirror data access policies from Databricks and Snowflake to Fabric',
    category: 'accelerators',
    type: 'python',
    tags: ['Python', 'Security'],
    path: '/fabric-tools/accelerators/policy-weaver',
    prerequisites: [
      { name: 'Python 3.9+', installCmd: 'brew install python3', checkCmd: 'python3 --version' },
      { name: 'Databricks CLI', installCmd: 'pip install databricks-cli', isOptional: true },
      { name: 'Snowflake Connector', installCmd: 'pip install snowflake-connector-python', isOptional: true }
    ],
    config: [
      { name: 'sourceType', type: 'string', description: 'Source platform', options: ['databricks', 'snowflake'], required: true },
      { name: 'sourceConnection', type: 'string', description: 'Source platform connection', required: true },
      { name: 'fabricWorkspaceId', type: 'string', description: 'Target Fabric Workspace ID', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Install dependencies', command: 'pip install -r requirements.txt' },
      { step: 2, description: 'Configure source platform credentials' },
      { step: 3, description: 'Run policy extraction', command: 'python extract_policies.py' },
      { step: 4, description: 'Apply policies to Fabric', command: 'python apply_policies.py' }
    ],
    output: 'Access policies synchronized from source platform to Fabric'
  },

  // ============ SCRIPTS ============
  {
    id: 'mirror-cci',
    name: 'Mirror CCI Tables',
    description: 'Mirror Clustered Columnstore Index tables for Fabric SQL DB',
    category: 'scripts',
    type: 'sql',
    tags: ['NEW', 'T-SQL'],
    path: '/fabric-tools/scripts/sql-Mirror-CCI-tables',
    prerequisites: [
      { name: 'SQL Server Management Studio', url: 'https://learn.microsoft.com/sql/ssms/download-sql-server-management-studio-ssms' },
      { name: 'Fabric SQL Database access' }
    ],
    config: [
      { name: 'serverName', type: 'string', description: 'Fabric SQL endpoint', required: true },
      { name: 'databaseName', type: 'string', description: 'Database name', required: true },
      { name: 'tableName', type: 'string', description: 'Table to mirror (or * for all)', default: '*' }
    ],
    runInstructions: [
      { step: 1, description: 'Connect to your Fabric SQL endpoint in SSMS' },
      { step: 2, description: 'Open the provided SQL script' },
      { step: 3, description: 'Update the table name parameter' },
      { step: 4, description: 'Execute the script to create mirrored CCI tables' }
    ],
    output: 'Optimized CCI tables for better query performance'
  },
  {
    id: 'dw-requests',
    name: 'DW Active Requests',
    description: 'Monitor active requests in your Fabric Data Warehouse',
    category: 'scripts',
    type: 'sql',
    tags: ['T-SQL'],
    path: '/fabric-tools/scripts/dw-active-requests',
    prerequisites: [
      { name: 'SQL client (SSMS, Azure Data Studio, etc.)' }
    ],
    config: [
      { name: 'serverName', type: 'string', description: 'Fabric SQL endpoint', required: true },
      { name: 'databaseName', type: 'string', description: 'Database name', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Connect to your Fabric DW endpoint' },
      { step: 2, description: 'Run the monitoring query to see active requests' },
      { step: 3, description: 'Optionally schedule as a stored procedure' }
    ],
    output: 'List of currently running queries with execution details'
  },
  {
    id: 'dw-kill',
    name: 'SP Kill Queries',
    description: 'Stored procedure to safely terminate long-running queries',
    category: 'scripts',
    type: 'sql',
    tags: ['T-SQL'],
    path: '/fabric-tools/scripts/dw-sp-kill-queries',
    prerequisites: [
      { name: 'SQL client with admin permissions' }
    ],
    config: [
      { name: 'serverName', type: 'string', description: 'Fabric SQL endpoint', required: true },
      { name: 'thresholdMinutes', type: 'number', description: 'Kill queries running longer than (minutes)', default: '60' }
    ],
    runInstructions: [
      { step: 1, description: 'Connect to your Fabric DW with admin privileges' },
      { step: 2, description: 'Deploy the stored procedure' },
      { step: 3, description: 'Execute with threshold parameter', command: 'EXEC sp_kill_long_queries @threshold_minutes = 60' }
    ],
    output: 'Terminated long-running queries that exceeded the threshold'
  },

  // ============ TOOLS ============
  {
    id: 'adf-migrate',
    name: 'ADF Migration Assistant',
    description: 'Migrate Azure Data Factory pipelines to Fabric Data Pipelines',
    category: 'tools',
    type: 'typescript',
    tags: ['UPDATED', 'TypeScript'],
    path: '/fabric-tools/tools/FabricDataFactoryMigrationAssistant',
    prerequisites: [
      { name: 'Node.js 18+', installCmd: 'brew install node', checkCmd: 'node --version' },
      { name: 'Azure CLI', installCmd: 'brew install azure-cli', checkCmd: 'az --version' }
    ],
    config: [
      { name: 'adfResourceGroup', type: 'string', description: 'ADF Resource Group', required: true },
      { name: 'adfName', type: 'string', description: 'Azure Data Factory name', required: true },
      { name: 'targetWorkspaceId', type: 'string', description: 'Target Fabric Workspace ID', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Install dependencies', command: 'npm install' },
      { step: 2, description: 'Login to Azure', command: 'az login' },
      { step: 3, description: 'Export ADF pipelines', command: 'npm run export' },
      { step: 4, description: 'Review and map connections in the UI' },
      { step: 5, description: 'Deploy to Fabric', command: 'npm run deploy' }
    ],
    output: 'ADF pipelines migrated to Fabric Data Pipelines'
  },
  {
    id: 'sem-mcp',
    name: 'Semantic Model MCP Server',
    description: 'MCP Server for semantic model operations with AI assistants',
    category: 'tools',
    type: 'python',
    tags: ['MCP', 'Python'],
    path: '/fabric-tools/tools/SemanticModelMCPServer',
    prerequisites: [
      { name: 'Python 3.10+', installCmd: 'brew install python3', checkCmd: 'python3 --version' },
      { name: 'Claude Desktop or MCP-compatible client' }
    ],
    config: [
      { name: 'workspaceId', type: 'string', description: 'Fabric Workspace ID', required: true },
      { name: 'datasetId', type: 'string', description: 'Semantic Model/Dataset ID', required: true },
      { name: 'mcpPort', type: 'number', description: 'MCP Server port', default: '3000' }
    ],
    runInstructions: [
      { step: 1, description: 'Install dependencies', command: 'pip install -r requirements.txt' },
      { step: 2, description: 'Configure Fabric credentials in .env' },
      { step: 3, description: 'Start MCP server', command: 'python server.py' },
      { step: 4, description: 'Connect your MCP client to the server' }
    ],
    output: 'Running MCP server for AI-assisted semantic model operations'
  },
  {
    id: 'ps-module',
    name: 'MicrosoftFabricMgmt',
    description: 'PowerShell module for Fabric management automation',
    category: 'tools',
    type: 'powershell',
    tags: ['PowerShell'],
    path: '/fabric-tools/tools/MicrosoftFabricMgmt',
    prerequisites: [
      { name: 'PowerShell 7+', installCmd: 'brew install powershell', checkCmd: 'pwsh --version' },
      { name: 'Az PowerShell module', installCmd: 'Install-Module Az -Scope CurrentUser' }
    ],
    config: [
      { name: 'tenantId', type: 'string', description: 'Azure AD Tenant ID', required: true },
      { name: 'subscriptionId', type: 'string', description: 'Azure Subscription ID', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Import the module', command: 'Import-Module ./MicrosoftFabricMgmt.psd1' },
      { step: 2, description: 'Connect to Fabric', command: 'Connect-FabricAccount -TenantId $tenantId' },
      { step: 3, description: 'Run Fabric cmdlets', command: 'Get-FabricWorkspace | Format-Table' }
    ],
    output: 'PowerShell commands for managing Fabric resources'
  },
  {
    id: 'copy-wh',
    name: 'Copy Warehouse',
    description: 'Clone warehouse schemas and data between Fabric workspaces',
    category: 'tools',
    type: 'python',
    tags: ['Python'],
    path: '/fabric-tools/tools/copy-warehouse',
    prerequisites: [
      { name: 'Python 3.9+', installCmd: 'brew install python3', checkCmd: 'python3 --version' },
      { name: 'pyodbc', installCmd: 'pip install pyodbc', checkCmd: 'pip show pyodbc' }
    ],
    config: [
      { name: 'sourceWarehouse', type: 'string', description: 'Source warehouse connection', required: true },
      { name: 'targetWarehouse', type: 'string', description: 'Target warehouse connection', required: true },
      { name: 'includeData', type: 'boolean', description: 'Copy data along with schema', default: 'true' }
    ],
    runInstructions: [
      { step: 1, description: 'Install dependencies', command: 'pip install -r requirements.txt' },
      { step: 2, description: 'Configure source and target connections' },
      { step: 3, description: 'Run copy operation', command: 'python copy_warehouse.py --include-data' }
    ],
    output: 'Cloned warehouse with schema and optionally data'
  },

  // ============ SAMPLES ============
  {
    id: 'open-mirror',
    name: 'Open Mirroring',
    description: 'Sample implementation for Fabric open mirroring patterns',
    category: 'samples',
    type: 'python',
    tags: ['Python'],
    path: '/fabric-tools/samples/open-mirroring',
    prerequisites: [
      { name: 'Python 3.9+', installCmd: 'brew install python3', checkCmd: 'python3 --version' },
      { name: 'Fabric Mirroring SDK', installCmd: 'pip install fabric-mirroring' }
    ],
    config: [
      { name: 'sourceType', type: 'string', description: 'Source database type', options: ['postgres', 'mysql', 'mongodb'], required: true },
      { name: 'sourceConnection', type: 'string', description: 'Source database connection string', required: true },
      { name: 'targetLakehouse', type: 'string', description: 'Target Fabric Lakehouse ID', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Install dependencies', command: 'pip install -r requirements.txt' },
      { step: 2, description: 'Configure source database connection' },
      { step: 3, description: 'Initialize mirroring', command: 'python init_mirror.py' },
      { step: 4, description: 'Start continuous sync', command: 'python sync_mirror.py' }
    ],
    output: 'Real-time data mirroring from external database to Fabric Lakehouse'
  },
  {
    id: 'nb-refresh',
    name: 'Refresh SQL Endpoint Tables',
    description: 'Notebook to refresh tables in Fabric SQL Analytics Endpoint',
    category: 'samples',
    type: 'notebook',
    tags: ['Notebook', 'Python'],
    path: '/fabric-tools/samples/notebook-refresh-tables-in-sql-endpoint',
    prerequisites: [
      { name: 'Fabric Workspace with Lakehouse' },
      { name: 'SQL Analytics Endpoint configured' }
    ],
    config: [
      { name: 'lakehouseId', type: 'string', description: 'Lakehouse ID', required: true },
      { name: 'tables', type: 'string', description: 'Tables to refresh (comma-separated or *)', default: '*' }
    ],
    runInstructions: [
      { step: 1, description: 'Import notebook to your Fabric workspace' },
      { step: 2, description: 'Attach to your Lakehouse' },
      { step: 3, description: 'Configure table parameters in the first cell' },
      { step: 4, description: 'Run all cells to refresh SQL endpoint tables' }
    ],
    output: 'Refreshed SQL Analytics Endpoint tables with latest Lakehouse data'
  },
  {
    id: 'nb-size',
    name: 'Workspace Size',
    description: 'Calculate and analyze workspace storage consumption',
    category: 'samples',
    type: 'notebook',
    tags: ['Notebook'],
    path: '/fabric-tools/samples/notebook-workspace-size',
    prerequisites: [
      { name: 'Fabric Workspace' },
      { name: 'Admin or Contributor access' }
    ],
    config: [
      { name: 'workspaceId', type: 'string', description: 'Workspace ID to analyze', required: true }
    ],
    runInstructions: [
      { step: 1, description: 'Import notebook to your Fabric workspace' },
      { step: 2, description: 'Set the target workspace ID' },
      { step: 3, description: 'Run all cells to calculate storage sizes' }
    ],
    output: 'Detailed storage breakdown by item type and recommendations'
  }
];

// Helper to get tool by ID
export const getToolById = (id: string): ToolManifest | undefined =>
  TOOLS_MANIFEST.find(t => t.id === id);

// Helper to get tools by category
export const getToolsByCategory = (category: string): ToolManifest[] =>
  TOOLS_MANIFEST.filter(t => t.category === category);

// Helper to search tools
export const searchTools = (query: string): ToolManifest[] => {
  const q = query.toLowerCase();
  return TOOLS_MANIFEST.filter(t =>
    t.name.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q)) ||
    t.type.toLowerCase().includes(q)
  );
};
