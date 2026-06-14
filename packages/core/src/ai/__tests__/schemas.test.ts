import { describe, it, expect } from 'vitest';
import { narrationResponseSchema, chartInsightResponseSchema, proposedInsightSchema } from '../schemas';

describe('narrationResponseSchema', () => {
  it('has type object', () => {
    expect(narrationResponseSchema.type).toBe('object');
  });

  it('requires text and confidence fields', () => {
    expect(narrationResponseSchema.required).toContain('text');
    expect(narrationResponseSchema.required).toContain('confidence');
    expect(narrationResponseSchema.required).toHaveLength(2);
  });

  it('defines text property as string', () => {
    expect(narrationResponseSchema.properties.text.type).toBe('string');
  });

  it('defines confidence property as string enum with expected values', () => {
    const conf = narrationResponseSchema.properties.confidence;
    expect(conf.type).toBe('string');
    expect(conf.enum).toEqual(['low', 'moderate', 'high']);
  });

  it('disallows additional properties', () => {
    expect(narrationResponseSchema.additionalProperties).toBe(false);
  });

  it('has description on text property', () => {
    expect(narrationResponseSchema.properties.text.description).toBeTruthy();
  });
});

describe('chartInsightResponseSchema', () => {
  it('has type object', () => {
    expect(chartInsightResponseSchema.type).toBe('object');
  });

  it('requires text field only', () => {
    expect(chartInsightResponseSchema.required).toEqual(['text']);
  });

  it('defines text property as string', () => {
    expect(chartInsightResponseSchema.properties.text.type).toBe('string');
  });

  it('disallows additional properties', () => {
    expect(chartInsightResponseSchema.additionalProperties).toBe(false);
  });

  it('has description on text property', () => {
    expect(chartInsightResponseSchema.properties.text.description).toBeTruthy();
  });
});

/**
 * B1: Azure Responses API strict-mode invariants for proposedInsightSchema.
 *
 * Azure strict mode requires:
 *   (1) the schema ROOT must be type 'object' (not 'array')
 *   (2) every key in item.properties must appear in item.required
 *
 * These tests guard against silent regression — a broken schema fails HTTP
 * requests with 400 and the catch in distillation.ts silently returns [].
 */
describe('proposedInsightSchema — Azure strict-mode invariants', () => {
  it('root type is object (not array)', () => {
    expect(proposedInsightSchema.type).toBe('object');
  });

  it('root has additionalProperties: false', () => {
    expect(proposedInsightSchema.additionalProperties).toBe(false);
  });

  it('root required includes insights', () => {
    expect(proposedInsightSchema.required).toContain('insights');
  });

  it('root properties has an insights array', () => {
    expect(proposedInsightSchema.properties.insights.type).toBe('array');
  });

  it('item schema is type object with additionalProperties: false', () => {
    const item = proposedInsightSchema.properties.insights.items;
    expect(item.type).toBe('object');
    expect(item.additionalProperties).toBe(false);
  });

  it('every key in item.properties appears in item.required (strict-mode completeness)', () => {
    const item = proposedInsightSchema.properties.insights.items;
    const propKeys = Object.keys(item.properties);
    const requiredSet = new Set(item.required);
    for (const key of propKeys) {
      expect(requiredSet.has(key), `item property '${key}' must be in required[]`).toBe(true);
    }
  });

  it('item required includes questionId, text, and kind', () => {
    const item = proposedInsightSchema.properties.insights.items;
    expect(item.required).toContain('questionId');
    expect(item.required).toContain('text');
    expect(item.required).toContain('kind');
  });

  it('questionId is nullable (type array with string and null) to allow optional omission', () => {
    const item = proposedInsightSchema.properties.insights.items;
    const qIdType = item.properties.questionId.type;
    // Azure strict mode: optional string fields use ['string', 'null'] union
    expect(Array.isArray(qIdType)).toBe(true);
    expect(qIdType).toContain('string');
    expect(qIdType).toContain('null');
  });

  it('kind enum contains all 4 ProposedInsightKind values', () => {
    const item = proposedInsightSchema.properties.insights.items;
    expect(item.properties.kind.enum).toEqual(
      expect.arrayContaining(['answer', 'context', 'new-hypothesis-proposal', 'contradiction'])
    );
    expect(item.properties.kind.enum).toHaveLength(4);
  });
});
