// LLM Service for natural language tool discovery
import { TOOLS_MANIFEST, ToolManifest, searchTools } from '../data/toolsManifest';

export interface LLMConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ToolRecommendation {
  tool: ToolManifest;
  score: number;
  reason: string;
}

// Keywords mapping for semantic matching (fallback when no API key)
const SEMANTIC_KEYWORDS: Record<string, string[]> = {
  // Migration
  'migrate': ['adf-migrate', 'gen2-copy', 'pbi-modernize', 'open-mirror'],
  'migration': ['adf-migrate', 'gen2-copy', 'pbi-modernize', 'open-mirror'],
  'move': ['adf-migrate', 'gen2-copy', 'copy-wh'],
  'transfer': ['adf-migrate', 'gen2-copy', 'copy-wh', 'open-mirror'],

  // Data Factory / ADF
  'adf': ['adf-migrate'],
  'data factory': ['adf-migrate'],
  'azure data factory': ['adf-migrate'],
  'pipeline': ['adf-migrate', 'cicd-pipelines', 'cicd-git', 'adv-schedule'],
  'pipelines': ['adf-migrate', 'cicd-pipelines', 'cicd-git', 'adv-schedule'],

  // Monitoring
  'monitor': ['fca', 'fuam', 'fsm', 'fpm', 'wsm', 'dw-requests'],
  'monitoring': ['fca', 'fuam', 'fsm', 'fpm', 'wsm', 'dw-requests'],
  'dashboard': ['fca', 'fuam', 'wsm', 'fpm'],
  'cost': ['fca'],
  'costs': ['fca'],
  'spending': ['fca'],
  'admin': ['fuam'],
  'spark': ['fsm', 'nb-pool'],

  // Performance
  'performance': ['dax-perf', 'dax-mcp', 'tpch', 'dw-requests'],
  'optimize': ['dax-perf', 'dax-mcp'],
  'slow': ['dax-perf', 'dax-mcp', 'dw-kill', 'dw-requests'],
  'fast': ['dax-perf', 'tpch'],
  'benchmark': ['tpch'],

  // DAX
  'dax': ['dax-perf', 'dax-mcp'],

  // Semantic Model
  'semantic': ['sem-mcp', 'sem-audit'],
  'semantic model': ['sem-mcp', 'sem-audit'],
  'dataset': ['sem-mcp', 'sem-audit'],

  // CI/CD
  'cicd': ['cicd-pipelines', 'cicd-git', 'cicd-branch'],
  'ci/cd': ['cicd-pipelines', 'cicd-git', 'cicd-branch'],
  'deploy': ['cicd-pipelines', 'cicd-git', 'cicd-branch'],
  'deployment': ['cicd-pipelines', 'cicd-git', 'cicd-branch'],
  'git': ['cicd-git', 'cicd-branch'],
  'branch': ['cicd-branch'],

  // Backup / DR
  'backup': ['bcdr', 'dw-backup'],
  'recovery': ['bcdr', 'dw-backup'],
  'disaster': ['bcdr'],
  'dr': ['bcdr'],

  // Warehouse
  'warehouse': ['copy-wh', 'dw-backup', 'dw-requests', 'dw-kill', 'nb-warehouse', 'gen2-copy'],
  'dw': ['copy-wh', 'dw-backup', 'dw-requests', 'dw-kill', 'nb-warehouse'],
  'sql': ['mirror-cci', 'dw-requests', 'dw-kill', 'ci-views', 'dw-props', 'dw-dmv'],
  'query': ['dw-requests', 'dw-kill', 'dw-timepoint', 'dax-perf'],
  'queries': ['dw-requests', 'dw-kill', 'dw-timepoint', 'dax-perf'],
  'kill': ['dw-kill'],

  // Real-time
  'real-time': ['rti-eventhouse', 'rti-eventstream', 'fsm', 'fpm'],
  'realtime': ['rti-eventhouse', 'rti-eventstream', 'fsm', 'fpm'],
  'rti': ['rti-eventhouse', 'rti-eventstream'],
  'streaming': ['rti-eventstream'],
  'eventhouse': ['rti-eventhouse'],
  'eventstream': ['rti-eventstream'],
  'kql': ['rti-eventhouse'],

  // Mirroring
  'mirror': ['open-mirror', 'mirror-sdk', 'mirror-cci'],
  'mirroring': ['open-mirror', 'mirror-sdk', 'mirror-cci'],
  'sync': ['open-mirror', 'mirror-sdk'],
  'replicate': ['open-mirror', 'mirror-sdk'],

  // Policy / Security
  'policy': ['policy-weaver', 'az-policy'],
  'policies': ['policy-weaver', 'az-policy'],
  'security': ['policy-weaver'],
  'access': ['policy-weaver'],
  'governance': ['az-policy', 'policy-weaver'],

  // Synapse / Gen2
  'synapse': ['gen2-copy'],
  'gen2': ['gen2-copy'],
  'dedicated pool': ['gen2-copy'],

  // MCP / AI
  'mcp': ['sem-mcp', 'dax-mcp'],
  'ai': ['sem-mcp', 'dax-mcp'],
  'claude': ['sem-mcp', 'dax-mcp'],
  'assistant': ['sem-mcp', 'dax-mcp'],

  // PowerShell
  'powershell': ['ps-module', 'cicd-pipelines', 'rti-eventhouse', 'rti-eventstream'],

  // Notebook
  'notebook': ['nb-refresh', 'nb-size', 'nb-pool', 'nb-warehouse', 'adv-schedule', 'poll-trigger', 'viz-dataflows'],

  // Dataflow
  'dataflow': ['viz-dataflows', 'pbi-modernize'],
  'dataflows': ['viz-dataflows'],

  // Trigger
  'trigger': ['poll-trigger', 'adv-schedule'],
  'schedule': ['adv-schedule'],
  'scheduling': ['adv-schedule'],

  // Size / Storage
  'size': ['nb-size'],
  'storage': ['nb-size', 'poll-trigger'],
  'space': ['nb-size'],

  // Audit
  'audit': ['sem-audit'],
  'best practices': ['sem-audit'],
};

