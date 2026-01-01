/**
 * Azure AD App Registration Configuration
 */
export interface AzureADConfig {
  /** Azure AD Tenant ID (GUID) */
  tenantId: string;
  /** Application (Client) ID from App Registration */
  applicationId: string;
  /** Optional: Display name for this configuration */
  displayName?: string;
}

/**
 * Client Configuration for the Dashboard
 */
export interface ClientConfig {
  /** Unique identifier for this configuration */
  id: string;
  /** User-friendly name for this configuration */
  name: string;
  /** Azure AD configuration */
  azureAD: AzureADConfig;
  /** When this configuration was created */
  createdAt: string;
  /** When this configuration was last modified */
  updatedAt: string;
  /** Whether this is the active/default configuration */
  isDefault: boolean;
}

/**
 * Client Configuration State
 */
export interface ClientConfigState {
  /** All saved configurations */
  configurations: ClientConfig[];
  /** Currently active configuration ID */
  activeConfigId: string | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
}

/**
 * Client Configuration Actions
 */
export type ClientConfigAction =
  | { type: 'SET_CONFIGURATIONS'; payload: ClientConfig[] }
  | { type: 'ADD_CONFIGURATION'; payload: ClientConfig }
  | { type: 'UPDATE_CONFIGURATION'; payload: ClientConfig }
  | { type: 'DELETE_CONFIGURATION'; payload: string }
  | { type: 'SET_ACTIVE_CONFIG'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

/**
 * Form data for creating/editing configurations
 */
export interface ClientConfigFormData {
  name: string;
  tenantId: string;
  applicationId: string;
  displayName?: string;
}

/**
 * Validation result for client configuration
 */
export interface ConfigValidationResult {
  isValid: boolean;
  errors: {
    name?: string;
    tenantId?: string;
    applicationId?: string;
  };
}

/**
 * Validates a GUID format
 */
export function isValidGuid(value: string): boolean {
  const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return guidRegex.test(value);
}

/**
 * Validates client configuration form data
 */
export function validateClientConfig(data: ClientConfigFormData): ConfigValidationResult {
  const errors: ConfigValidationResult['errors'] = {};

  if (!data.name || data.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  if (!data.tenantId || data.tenantId.trim().length === 0) {
    errors.tenantId = 'Tenant ID is required';
  } else if (!isValidGuid(data.tenantId.trim())) {
    errors.tenantId = 'Tenant ID must be a valid GUID';
  }

  if (!data.applicationId || data.applicationId.trim().length === 0) {
    errors.applicationId = 'Application ID is required';
  } else if (!isValidGuid(data.applicationId.trim())) {
    errors.applicationId = 'Application ID must be a valid GUID';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
