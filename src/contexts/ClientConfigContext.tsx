import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type {
  ClientConfig,
  ClientConfigState,
  ClientConfigAction,
  ClientConfigFormData,
} from '@/types';
import { clientConfigService } from '@/services/clientConfigService';

const initialState: ClientConfigState = {
  configurations: [],
  activeConfigId: null,
  isLoading: true,
  error: null,
};

function clientConfigReducer(state: ClientConfigState, action: ClientConfigAction): ClientConfigState {
  switch (action.type) {
    case 'SET_CONFIGURATIONS':
      return {
        ...state,
        configurations: action.payload,
        isLoading: false,
      };
    case 'ADD_CONFIGURATION':
      return {
        ...state,
        configurations: [...state.configurations, action.payload],
      };
    case 'UPDATE_CONFIGURATION':
      return {
        ...state,
        configurations: state.configurations.map((config) =>
          config.id === action.payload.id ? action.payload : config
        ),
      };
    case 'DELETE_CONFIGURATION':
      return {
        ...state,
        configurations: state.configurations.filter((config) => config.id !== action.payload),
        activeConfigId: state.activeConfigId === action.payload ? null : state.activeConfigId,
      };
    case 'SET_ACTIVE_CONFIG':
      return {
        ...state,
        activeConfigId: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    default:
      return state;
  }
}

interface ClientConfigContextValue {
  state: ClientConfigState;
  dispatch: React.Dispatch<ClientConfigAction>;
  activeConfig: ClientConfig | null;
  addConfiguration: (data: ClientConfigFormData) => ClientConfig;
  updateConfiguration: (id: string, data: ClientConfigFormData) => void;
  deleteConfiguration: (id: string) => void;
  setActiveConfig: (id: string | null) => void;
}

const ClientConfigContext = createContext<ClientConfigContextValue | null>(null);

interface ClientConfigProviderProps {
  children: ReactNode;
}

export function ClientConfigProvider({ children }: ClientConfigProviderProps) {
  const [state, dispatch] = useReducer(clientConfigReducer, initialState);

  // Load configurations from localStorage on mount
  useEffect(() => {
    const loadConfigurations = () => {
      try {
        const configs = clientConfigService.getConfigurations();
        const activeId = clientConfigService.getActiveConfigId();
        dispatch({ type: 'SET_CONFIGURATIONS', payload: configs });
        if (activeId) {
          dispatch({ type: 'SET_ACTIVE_CONFIG', payload: activeId });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load configurations' });
      }
    };
    loadConfigurations();
  }, []);

  // Persist configurations whenever they change
  useEffect(() => {
    if (!state.isLoading) {
      clientConfigService.saveConfigurations(state.configurations);
    }
  }, [state.configurations, state.isLoading]);

  // Persist active config ID
  useEffect(() => {
    if (!state.isLoading) {
      clientConfigService.saveActiveConfigId(state.activeConfigId);
    }
  }, [state.activeConfigId, state.isLoading]);

  const activeConfig = state.configurations.find(
    (config) => config.id === state.activeConfigId
  ) || null;

  const addConfiguration = (data: ClientConfigFormData): ClientConfig => {
    const now = new Date().toISOString();
    const newConfig: ClientConfig = {
      id: uuidv4(),
      name: data.name.trim(),
      azureAD: {
        tenantId: data.tenantId.trim(),
        applicationId: data.applicationId.trim(),
        displayName: data.displayName?.trim(),
      },
      createdAt: now,
      updatedAt: now,
      isDefault: state.configurations.length === 0,
    };
    dispatch({ type: 'ADD_CONFIGURATION', payload: newConfig });

    // Auto-select if first configuration
    if (state.configurations.length === 0) {
      dispatch({ type: 'SET_ACTIVE_CONFIG', payload: newConfig.id });
    }

    return newConfig;
  };

  const updateConfiguration = (id: string, data: ClientConfigFormData) => {
    const existing = state.configurations.find((config) => config.id === id);
    if (!existing) return;

    const updated: ClientConfig = {
      ...existing,
      name: data.name.trim(),
      azureAD: {
        tenantId: data.tenantId.trim(),
        applicationId: data.applicationId.trim(),
        displayName: data.displayName?.trim(),
      },
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: 'UPDATE_CONFIGURATION', payload: updated });
  };

  const deleteConfiguration = (id: string) => {
    dispatch({ type: 'DELETE_CONFIGURATION', payload: id });
  };

  const setActiveConfig = (id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_CONFIG', payload: id });
  };

  const value: ClientConfigContextValue = {
    state,
    dispatch,
    activeConfig,
    addConfiguration,
    updateConfiguration,
    deleteConfiguration,
    setActiveConfig,
  };

  return (
    <ClientConfigContext.Provider value={value}>
      {children}
    </ClientConfigContext.Provider>
  );
}

export function useClientConfig(): ClientConfigContextValue {
  const context = useContext(ClientConfigContext);
  if (!context) {
    throw new Error('useClientConfig must be used within a ClientConfigProvider');
  }
  return context;
}

export { ClientConfigContext };
