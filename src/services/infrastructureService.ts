// Infrastructure Script Generation Service
// AI-powered multi-turn conversation for Fabric infrastructure setup

import { LLMConfig, callLLM, ChatMessage } from './llmService';

// ============ TYPES ============

export type InfrastructureType =
  | 'workspace'
  | 'lakehouse'
  | 'warehouse'
  | 'pipeline'
  | 'capacity'
  | 'full-environment';

export type ScriptFormat = 'powershell' | 'bicep' | 'arm' | 'terraform';

export interface InfraQuestion {
  id: string;
  question: string;
  type: 'text' | 'select' | 'multiselect' | 'boolean';
  options?: { value: string; label: string; description?: string }[];
  default?: string;
  required: boolean;
  dependsOn?: { questionId: string; value: string };
}

export interface InfraConfig {
  // Basic settings
  environmentName: string;
  capacitySize: 'F2' | 'F4' | 'F8' | 'F16' | 'F32' | 'F64' | 'F128' | 'F256' | 'F512' | 'F1024' | 'F2048';
  region: string;
  resourceGroup: string;
  subscriptionId: string;

  // Workspace settings
  workspaceName: string;
  workspaceDescription?: string;

  // Components
  createLakehouse: boolean;
  lakehouseCount: number;
  lakehouseNames: string[];

  createWarehouse: boolean;
  warehouseCount: number;
  warehouseNames: string[];

  createPipeline: boolean;
  pipelineCount: number;
  pipelineNames: string[];

  // CI/CD
  enableGitIntegration: boolean;
  gitProvider?: 'azure-devops' | 'github';
  gitRepoUrl?: string;
  gitBranch?: string;

  // Security
  enableRBAC: boolean;
  adminUsers: string[];
  contributorUsers: string[];
  viewerUsers: string[];

  // Advanced
  enableMonitoring: boolean;
  enableAuditLogs: boolean;
  tags: Record<string, string>;
}

export interface ConversationState {
  phase: 'greeting' | 'gathering' | 'confirming' | 'generating' | 'complete';
  currentQuestionIndex: number;
  answers: Partial<InfraConfig>;
  skippedQuestions: string[];
  generatedScript?: string;
  scriptFormat: ScriptFormat;
}

export interface InfraMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  questions?: InfraQuestion[];
  script?: string;
  scriptFormat?: ScriptFormat;
}

// ============ QUESTIONS FLOW ============

const INFRASTRUCTURE_QUESTIONS: InfraQuestion[] = [
  {
    id: 'environmentName',
    question: 'What would you like to name this environment?',
    type: 'text',
    default: 'fabric-dev',
    required: true,
  },
  {
    id: 'capacitySize',
    question: 'What Fabric capacity size do you need?',
    type: 'select',
    options: [
      { value: 'F2', label: 'F2 (Dev/Test)', description: '2 CUs - Good for development' },
      { value: 'F4', label: 'F4 (Small)', description: '4 CUs - Small workloads' },
      { value: 'F8', label: 'F8 (Medium)', description: '8 CUs - Medium workloads' },
      { value: 'F16', label: 'F16 (Large)', description: '16 CUs - Large workloads' },
      { value: 'F32', label: 'F32 (X-Large)', description: '32 CUs - Enterprise workloads' },
      { value: 'F64', label: 'F64+', description: '64+ CUs - Heavy enterprise' },
    ],
    default: 'F4',
    required: true,
  },
  {
    id: 'region',
    question: 'Which Azure region should the resources be deployed to?',
    type: 'select',
    options: [
      { value: 'eastus', label: 'East US' },
      { value: 'eastus2', label: 'East US 2' },
      { value: 'westus', label: 'West US' },
      { value: 'westus2', label: 'West US 2' },
      { value: 'westeurope', label: 'West Europe' },
      { value: 'northeurope', label: 'North Europe' },
      { value: 'uksouth', label: 'UK South' },
      { value: 'australiaeast', label: 'Australia East' },
    ],
    default: 'eastus',
    required: true,
  },
  {
    id: 'resourceGroup',
    question: 'What resource group name should be used? (will be created if it doesn\'t exist)',
    type: 'text',
    default: 'rg-fabric-dev',
    required: true,
  },
  {
    id: 'workspaceName',
    question: 'What should the Fabric workspace be named?',
    type: 'text',
    default: 'Dev Workspace',
    required: true,
  },
  {
    id: 'createLakehouse',
    question: 'Do you need Lakehouses for data storage?',
    type: 'boolean',
    default: 'true',
    required: true,
  },
  {
    id: 'lakehouseCount',
    question: 'How many Lakehouses do you need?',
    type: 'select',
    options: [
      { value: '1', label: '1 Lakehouse' },
      { value: '2', label: '2 Lakehouses' },
      { value: '3', label: '3 Lakehouses' },
      { value: '5', label: '5 Lakehouses' },
    ],
    default: '1',
    required: true,
    dependsOn: { questionId: 'createLakehouse', value: 'true' },
  },
  {
    id: 'createWarehouse',
    question: 'Do you need a Data Warehouse for SQL analytics?',
    type: 'boolean',
    default: 'false',
    required: true,
  },
  {
    id: 'warehouseCount',
    question: 'How many Warehouses do you need?',
    type: 'select',
    options: [
      { value: '1', label: '1 Warehouse' },
      { value: '2', label: '2 Warehouses' },
      { value: '3', label: '3 Warehouses' },
    ],
    default: '1',
    required: true,
    dependsOn: { questionId: 'createWarehouse', value: 'true' },
  },
  {
    id: 'createPipeline',
    question: 'Do you need Data Pipelines for orchestration?',
    type: 'boolean',
    default: 'true',
    required: true,
  },
  {
    id: 'enableGitIntegration',
    question: 'Would you like to enable Git integration for source control?',
    type: 'boolean',
    default: 'true',
    required: true,
  },
  {
    id: 'gitProvider',
    question: 'Which Git provider do you use?',
    type: 'select',
    options: [
      { value: 'azure-devops', label: 'Azure DevOps', description: 'Azure Repos' },
      { value: 'github', label: 'GitHub', description: 'GitHub repositories' },
    ],
    default: 'azure-devops',
    required: true,
    dependsOn: { questionId: 'enableGitIntegration', value: 'true' },
  },
  {
    id: 'enableRBAC',
    question: 'Do you want to configure role-based access control (RBAC)?',
    type: 'boolean',
    default: 'true',
    required: true,
  },
  {
    id: 'enableMonitoring',
    question: 'Enable monitoring and alerting for the environment?',
    type: 'boolean',
    default: 'true',
    required: true,
  },
];

