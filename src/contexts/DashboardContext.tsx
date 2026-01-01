import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { DashboardState, DashboardAction, AuthState } from '@/types';

const initialAuthState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  user: null,
};

const initialState: DashboardState = {
  auth: initialAuthState,
  isLoading: false,
  error: null,
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_AUTH':
      return {
        ...state,
        auth: action.payload,
        error: null,
      };
    case 'CLEAR_AUTH':
      return {
        ...state,
        auth: initialAuthState,
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

interface DashboardContextValue {
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
  setAuth: (auth: AuthState) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

interface DashboardProviderProps {
  children: ReactNode;
  initialState?: Partial<DashboardState>;
}

export function DashboardProvider({ children, initialState: customInitialState }: DashboardProviderProps) {
  const [state, dispatch] = useReducer(dashboardReducer, {
    ...initialState,
    ...customInitialState,
  });

  const setAuth = (auth: AuthState) => {
    dispatch({ type: 'SET_AUTH', payload: auth });
  };

  const clearAuth = () => {
    dispatch({ type: 'CLEAR_AUTH' });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const value: DashboardContextValue = {
    state,
    dispatch,
    setAuth,
    clearAuth,
    setLoading,
    setError,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

export { DashboardContext };
