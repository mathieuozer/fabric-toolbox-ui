import { describe, it, expect } from 'vitest';
import { isValidGuid, validateClientConfig, type ClientConfigFormData } from '../clientConfig';

describe('isValidGuid', () => {
  it('returns true for valid GUIDs', () => {
    expect(isValidGuid('12345678-1234-1234-1234-123456789012')).toBe(true);
    expect(isValidGuid('ABCDEF01-2345-6789-ABCD-EF0123456789')).toBe(true);
    expect(isValidGuid('abcdef01-2345-6789-abcd-ef0123456789')).toBe(true);
  });

  it('returns false for invalid GUIDs', () => {
    expect(isValidGuid('')).toBe(false);
    expect(isValidGuid('not-a-guid')).toBe(false);
    expect(isValidGuid('12345678-1234-1234-1234-12345678901')).toBe(false); // too short
    expect(isValidGuid('12345678-1234-1234-1234-1234567890123')).toBe(false); // too long
    expect(isValidGuid('12345678123412341234123456789012')).toBe(false); // no dashes
    expect(isValidGuid('GHIJKLMN-1234-1234-1234-123456789012')).toBe(false); // invalid chars
  });
});

describe('validateClientConfig', () => {
  it('returns valid for complete valid data', () => {
    const data: ClientConfigFormData = {
      name: 'Test Config',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('returns error for empty name', () => {
    const data: ClientConfigFormData = {
      name: '',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe('Name is required');
  });

  it('returns error for short name', () => {
    const data: ClientConfigFormData = {
      name: 'A',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.name).toBe('Name must be at least 2 characters');
  });

  it('returns error for empty tenantId', () => {
    const data: ClientConfigFormData = {
      name: 'Test Config',
      tenantId: '',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.tenantId).toBe('Tenant ID is required');
  });

  it('returns error for invalid tenantId format', () => {
    const data: ClientConfigFormData = {
      name: 'Test Config',
      tenantId: 'not-a-valid-guid',
      applicationId: '87654321-4321-4321-4321-210987654321',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.tenantId).toBe('Tenant ID must be a valid GUID');
  });

  it('returns error for empty applicationId', () => {
    const data: ClientConfigFormData = {
      name: 'Test Config',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: '',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.applicationId).toBe('Application ID is required');
  });

  it('returns error for invalid applicationId format', () => {
    const data: ClientConfigFormData = {
      name: 'Test Config',
      tenantId: '12345678-1234-1234-1234-123456789012',
      applicationId: 'invalid',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(false);
    expect(result.errors.applicationId).toBe('Application ID must be a valid GUID');
  });

  it('returns multiple errors for multiple invalid fields', () => {
    const data: ClientConfigFormData = {
      name: '',
      tenantId: 'invalid',
      applicationId: 'also-invalid',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toHaveLength(3);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.tenantId).toBeDefined();
    expect(result.errors.applicationId).toBeDefined();
  });

  it('trims whitespace from values before validation', () => {
    const data: ClientConfigFormData = {
      name: '  Test Config  ',
      tenantId: '  12345678-1234-1234-1234-123456789012  ',
      applicationId: '  87654321-4321-4321-4321-210987654321  ',
    };

    const result = validateClientConfig(data);

    expect(result.isValid).toBe(true);
  });
});