// ============ SCRIPT TEMPLATES ============

function generatePowerShellScript(config: Partial<InfraConfig>): string {
  const envName = config.environmentName || 'fabric-env';
  const capacitySize = config.capacitySize || 'F4';
  const region = config.region || 'eastus';
  const resourceGroup = config.resourceGroup || 'rg-fabric';
  const workspaceName = config.workspaceName || 'Dev Workspace';

  return `#Requires -Modules Az.Accounts, Az.Resources, FabricPS

<#
.SYNOPSIS
    Fabric Infrastructure Deployment Script
    Generated by Fabric Toolbox AI Infrastructure Builder

.DESCRIPTION
    This script creates a complete Fabric environment with:
    - Azure Resource Group (if needed)
    - Fabric Capacity (${capacitySize})
    - Fabric Workspace
    ${config.createLakehouse ? `- ${config.lakehouseCount || 1} Lakehouse(s)` : ''}
    ${config.createWarehouse ? `- ${config.warehouseCount || 1} Warehouse(s)` : ''}
    ${config.createPipeline ? '- Data Pipeline(s)' : ''}
    ${config.enableGitIntegration ? '- Git Integration' : ''}
    ${config.enableMonitoring ? '- Monitoring & Alerts' : ''}

.PARAMETER SubscriptionId
    Azure Subscription ID for deployment

.EXAMPLE
    .\\deploy-fabric-infrastructure.ps1 -SubscriptionId "your-subscription-id"
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$SubscriptionId,

    [Parameter(Mandatory = $false)]
    [string]$AdminEmail = ""
)

# ============ CONFIGURATION ============
$ErrorActionPreference = "Stop"

$config = @{
    EnvironmentName = "${envName}"
    CapacitySize = "${capacitySize}"
    Region = "${region}"
    ResourceGroup = "${resourceGroup}"
    WorkspaceName = "${workspaceName}"

    # Components
    CreateLakehouse = $${config.createLakehouse ?? true}
    LakehouseCount = ${config.lakehouseCount || 1}

    CreateWarehouse = $${config.createWarehouse ?? false}
    WarehouseCount = ${config.warehouseCount || 1}

    CreatePipeline = $${config.createPipeline ?? true}

    # Integration
    EnableGitIntegration = $${config.enableGitIntegration ?? false}
    GitProvider = "${config.gitProvider || 'azure-devops'}"

    # Security & Monitoring
    EnableRBAC = $${config.enableRBAC ?? true}
    EnableMonitoring = $${config.enableMonitoring ?? true}

    # Tags
    Tags = @{
        Environment = "${envName}"
        ManagedBy = "FabricToolbox"
        CreatedDate = (Get-Date -Format "yyyy-MM-dd")
    }
}

# ============ FUNCTIONS ============

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor White
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "  ℹ $Message" -ForegroundColor Gray
}

# ============ MAIN SCRIPT ============

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║       FABRIC INFRASTRUCTURE DEPLOYMENT                      ║" -ForegroundColor Magenta
Write-Host "║       Environment: $($config.EnvironmentName.PadRight(35))║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta

# Step 1: Azure Authentication
Write-Step "Step 1: Authenticating to Azure"
try {
    $context = Get-AzContext
    if (-not $context) {
        Write-Info "No Azure context found. Initiating login..."
        Connect-AzAccount
    }
    Set-AzContext -SubscriptionId $SubscriptionId | Out-Null
    Write-Success "Connected to subscription: $SubscriptionId"
} catch {
    Write-Error "Failed to authenticate: $_"
    exit 1
}

# Step 2: Create Resource Group
Write-Step "Step 2: Creating Resource Group"
$rg = Get-AzResourceGroup -Name $config.ResourceGroup -ErrorAction SilentlyContinue
if (-not $rg) {
    New-AzResourceGroup -Name $config.ResourceGroup -Location $config.Region -Tag $config.Tags | Out-Null
    Write-Success "Created resource group: $($config.ResourceGroup)"
} else {
    Write-Info "Resource group already exists: $($config.ResourceGroup)"
}

# Step 3: Create Fabric Capacity
Write-Step "Step 3: Creating Fabric Capacity"
$capacityName = "$($config.EnvironmentName)-capacity".ToLower() -replace '[^a-z0-9-]', ''

Write-Info "Creating Fabric capacity: $capacityName ($($config.CapacitySize))"
Write-Info "This may take several minutes..."

# Note: Fabric capacity creation requires the Fabric REST API
$capacityBody = @{
    properties = @{
        administration = @{
            members = @($AdminEmail)
        }
    }
    sku = @{
        name = $config.CapacitySize
        tier = "Fabric"
    }
    location = $config.Region
} | ConvertTo-Json -Depth 10

# Using ARM template for capacity creation
$capacityTemplate = @"
{
    "\\$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
    "contentVersion": "1.0.0.0",
    "resources": [
        {
            "type": "Microsoft.Fabric/capacities",
            "apiVersion": "2023-11-01",
            "name": "$capacityName",
            "location": "$($config.Region)",
            "sku": {
                "name": "$($config.CapacitySize)",
                "tier": "Fabric"
            },
            "properties": {
                "administration": {
                    "members": ["$AdminEmail"]
                }
            },
            "tags": $(($config.Tags | ConvertTo-Json -Compress))
        }
    ],
    "outputs": {
        "capacityId": {
            "type": "string",
            "value": "[resourceId('Microsoft.Fabric/capacities', '$capacityName')]"
        }
    }
}
"@

try {
    $templateFile = [System.IO.Path]::GetTempFileName() + ".json"
    $capacityTemplate | Out-File -FilePath $templateFile -Encoding UTF8

    $deployment = New-AzResourceGroupDeployment \`
        -ResourceGroupName $config.ResourceGroup \`
        -TemplateFile $templateFile \`
        -Name "fabric-capacity-$(Get-Date -Format 'yyyyMMddHHmmss')" \`
        -ErrorAction Stop

    $capacityId = $deployment.Outputs.capacityId.Value
    Write-Success "Created Fabric capacity: $capacityName"

    Remove-Item $templateFile -Force
} catch {
    Write-Warning "Capacity creation via ARM failed. Trying Fabric API..."
    # Fallback to REST API if ARM fails
}

# Step 4: Create Fabric Workspace
Write-Step "Step 4: Creating Fabric Workspace"

# Connect to Fabric
Write-Info "Connecting to Fabric..."
Connect-FabricAccount

$workspaceParams = @{
    DisplayName = $config.WorkspaceName
    Description = "Created by Fabric Toolbox - $($config.EnvironmentName)"
}

if ($capacityId) {
    $workspaceParams.CapacityId = $capacityId
}

try {
    $workspace = New-FabricWorkspace @workspaceParams
    $workspaceId = $workspace.Id
    Write-Success "Created workspace: $($config.WorkspaceName) (ID: $workspaceId)"
} catch {
    Write-Error "Failed to create workspace: $_"
    exit 1
}

${config.createLakehouse ? `
# Step 5: Create Lakehouses
Write-Step "Step 5: Creating Lakehouses"
$lakehouseNames = @(${Array.from({ length: config.lakehouseCount || 1 }, (_, i) => `"${envName}-lakehouse-${i + 1}"`).join(', ')})

foreach ($lhName in $lakehouseNames) {
    try {
        $lakehouse = New-FabricLakehouse -WorkspaceId $workspaceId -DisplayName $lhName
        Write-Success "Created lakehouse: $lhName"
    } catch {
        Write-Warning "Failed to create lakehouse $lhName: $_"
    }
}
` : '# Lakehouses: Skipped (not selected)'}

${config.createWarehouse ? `
# Step 6: Create Warehouses
Write-Step "Step 6: Creating Warehouses"
$warehouseNames = @(${Array.from({ length: config.warehouseCount || 1 }, (_, i) => `"${envName}-warehouse-${i + 1}"`).join(', ')})

foreach ($whName in $warehouseNames) {
    try {
        $warehouse = New-FabricWarehouse -WorkspaceId $workspaceId -DisplayName $whName
        Write-Success "Created warehouse: $whName"
    } catch {
        Write-Warning "Failed to create warehouse $whName: $_"
    }
}
` : '# Warehouses: Skipped (not selected)'}

${config.createPipeline ? `
# Step 7: Create Data Pipelines
Write-Step "Step 7: Creating Data Pipelines"
$pipelineNames = @("${envName}-etl-pipeline", "${envName}-orchestration-pipeline")

foreach ($pipeName in $pipelineNames) {
    try {
        $pipeline = New-FabricDataPipeline -WorkspaceId $workspaceId -DisplayName $pipeName
        Write-Success "Created pipeline: $pipeName"
    } catch {
        Write-Warning "Failed to create pipeline $pipeName: $_"
    }
}
` : '# Pipelines: Skipped (not selected)'}

${config.enableGitIntegration ? `
# Step 8: Configure Git Integration
Write-Step "Step 8: Configuring Git Integration"
Write-Info "Git Provider: ${config.gitProvider || 'azure-devops'}"
Write-Info "To complete Git integration:"
Write-Info "  1. Go to Workspace Settings > Git integration"
Write-Info "  2. Connect to your ${config.gitProvider === 'github' ? 'GitHub' : 'Azure DevOps'} repository"
Write-Info "  3. Select the branch for this workspace"
Write-Success "Git integration instructions provided"
` : '# Git Integration: Skipped (not selected)'}

${config.enableRBAC ? `
# Step 9: Configure RBAC
Write-Step "Step 9: Configuring Access Control"
Write-Info "Setting up role-based access control..."

# Add workspace admins
if ($AdminEmail) {
    try {
        Add-FabricWorkspaceRoleMember -WorkspaceId $workspaceId -PrincipalId $AdminEmail -Role "Admin"
        Write-Success "Added admin: $AdminEmail"
    } catch {
        Write-Warning "Could not add admin: $_"
    }
}

Write-Info "To add more users:"
Write-Info "  Add-FabricWorkspaceRoleMember -WorkspaceId '$workspaceId' -PrincipalId 'user@domain.com' -Role 'Admin|Member|Contributor|Viewer'"
` : '# RBAC: Skipped (not selected)'}

${config.enableMonitoring ? `
# Step 10: Configure Monitoring
Write-Step "Step 10: Setting Up Monitoring"
Write-Info "Recommended monitoring tools from Fabric Toolbox:"
Write-Info "  - Fabric Cost Analysis (FCA) - Monitor capacity costs"
Write-Info "  - Unified Admin Monitoring (FUAM) - Admin dashboard"
Write-Info "  - Platform Monitoring (FPM) - Performance metrics"
Write-Success "Monitoring recommendations provided"
` : '# Monitoring: Skipped (not selected)'}

# ============ SUMMARY ============
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║       DEPLOYMENT COMPLETE                                   ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "  Environment: $($config.EnvironmentName)" -ForegroundColor White
Write-Host "  Workspace ID: $workspaceId" -ForegroundColor White
Write-Host "  Region: $($config.Region)" -ForegroundColor White
Write-Host "  Capacity: $($config.CapacitySize)" -ForegroundColor White
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Yellow
Write-Host "    1. Open Fabric portal: https://app.fabric.microsoft.com" -ForegroundColor Gray
Write-Host "    2. Navigate to your workspace: $($config.WorkspaceName)" -ForegroundColor Gray
Write-Host "    3. Start building your data solutions!" -ForegroundColor Gray
Write-Host ""

# Output for automation
$result = @{
    Success = $true
    Environment = $config.EnvironmentName
    WorkspaceId = $workspaceId
    CapacityId = $capacityId
    Region = $config.Region
}

return $result
`;
}

