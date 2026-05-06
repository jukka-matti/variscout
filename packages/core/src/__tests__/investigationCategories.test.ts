/**
 * Tests for InvestigationCategory types, factory, migration, and inference
 */
import { describe, it, expect } from 'vitest';
import { createInvestigationCategory, getCategoryForFactor, CATEGORY_COLORS } from '../findings';
import type { InvestigationCategory } from '../findings';
import { inferCategoryName, CATEGORY_DISPLAY_NAMES } from '../parser/keywords';

// ============================================================================
// createInvestigationCategory
// ============================================================================

describe('createInvestigationCategory', () => {
  it('creates a category with unique ID and name', () => {
    const cat = createInvestigationCategory('Equipment', ['Machine', 'Fill Head']);
    expect(cat.id).toBeTruthy();
    expect(cat.name).toBe('Equipment');
    expect(cat.factorNames).toEqual(['Machine', 'Fill Head']);
    expect(cat.color).toBe(CATEGORY_COLORS[0]);
  });

  it('auto-assigns color from palette based on existingCount', () => {
    const cat0 = createInvestigationCategory('A', [], 0);
    const cat1 = createInvestigationCategory('B', [], 1);
    const cat2 = createInvestigationCategory('C', [], 2);
    expect(cat0.color).toBe(CATEGORY_COLORS[0]);
    expect(cat1.color).toBe(CATEGORY_COLORS[1]);
    expect(cat2.color).toBe(CATEGORY_COLORS[2]);
  });

  it('cycles colors when existingCount exceeds palette length', () => {
    const cat = createInvestigationCategory('Wrap', [], CATEGORY_COLORS.length);
    expect(cat.color).toBe(CATEGORY_COLORS[0]);
  });

  it('includes inferredFrom when provided', () => {
    const cat = createInvestigationCategory('Equipment', ['Machine'], 0, 'machine');
    expect(cat.inferredFrom).toBe('machine');
  });

  it('omits inferredFrom when not provided', () => {
    const cat = createInvestigationCategory('Custom', ['X']);
    expect(cat.inferredFrom).toBeUndefined();
  });

  it('generates unique IDs for each category', () => {
    const cat1 = createInvestigationCategory('A', []);
    const cat2 = createInvestigationCategory('B', []);
    expect(cat1.id).not.toBe(cat2.id);
  });
});

// ============================================================================
// getCategoryForFactor
// ============================================================================

describe('getCategoryForFactor', () => {
  const categories: InvestigationCategory[] = [
    {
      id: '1',
      name: 'Equipment',
      factorNames: ['Machine', 'Fill Head'],
      color: '#3b82f6',
      createdAt: 1714000000000,
      deletedAt: null,
    },
    {
      id: '2',
      name: 'Temporal',
      factorNames: ['Shift'],
      color: '#a855f7',
      createdAt: 1714000000000,
      deletedAt: null,
    },
  ];

  it('returns the category containing the factor', () => {
    expect(getCategoryForFactor(categories, 'Machine')?.name).toBe('Equipment');
    expect(getCategoryForFactor(categories, 'Fill Head')?.name).toBe('Equipment');
    expect(getCategoryForFactor(categories, 'Shift')?.name).toBe('Temporal');
  });

  it('returns undefined for uncategorized factors', () => {
    expect(getCategoryForFactor(categories, 'Unknown')).toBeUndefined();
  });

  it('returns undefined for empty categories', () => {
    expect(getCategoryForFactor([], 'Machine')).toBeUndefined();
  });
});

// ============================================================================
// inferCategoryName
// ============================================================================

describe('inferCategoryName', () => {
  it('returns "Equipment" for machine-related columns', () => {
    expect(inferCategoryName('Machine')).toBe('Equipment');
    expect(inferCategoryName('Fill Head')).toBe('Equipment');
    expect(inferCategoryName('nozzle_id')).toBe('Equipment');
  });

  it('returns "Temporal" for time-related columns', () => {
    expect(inferCategoryName('Shift')).toBe('Temporal');
    expect(inferCategoryName('Day')).toBe('Temporal');
    expect(inferCategoryName('week_num')).toBe('Temporal');
  });

  it('returns "People" for operator-related columns', () => {
    expect(inferCategoryName('Operator')).toBe('People');
    expect(inferCategoryName('Technician')).toBe('People');
    expect(inferCategoryName('team_lead')).toBe('People');
  });

  it('returns "Material" for material-related columns', () => {
    expect(inferCategoryName('Batch')).toBe('Material');
    expect(inferCategoryName('Supplier')).toBe('Material');
    expect(inferCategoryName('lot_number')).toBe('Material');
  });

  it('returns "Location" for location-related columns', () => {
    expect(inferCategoryName('Plant')).toBe('Location');
    expect(inferCategoryName('Zone')).toBe('Location');
    expect(inferCategoryName('department')).toBe('Location');
  });

  it('returns null for unrecognized columns', () => {
    expect(inferCategoryName('Price')).toBeNull();
    expect(inferCategoryName('Color')).toBeNull();
    expect(inferCategoryName('xyz123')).toBeNull();
  });

  it('is case-insensitive', () => {
    expect(inferCategoryName('MACHINE')).toBe('Equipment');
    expect(inferCategoryName('shift')).toBe('Temporal');
    expect(inferCategoryName('OpErAtOr')).toBe('People');
  });

  it('trims whitespace', () => {
    expect(inferCategoryName('  Machine  ')).toBe('Equipment');
  });
});

// ============================================================================
// CATEGORY_DISPLAY_NAMES
// ============================================================================

describe('CATEGORY_DISPLAY_NAMES', () => {
  it('has display names for all 5 category keys', () => {
    expect(CATEGORY_DISPLAY_NAMES).toHaveProperty('equipment', 'Equipment');
    expect(CATEGORY_DISPLAY_NAMES).toHaveProperty('temporal', 'Temporal');
    expect(CATEGORY_DISPLAY_NAMES).toHaveProperty('operator', 'People');
    expect(CATEGORY_DISPLAY_NAMES).toHaveProperty('material', 'Material');
    expect(CATEGORY_DISPLAY_NAMES).toHaveProperty('location', 'Location');
  });
});

// ============================================================================
// CATEGORY_COLORS
// ============================================================================

describe('CATEGORY_COLORS', () => {
  it('has 8 distinct colors', () => {
    expect(CATEGORY_COLORS).toHaveLength(8);
    expect(new Set(CATEGORY_COLORS).size).toBe(8);
  });

  it('all colors are valid hex', () => {
    for (const color of CATEGORY_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});