// System prompt for LLM
const SYSTEM_PROMPT = `You are a helpful assistant for the Microsoft Fabric Toolbox. Your job is to help users find the right tools for their needs.

Available tools:
${TOOLS_MANIFEST.map(t => `- ${t.name} (${t.id}): ${t.description} [Category: ${t.category}, Type: ${t.type}]`).join('\n')}

When a user describes what they want to do, recommend the most relevant tools and explain why. Be concise and helpful.
Format your response as:
1. **Recommended Tool**: [Tool Name] - Brief explanation of why this is a good fit
2. Additional tools if relevant

If you're not sure which tool to recommend, ask clarifying questions.`;

// Local semantic search (no API key required)
export function semanticSearch(query: string): ToolRecommendation[] {
  const queryLower = query.toLowerCase();
  const scores = new Map<string, { score: number; matchedKeywords: string[] }>();

  // Score based on keyword matches
  for (const [keyword, toolIds] of Object.entries(SEMANTIC_KEYWORDS)) {
    if (queryLower.includes(keyword)) {
      for (const toolId of toolIds) {
        const current = scores.get(toolId) || { score: 0, matchedKeywords: [] };
        current.score += keyword.split(' ').length; // Multi-word keywords score higher
        current.matchedKeywords.push(keyword);
        scores.set(toolId, current);
      }
    }
  }

  // Also include basic text search results
  const textResults = searchTools(query);
  for (const tool of textResults) {
    const current = scores.get(tool.id) || { score: 0, matchedKeywords: [] };
    current.score += 0.5; // Lower score for text matches
    scores.set(tool.id, current);
  }

  // Convert to recommendations
  const recommendations: ToolRecommendation[] = [];
  for (const [toolId, { score, matchedKeywords }] of scores) {
    const tool = TOOLS_MANIFEST.find(t => t.id === toolId);
    if (tool) {
      const reason = matchedKeywords.length > 0
        ? `Matches: ${matchedKeywords.join(', ')}`
        : 'Text match in name or description';
      recommendations.push({ tool, score, reason });
    }
  }

  // Sort by score descending
  recommendations.sort((a, b) => b.score - a.score);

  return recommendations.slice(0, 5);
}

// Generate a helpful response for the recommendations
export function generateLocalResponse(query: string, recommendations: ToolRecommendation[]): string {
  if (recommendations.length === 0) {
    return `I couldn't find tools matching "${query}". Try describing what you want to accomplish, like:\n- "migrate from Azure Data Factory"\n- "monitor Fabric costs"\n- "improve DAX performance"`;
  }

  let response = `Based on your query, here are the recommended tools:\n\n`;

  recommendations.forEach((rec, i) => {
    response += `**${i + 1}. ${rec.tool.name}**\n`;
    response += `${rec.tool.description}\n`;
    response += `*${rec.reason}*\n\n`;
  });

  response += `Click on any tool to configure and run it.`;

  return response;
}

// LLM API call (when API key is configured)
export async function callLLM(
  messages: ChatMessage[],
  config: LLMConfig
): Promise<string> {
  if (!config.apiKey) {
    throw new Error('API key not configured');
  }

  const endpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';
  const model = config.model || 'claude-3-haiku-20240307';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.filter(m => m.role !== 'system').map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error('LLM API error:', error);
    throw error;
  }
}