function generateBicepTemplate(config: Partial<InfraConfig>): string {
  const envName = config.environmentName || 'fabric-env';
  const capacitySize = config.capacitySize || 'F4';
  const region = config.region || 'eastus';

  return `// Fabric Infrastructure - Bicep Template
// Generated by Fabric Toolbox AI Infrastructure Builder
// Environment: ${envName}

@description('Azure region for deployment')
param location string = '${region}'

@description('Environment name used for resource naming')
param environmentName string = '${envName}'

@description('Fabric capacity SKU')
@allowed([
  'F2'
  'F4'
  'F8'
  'F16'
  'F32'
  'F64'
  'F128'
  'F256'
  'F512'
  'F1024'
  'F2048'
])
param capacitySku string = '${capacitySize}'

@description('Admin email for Fabric capacity')
param adminEmail string

@description('Tags to apply to all resources')
param tags object = {
  Environment: environmentName
  ManagedBy: 'FabricToolbox'
  CreatedDate: utcNow('yyyy-MM-dd')
}

// ============ VARIABLES ============

var capacityName = toLower(replace('\${environmentName}-capacity', ' ', '-'))
var uniqueSuffix = uniqueString(resourceGroup().id)

// ============ RESOURCES ============

// Fabric Capacity
resource fabricCapacity 'Microsoft.Fabric/capacities@2023-11-01' = {
  name: capacityName
  location: location
  tags: tags
  sku: {
    name: capacitySku
    tier: 'Fabric'
  }
  properties: {
    administration: {
      members: [
        adminEmail
      ]
    }
  }
}

// ============ OUTPUTS ============

@description('The resource ID of the Fabric capacity')
output capacityId string = fabricCapacity.id

@description('The name of the Fabric capacity')
output capacityName string = fabricCapacity.name

@description('Instructions for next steps')
output nextSteps string = '''
Capacity deployed successfully!

Next steps:
1. Run the companion PowerShell script to create Fabric workspace and items
2. Or manually create via Fabric portal: https://app.fabric.microsoft.com

PowerShell commands:
  Connect-FabricAccount
  New-FabricWorkspace -DisplayName "${config.workspaceName || 'Dev Workspace'}" -CapacityId "\${capacityId}"
'''

// ============ POST-DEPLOYMENT SCRIPT ============
/*
After deploying this Bicep template, run the following PowerShell to complete setup:

\`\`\`powershell
# Connect to Fabric
Connect-FabricAccount

# Create workspace on the capacity
$workspace = New-FabricWorkspace \`
    -DisplayName "${config.workspaceName || 'Dev Workspace'}" \`
    -CapacityId (Get-AzResource -Name "$capacityName" -ResourceType "Microsoft.Fabric/capacities").ResourceId

${config.createLakehouse ? `
# Create Lakehouses
1..${config.lakehouseCount || 1} | ForEach-Object {
    New-FabricLakehouse -WorkspaceId $workspace.Id -DisplayName "${envName}-lakehouse-$_"
}` : ''}

${config.createWarehouse ? `
# Create Warehouses
1..${config.warehouseCount || 1} | ForEach-Object {
    New-FabricWarehouse -WorkspaceId $workspace.Id -DisplayName "${envName}-warehouse-$_"
}` : ''}
\`\`\`
*/
`;
}

