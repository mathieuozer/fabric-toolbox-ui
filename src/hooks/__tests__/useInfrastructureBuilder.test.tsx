import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInfrastructureBuilder } from '../useInfrastructureBuilder';

// Mock infrastructure service
const mockProcessInfraMessage = vi.fn();
const mockGetInitialGreeting = vi.fn();
const mockCreateInitialState = vi.fn();
const mockGenerateScript = vi.fn();
const mockGetScriptFilename = vi.fn();
const mockApplyTemplate = vi.fn();
const mockEstimateCost = vi.fn();

const mockTemplates = [
  { id: 'starter', name: 'Starter', config: { capacitySize: 'F2' } },
  { id: 'enterprise', name: 'Enterprise', config: { capacitySize: 'F32' } },
];

vi.mock('../../services/infrastructureService', () => ({
  processInfraMessage: (...args: unknown[]) => mockProcessInfraMessage(...args),
  getInitialGreeting: () => mockGetInitialGreeting(),
  createInitialState: () => mockCreateInitialState(),
  generateScript: (...args: unknown[]) => mockGenerateScript(...args),
  getScriptFilename: (...args: unknown[]) => mockGetScriptFilename(...args),
  applyTemplate: (...args: unknown[]) => mockApplyTemplate(...args),
  estimateCost: (...args: unknown[]) => mockEstimateCost(...args),
  INFRASTRUCTURE_TEMPLATES: [
    { id: 'starter', name: 'Starter', config: { capacitySize: 'F2' } },
    { id: 'enterprise', name: 'Enterprise', config: { capacitySize: 'F32' } },
  ],
}));

// Mock LLM service
vi.mock('../../services/llmService', () => ({
  getLLMConfig: () => ({}),
}));

describe('useInfrastructureBuilder', () => {
  const mockGreeting = {
    role: 'assistant' as const,
    content: 'Welcome to Infrastructure Builder!',
  };

  const mockInitialState = {
    phase: 'greeting' as const,
    currentQuestionIndex: 0,
    answers: {},
    skippedQuestions: [],
    scriptFormat: 'powershell' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetInitialGreeting.mockReturnValue(mockGreeting);
    mockCreateInitialState.mockReturnValue(mockInitialState);
  });

  describe('initial state', () => {
    it('starts with initial greeting message', () => {
      const { result } = renderHook(() => useInfrastructureBuilder());

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0]).toEqual(mockGreeting);
    });

    it('starts with initial conversation state', () => {
      const { result } = renderHook(() => useInfrastructureBuilder());

      expect(result.current.conversationState).toEqual(mockInitialState);
    });

    it('starts not processing', () => {
      const { result } = renderHook(() => useInfrastructureBuilder());

      expect(result.current.isProcessing).toBe(false);
    });

    it('starts with no error', () => {
      const { result } = renderHook(() => useInfrastructureBuilder());

      expect(result.current.error).toBeNull();
    });
  });

  describe('sendMessage', () => {
    it('adds user message to history', async () => {
      mockProcessInfraMessage.mockResolvedValue({
        response: { role: 'assistant', content: 'Response' },
        newState: mockInitialState,
      });

      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages).toHaveLength(3); // greeting + user + response
      expect(result.current.messages[1].role).toBe('user');
      expect(result.current.messages[1].content).toBe('Hello');
    });

    it('adds assistant response to history', async () => {
      const mockResponse = { role: 'assistant' as const, content: 'Here is my response' };
      mockProcessInfraMessage.mockResolvedValue({
        response: mockResponse,
        newState: mockInitialState,
      });

      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages[2]).toEqual(mockResponse);
    });

    it('updates conversation state', async () => {
      const newState = {
        ...mockInitialState,
        phase: 'gathering' as const,
        answers: { environmentName: 'test' },
      };
      mockProcessInfraMessage.mockResolvedValue({
        response: { role: 'assistant', content: 'Response' },
        newState,
      });

      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('Create env called test');
      });

      expect(result.current.conversationState).toEqual(newState);
    });

    it('ignores empty messages', async () => {
      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('   ');
      });

      expect(mockProcessInfraMessage).not.toHaveBeenCalled();
      expect(result.current.messages).toHaveLength(1); // Just greeting
    });

    it('sets error on failure', async () => {
      mockProcessInfraMessage.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.error).toBe('Test error');
    });
  });

  describe('reset', () => {
    it('resets to initial state', async () => {
      mockProcessInfraMessage.mockResolvedValue({
        response: { role: 'assistant', content: 'Response' },
        newState: { ...mockInitialState, phase: 'gathering' },
      });

      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('Hello');
      });

      expect(result.current.messages.length).toBeGreaterThan(1);

      act(() => {
        result.current.reset();
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.conversationState).toEqual(mockInitialState);
      expect(result.current.error).toBeNull();
    });
  });

  describe('regenerateScript', () => {
    it('generates script in specified format', async () => {
      const mockScript = '# PowerShell script';
      mockGenerateScript.mockReturnValue(mockScript);

      mockProcessInfraMessage.mockResolvedValue({
        response: { role: 'assistant', content: 'Script generated', script: mockScript },
        newState: { ...mockInitialState, phase: 'complete', answers: { environmentName: 'test' } },
      });

      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('generate');
      });

      act(() => {
        result.current.regenerateScript('bicep');
      });

      expect(mockGenerateScript).toHaveBeenCalled();
      expect(result.current.conversationState.scriptFormat).toBe('bicep');
    });
  });

  describe('getConfig', () => {
    it('returns current answers', async () => {
      const answers = { environmentName: 'test-env', capacitySize: 'F4' };
      mockProcessInfraMessage.mockResolvedValue({
        response: { role: 'assistant', content: 'Response' },
        newState: { ...mockInitialState, answers },
      });

      const { result } = renderHook(() => useInfrastructureBuilder());

      await act(async () => {
        await result.current.sendMessage('Create test-env with F4');
      });

      expect(result.current.getConfig()).toEqual(answers);
    });
  });
});