// Main chat function - uses LLM if configured, otherwise semantic search
export async function chat(
  query: string,
  config?: LLMConfig
): Promise<{ response: string; recommendations: ToolRecommendation[] }> {
  const recommendations = semanticSearch(query);

  if (config?.apiKey) {
    try {
      const response = await callLLM(
        [{ role: 'user', content: query }],
        config
      );
      return { response, recommendations };
    } catch {
      // Fallback to local response on API error
      return {
        response: generateLocalResponse(query, recommendations),
        recommendations,
      };
    }
  }

  return {
    response: generateLocalResponse(query, recommendations),
    recommendations,
  };
}

// Storage key for API config
const CONFIG_KEY = 'fabric-toolbox-llm-config';

export function getLLMConfig(): LLMConfig {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function saveLLMConfig(config: LLMConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// ============ CONFIG EXTRACTION ============

export interface ExtractedConfig {
  [key: string]: string;
}

// Patterns for extracting common config values from natural language
// Format: field name -> array of regex patterns (tried in order)
const CONFIG_PATTERNS: Record<string, RegExp[]> = {
  // Workspace IDs (GUIDs) - flexible matching
  workspaceId: [
    /workspace\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /workspace[:\s=]+([a-f0-9-]{36})/i,
    /to\s+(?:workspace\s+)?([a-f0-9-]{36})/i,
    /into\s+(?:workspace\s+)?([a-f0-9-]{36})/i,
  ],
  sourceWorkspaceId: [
    /source\s+workspace\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /from\s+(?:workspace\s+)?([a-f0-9-]{36})/i,
  ],
  targetWorkspaceId: [
    /target\s+workspace\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /to\s+(?:workspace\s+)?([a-f0-9-]{36})/i,
    /destination\s+(?:workspace\s+)?([a-f0-9-]{36})/i,
    /into\s+(?:workspace\s+)?([a-f0-9-]{36})/i,
  ],

  // Capacity IDs
  capacityId: [
    /capacity\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /capacity[:\s=]+([a-f0-9-]{36})/i,
  ],

  // Tenant IDs
  tenantId: [
    /tenant\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /tenant[:\s=]+([a-f0-9-]{36})/i,
  ],

  // Azure Resource Groups - more flexible
  adfResourceGroup: [
    /resource\s*group[:\s=]+["']?([a-zA-Z0-9_-]+)["']?/i,
    /rg[:\s=]+["']?([a-zA-Z0-9_-]+)["']?/i,
    /in\s+(?:resource\s*group\s+)?["']?([a-zA-Z0-9_-]+)["']?\s+(?:resource|rg)/i,
    /(?:rg|resource\s*group)\s+["']?([a-zA-Z0-9_-]+)["']?/i,
  ],

  // ADF Names - more flexible
  adfName: [
    /(?:adf|data\s*factory)\s*(?:name)?[:\s=]+["']?([a-zA-Z0-9_-]+)["']?/i,
    /factory\s+(?:called|named)\s+["']?([a-zA-Z0-9_-]+)["']?/i,
    /(?:adf|factory)\s+["']?([a-zA-Z0-9_-]+)["']?/i,
    /from\s+(?:adf|factory)\s+["']?([a-zA-Z0-9_-]+)["']?/i,
  ],

  // Server/Endpoint names
  serverName: [
    /server\s*(?:name)?[:\s=]+["']?([a-zA-Z0-9._-]+)["']?/i,
    /endpoint[:\s=]+["']?([a-zA-Z0-9._-]+(?:\.database\.fabric\.microsoft\.com)?)["']?/i,
    /sql\s+endpoint[:\s=]+["']?([a-zA-Z0-9._-]+)["']?/i,
  ],

  // Database names
  databaseName: [
    /database\s*(?:name)?[:\s=]+["']?([a-zA-Z0-9_-]+)["']?/i,
    /db[:\s=]+["']?([a-zA-Z0-9_-]+)["']?/i,
  ],

  // Dataset/Semantic Model IDs
  datasetId: [
    /(?:dataset|semantic\s*model)\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /model\s+(?:id\s+)?([a-f0-9-]{36})/i,
  ],

  // Lakehouse IDs
  lakehouseId: [
    /lakehouse\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /lakehouse\s+([a-f0-9-]{36})/i,
  ],

  // Pipeline IDs
  pipelineId: [
    /pipeline\s*(?:id)?[:\s=]+([a-f0-9-]{36})/i,
    /pipeline\s+([a-f0-9-]{36})/i,
  ],

  // Connection strings
  sourceConnection: [
    /source\s+connection[:\s=]+["']?([^"'\n]+)["']?/i,
    /from\s+["']([^"']+)["']/i,
  ],
  targetConnection: [
    /target\s+connection[:\s=]+["']?([^"'\n]+)["']?/i,
    /to\s+["']([^"']+)["']/i,
  ],

  // Storage accounts
  storageAccount: [
    /storage\s*(?:account)?[:\s=]+["']?([a-z0-9]+)["']?/i,
    /storage\s+["']?([a-z0-9]+)["']?/i,
  ],

  // Container names
  containerName: [
    /container[:\s=]+["']?([a-z0-9-]+)["']?/i,
  ],

  // Branch names
  branch: [
    /branch[:\s=]+["']?([a-zA-Z0-9/_-]+)["']?/i,
  ],
  featureBranchName: [
    /feature\s+branch[:\s=]+["']?([a-zA-Z0-9/_-]+)["']?/i,
  ],

  // Repository URLs
  repoUrl: [
    /(https?:\/\/[^\s]+\.git)/i,
    /(git@[^\s]+\.git)/i,
  ],
};

// Example queries that demonstrate config extraction (shown in UI help)
export const EXAMPLE_QUERIES = [
  {
    query: 'migrate from ADF my-factory in resource group rg-production to workspace 12345678-1234-1234-1234-123456789abc',
    extracts: ['adfName: my-factory', 'adfResourceGroup: rg-production', 'targetWorkspaceId: 12345678-...'],
  },
  {
    query: 'monitor costs for capacity 87654321-4321-4321-4321-abcdef123456',
    extracts: ['capacityId: 87654321-...'],
  },
  {
    query: 'copy warehouse from server myserver.database.fabric.microsoft.com database sales_db',
    extracts: ['serverName: myserver...', 'databaseName: sales_db'],
  },
  {
    query: 'audit semantic model 11111111-2222-3333-4444-555555555555 in workspace 66666666-7777-8888-9999-000000000000',
    extracts: ['datasetId: 11111111-...', 'workspaceId: 66666666-...'],
  },
];

// Extract config values from natural language input
export function extractConfigValues(query: string, tool: ToolManifest): ExtractedConfig {
  const extracted: ExtractedConfig = {};
  const queryLower = query.toLowerCase();

  // For each config field the tool needs, try to extract a value
  for (const configField of tool.config) {
    const fieldName = configField.name;

    // Try patterns for this specific field
    const patterns = CONFIG_PATTERNS[fieldName];
    if (patterns) {
      for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match && match[1]) {
          extracted[fieldName] = match[1].trim();
          break;
        }
      }
    }

    // If no specific pattern matched, try generic GUID extraction for ID fields
    if (!extracted[fieldName] && fieldName.toLowerCase().includes('id')) {
      const guidMatch = query.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
      if (guidMatch) {
        // Only use if we haven't already used this GUID
        const usedGuids = Object.values(extracted);
        if (!usedGuids.includes(guidMatch[1])) {
          extracted[fieldName] = guidMatch[1];
        }
      }
    }
  }

  return extracted;
}

// Generate response that acknowledges extracted values
export function generateConfigAwareResponse(
  query: string,
  recommendations: ToolRecommendation[],
  extractedConfigs: Map<string, ExtractedConfig>
): string {
  if (recommendations.length === 0) {
    return `I couldn't find tools matching "${query}". Try describing what you want to accomplish, like:\n- "migrate from Azure Data Factory"\n- "monitor Fabric costs"\n- "improve DAX performance"`;
  }

  let response = `Based on your query, here are the recommended tools:\n\n`;

  recommendations.forEach((rec, i) => {
    const extracted = extractedConfigs.get(rec.tool.id) || {};
    const extractedCount = Object.keys(extracted).length;

    response += `**${i + 1}. ${rec.tool.name}**\n`;
    response += `${rec.tool.description}\n`;

    if (extractedCount > 0) {
      response += `\n✅ **Detected configuration:**\n`;
      for (const [key, value] of Object.entries(extracted)) {
        response += `- ${key}: \`${value}\`\n`;
      }
    }

    response += `\n`;
  });

  const hasAnyConfig = Array.from(extractedConfigs.values()).some(c => Object.keys(c).length > 0);
  if (hasAnyConfig) {
    response += `Click a tool to open config with these values pre-filled, then deploy and run.`;
  } else {
    response += `Click a tool to configure and run it.`;
  }

  return response;
}

// Enhanced chat function that also extracts config values
export async function chatWithConfigExtraction(
  query: string,
  config?: LLMConfig
): Promise<{
  response: string;
  recommendations: ToolRecommendation[];
  extractedConfigs: Map<string, ExtractedConfig>;
}> {
  const recommendations = semanticSearch(query);

  // Extract config values for each recommended tool
  const extractedConfigs = new Map<string, ExtractedConfig>();
  for (const rec of recommendations) {
    const extracted = extractConfigValues(query, rec.tool);
    if (Object.keys(extracted).length > 0) {
      extractedConfigs.set(rec.tool.id, extracted);
    }
  }

  // Generate response with config awareness
  const response = generateConfigAwareResponse(query, recommendations, extractedConfigs);

  return {
    response,
    recommendations,
    extractedConfigs,
  };
}