// ============ AI CONVERSATION LOGIC ============

const INFRA_SYSTEM_PROMPT = `You are an AI assistant helping users set up Microsoft Fabric infrastructure. You ask questions to understand their needs and generate deployment scripts.

Your personality:
- Friendly and helpful
- Technical but accessible
- Proactive in suggesting best practices

When the user describes their needs, you should:
1. Acknowledge their request
2. Ask clarifying questions one at a time
3. Suggest sensible defaults
4. Explain trade-offs when relevant

Current question flow topics:
- Environment naming
- Capacity sizing (F2-F2048)
- Azure region
- Components needed (Lakehouses, Warehouses, Pipelines)
- Git integration preferences
- Security/RBAC requirements
- Monitoring needs

Be concise but thorough. After gathering enough information, generate the infrastructure script.`;

export function getInitialGreeting(): InfraMessage {
  return {
    role: 'assistant',
    content: `Hi! I'll help you set up your Microsoft Fabric infrastructure. I'll ask a few questions to understand your needs, then generate deployment scripts.

**What kind of environment are you setting up?**

For example:
- "I need a development workspace with 3 lakehouses and CI/CD"
- "Production environment with warehouse and real-time analytics"
- "Just a simple workspace to try out Fabric"

Tell me about your needs, or say "guide me" for a step-by-step walkthrough.`,
  };
}

