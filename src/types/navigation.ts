import type { LucideIcon } from 'lucide-react';

/**
 * Navigation item for sidebar
 */
export interface NavItem {
  /** Route path */
  path: string;
  /** Display label */
  label: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Whether this is a tool module */
  isModule?: boolean;
  /** Badge content (e.g., "New", count) */
  badge?: string | number;
}

/**
 * Navigation group
 */
export interface NavGroup {
  /** Group label */
  label: string;
  /** Items in this group */
  items: NavItem[];
}

/**
 * Tool module definition
 */
export interface ToolModule {
  /** Unique module identifier */
  id: string;
  /** Display name */
  name: string;
  /** Description */
  description: string;
  /** Route path */
  path: string;
  /** Icon name (Lucide) */
  icon: LucideIcon;
  /** Whether module is enabled */
  enabled: boolean;
  /** Module version */
  version?: string;
}
