import { describe, it, expectTypeOf } from 'vitest';
import type { SpecRule, SpecLookupContext, SpecLimits } from '../types';

describe('SpecRule type', () => {
  it('has optional `when` record and required `specs`', () => {
    expectTypeOf<SpecRule>().toMatchTypeOf<{
      when?: Record<string, string | null>;
      specs: SpecLimits;
    }>();
  });

  it('SpecLookupContext is a plain context tuple', () => {
    expectTypeOf<SpecLookupContext>().toMatchTypeOf<Record<string, string | null | undefined>>();
  });
});