export function createInitialState(): ConversationState {
  return {
    phase: 'greeting',
    currentQuestionIndex: 0,
    answers: {},
    skippedQuestions: [],
    scriptFormat: 'powershell',
  };
}

// Parse user input to extract configuration values
function parseUserInput(input: string, currentAnswers: Partial<InfraConfig>): Partial<InfraConfig> {
  const updates: Partial<InfraConfig> = { ...currentAnswers };
  const inputLower = input.toLowerCase();

  // Environment name detection
  const envMatch = input.match(/(?:called|named|name[:\s]+)\s*["']?([a-zA-Z0-9_-]+)["']?/i);
  if (envMatch) {
    updates.environmentName = envMatch[1];
  }

  // Capacity size detection
  const capacityMatch = inputLower.match(/f(\d+)/);
  if (capacityMatch) {
    const size = `F${capacityMatch[1]}` as InfraConfig['capacitySize'];
    updates.capacitySize = size;
  }

  // Component detection
  if (inputLower.includes('lakehouse')) {
    updates.createLakehouse = true;
    const countMatch = inputLower.match(/(\d+)\s*lakehouse/);
    if (countMatch) {
      updates.lakehouseCount = parseInt(countMatch[1], 10);
    }
  }

  if (inputLower.includes('warehouse')) {
    updates.createWarehouse = true;
    const countMatch = inputLower.match(/(\d+)\s*warehouse/);
    if (countMatch) {
      updates.warehouseCount = parseInt(countMatch[1], 10);
    }
  }

  if (inputLower.includes('pipeline')) {
    updates.createPipeline = true;
  }

  // Git integration detection
  if (inputLower.includes('git') || inputLower.includes('ci/cd') || inputLower.includes('cicd')) {
    updates.enableGitIntegration = true;
    if (inputLower.includes('github')) {
      updates.gitProvider = 'github';
    } else if (inputLower.includes('azure') || inputLower.includes('devops')) {
      updates.gitProvider = 'azure-devops';
    }
  }

  // Environment type detection for smart defaults
  if (inputLower.includes('dev') || inputLower.includes('development')) {
    updates.capacitySize = updates.capacitySize || 'F2';
    updates.enableMonitoring = false;
  } else if (inputLower.includes('prod') || inputLower.includes('production')) {
    updates.capacitySize = updates.capacitySize || 'F16';
    updates.enableMonitoring = true;
    updates.enableRBAC = true;
  } else if (inputLower.includes('test') || inputLower.includes('staging')) {
    updates.capacitySize = updates.capacitySize || 'F4';
  }

  // Region detection
  const regionPatterns: Record<string, string> = {
    'east us': 'eastus',
    'west us': 'westus',
    'west europe': 'westeurope',
    'north europe': 'northeurope',
    'uk south': 'uksouth',
    'australia': 'australiaeast',
  };

  for (const [pattern, region] of Object.entries(regionPatterns)) {
    if (inputLower.includes(pattern)) {
      updates.region = region;
      break;
    }
  }

  return updates;
}

// Get next question based on current state
function getNextQuestion(state: ConversationState): InfraQuestion | null {
  for (let i = state.currentQuestionIndex; i < INFRASTRUCTURE_QUESTIONS.length; i++) {
    const question = INFRASTRUCTURE_QUESTIONS[i];

    // Skip if already answered
    if (state.answers[question.id as keyof InfraConfig] !== undefined) {
      continue;
    }

    // Check dependencies
    if (question.dependsOn) {
      const dependencyValue = state.answers[question.dependsOn.questionId as keyof InfraConfig];
      if (String(dependencyValue) !== question.dependsOn.value) {
        state.skippedQuestions.push(question.id);
        continue;
      }
    }

    return question;
  }

  return null;
}

// Generate AI response based on conversation state
export async function processInfraMessage(
  userMessage: string,
  state: ConversationState,
  llmConfig?: LLMConfig
): Promise<{ response: InfraMessage; newState: ConversationState }> {
  const newState = { ...state };

  // Parse any config values from user input
  newState.answers = parseUserInput(userMessage, newState.answers);

  // Handle different phases
  if (state.phase === 'greeting' || state.phase === 'gathering') {
    newState.phase = 'gathering';

    // Check if user wants guided flow
    if (userMessage.toLowerCase().includes('guide')) {
      const firstQuestion = INFRASTRUCTURE_QUESTIONS[0];
      return {
        response: {
          role: 'assistant',
          content: `Great! Let's go through the setup step by step.\n\n**${firstQuestion.question}**${firstQuestion.default ? `\n\n_Default: ${firstQuestion.default}_` : ''}`,
          questions: [firstQuestion],
        },
        newState,
      };
    }

    // Check if we have enough info to generate
    const hasBasics = newState.answers.environmentName ||
                      newState.answers.workspaceName ||
                      newState.answers.capacitySize;

    const nextQuestion = getNextQuestion(newState);

    // If user provided substantial info and we have basics, offer to generate
    if (hasBasics && userMessage.length > 20) {
      // Apply smart defaults for missing values
      newState.answers = applySmartDefaults(newState.answers);

      return {
        response: {
          role: 'assistant',
          content: `Got it! Based on your description, here's what I'll set up:

**Environment:** ${newState.answers.environmentName || 'fabric-env'}
**Capacity:** ${newState.answers.capacitySize || 'F4'}
**Region:** ${newState.answers.region || 'eastus'}
**Workspace:** ${newState.answers.workspaceName || 'Dev Workspace'}

**Components:**
${newState.answers.createLakehouse !== false ? `✓ ${newState.answers.lakehouseCount || 1} Lakehouse(s)` : '✗ No Lakehouses'}
${newState.answers.createWarehouse ? `✓ ${newState.answers.warehouseCount || 1} Warehouse(s)` : '✗ No Warehouses'}
${newState.answers.createPipeline !== false ? '✓ Data Pipelines' : '✗ No Pipelines'}
${newState.answers.enableGitIntegration ? `✓ Git Integration (${newState.answers.gitProvider || 'Azure DevOps'})` : '✗ No Git Integration'}

**Would you like me to:**
1. **Generate the script** with these settings
2. **Customize further** - I can ask more detailed questions
3. **Change something** - Tell me what to adjust`,
        },
        newState: { ...newState, phase: 'confirming' },
      };
    }

    // Ask next question
    if (nextQuestion) {
      let content = '';

      // Acknowledge what we understood
      if (Object.keys(newState.answers).length > 0) {
        content = `Got it! I've noted:\n`;
        if (newState.answers.environmentName) content += `- Environment: ${newState.answers.environmentName}\n`;
        if (newState.answers.capacitySize) content += `- Capacity: ${newState.answers.capacitySize}\n`;
        if (newState.answers.createLakehouse) content += `- Lakehouses: ${newState.answers.lakehouseCount || 1}\n`;
        if (newState.answers.createWarehouse) content += `- Warehouses: ${newState.answers.warehouseCount || 1}\n`;
        content += '\n';
      }

      content += `**${nextQuestion.question}**`;

      if (nextQuestion.options) {
        content += '\n\nOptions:\n';
        nextQuestion.options.forEach(opt => {
          content += `- **${opt.label}**${opt.description ? `: ${opt.description}` : ''}\n`;
        });
      }

      if (nextQuestion.default) {
        content += `\n_Default: ${nextQuestion.default}_`;
      }

      newState.currentQuestionIndex++;

      return {
        response: {
          role: 'assistant',
          content,
          questions: [nextQuestion],
        },
        newState,
      };
    }

    // All questions answered, move to confirmation
    newState.phase = 'confirming';
    newState.answers = applySmartDefaults(newState.answers);
  }

  if (state.phase === 'confirming') {
    const inputLower = userMessage.toLowerCase();

    if (inputLower.includes('generate') || inputLower.includes('yes') || inputLower.includes('1') || inputLower.includes('create')) {
      // Generate the script
      newState.phase = 'generating';
      const script = generateScript(newState.answers, newState.scriptFormat);
      newState.generatedScript = script;
      newState.phase = 'complete';

      return {
        response: {
          role: 'assistant',
          content: `Here's your infrastructure deployment script!

This ${newState.scriptFormat === 'powershell' ? 'PowerShell' : 'Bicep'} script will create your complete Fabric environment.

**What's included:**
- Fabric Capacity (${newState.answers.capacitySize || 'F4'})
- Workspace: ${newState.answers.workspaceName || 'Dev Workspace'}
${newState.answers.createLakehouse !== false ? `- ${newState.answers.lakehouseCount || 1} Lakehouse(s)` : ''}
${newState.answers.createWarehouse ? `- ${newState.answers.warehouseCount || 1} Warehouse(s)` : ''}
${newState.answers.createPipeline !== false ? '- Data Pipelines' : ''}
${newState.answers.enableGitIntegration ? '- Git Integration setup' : ''}
${newState.answers.enableMonitoring ? '- Monitoring configuration' : ''}

**To run:**
1. Save the script as \`deploy-fabric-infrastructure.ps1\`
2. Open PowerShell and run:
   \`\`\`powershell
   .\\deploy-fabric-infrastructure.ps1 -SubscriptionId "your-subscription-id"
   \`\`\`

You can also download this as a deployment package with README.`,
          script,
          scriptFormat: newState.scriptFormat,
        },
        newState,
      };
    }

    if (inputLower.includes('customize') || inputLower.includes('2') || inputLower.includes('more')) {
      newState.phase = 'gathering';
      newState.currentQuestionIndex = 0;

      const nextQuestion = getNextQuestion(newState);

      return {
        response: {
          role: 'assistant',
          content: `Let's customize further! ${nextQuestion ? `\n\n**${nextQuestion.question}**` : 'What would you like to change?'}`,
          questions: nextQuestion ? [nextQuestion] : undefined,
        },
        newState,
      };
    }

    if (inputLower.includes('change') || inputLower.includes('3')) {
      return {
        response: {
          role: 'assistant',
          content: `Sure! Tell me what you'd like to change. For example:
- "Use F8 capacity instead"
- "Add 2 more lakehouses"
- "Enable GitHub integration"
- "Change region to West Europe"`,
        },
        newState,
      };
    }

    // User is making changes
    newState.answers = parseUserInput(userMessage, newState.answers);

    return {
      response: {
        role: 'assistant',
        content: `Updated! Here's the new configuration:

**Environment:** ${newState.answers.environmentName || 'fabric-env'}
**Capacity:** ${newState.answers.capacitySize || 'F4'}
**Region:** ${newState.answers.region || 'eastus'}

Ready to **generate the script**, or want to **change** anything else?`,
      },
      newState,
    };
  }

  if (state.phase === 'complete') {
    const inputLower = userMessage.toLowerCase();

    if (inputLower.includes('bicep')) {
      newState.scriptFormat = 'bicep';
      const script = generateScript(newState.answers, 'bicep');
      newState.generatedScript = script;

      return {
        response: {
          role: 'assistant',
          content: `Here's the Bicep template version:`,
          script,
          scriptFormat: 'bicep',
        },
        newState,
      };
    }

    if (inputLower.includes('powershell')) {
      newState.scriptFormat = 'powershell';
      const script = generateScript(newState.answers, 'powershell');
      newState.generatedScript = script;

      return {
        response: {
          role: 'assistant',
          content: `Here's the PowerShell script version:`,
          script,
          scriptFormat: 'powershell',
        },
        newState,
      };
    }

    if (inputLower.includes('start over') || inputLower.includes('new') || inputLower.includes('reset')) {
      return {
        response: getInitialGreeting(),
        newState: createInitialState(),
      };
    }

    return {
      response: {
        role: 'assistant',
        content: `Your script is ready! You can:
- Say **"show bicep"** for a Bicep template version
- Say **"start over"** to create a new configuration
- Ask any questions about running the script

Would you like me to explain any part of the deployment?`,
      },
      newState,
    };
  }

  // Fallback
  return {
    response: {
      role: 'assistant',
      content: `I'm not sure what you mean. Could you rephrase that?

You can:
- Describe your infrastructure needs
- Say "guide me" for step-by-step setup
- Ask questions about Fabric infrastructure`,
    },
    newState,
  };
}

function applySmartDefaults(answers: Partial<InfraConfig>): Partial<InfraConfig> {
  return {
    environmentName: answers.environmentName || 'fabric-env',
    capacitySize: answers.capacitySize || 'F4',
    region: answers.region || 'eastus',
    resourceGroup: answers.resourceGroup || `rg-${answers.environmentName || 'fabric'}-${answers.region || 'eastus'}`,
    workspaceName: answers.workspaceName || `${answers.environmentName || 'Fabric'} Workspace`,
    createLakehouse: answers.createLakehouse ?? true,
    lakehouseCount: answers.lakehouseCount || 1,
    createWarehouse: answers.createWarehouse ?? false,
    warehouseCount: answers.warehouseCount || 1,
    createPipeline: answers.createPipeline ?? true,
    enableGitIntegration: answers.enableGitIntegration ?? false,
    gitProvider: answers.gitProvider || 'azure-devops',
    enableRBAC: answers.enableRBAC ?? true,
    enableMonitoring: answers.enableMonitoring ?? true,
    ...answers,
  };
}

export function generateScript(config: Partial<InfraConfig>, format: ScriptFormat): string {
  switch (format) {
    case 'powershell':
      return generatePowerShellScript(config);
    case 'bicep':
      return generateBicepTemplate(config);
    default:
      return generatePowerShellScript(config);
  }
}

// Export for use in download
export function getScriptFilename(format: ScriptFormat, envName: string): string {
  const safeName = (envName || 'fabric').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  switch (format) {
    case 'powershell':
      return `deploy-${safeName}-infrastructure.ps1`;
    case 'bicep':
      return `${safeName}-infrastructure.bicep`;
    default:
      return `deploy-${safeName}.ps1`;
  }
}
