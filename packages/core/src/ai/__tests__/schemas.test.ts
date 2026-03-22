import { describe, it, expect } from 'vitest';
import { narrationResponseSchema, chartInsightResponseSchema } from '../schemas';

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
