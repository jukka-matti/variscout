import { describe, expect, it } from 'vitest';
import { getSample } from '../samples';

describe('curated demo samples', () => {
  it('seeds Syringe Barrel Weight as the end-to-end Analyze and Improve demo', () => {
    const sample = getSample('syringe-barrel-weight');

    expect(sample).toBeDefined();
    expect(sample!.config.investigation?.findings?.length).toBeGreaterThanOrEqual(5);
    expect(sample!.config.investigation?.hypotheses?.length).toBeGreaterThanOrEqual(1);
    expect(sample!.config.investigation?.causalLinks?.length).toBeGreaterThanOrEqual(3);
    expect(sample!.config.improvementProject?.actions?.length).toBeGreaterThanOrEqual(3);
    expect(sample!.config.improvementProject?.sections?.approach?.narrative).toContain(
      'Lot 3 pressure recipe'
    );
  });

  it('seeds Bottleneck as the process-flow demo with Analyze and Improve content', () => {
    const sample = getSample('bottleneck');

    expect(sample).toBeDefined();
    expect(sample!.config.processMap?.nodes).toHaveLength(5);
    expect(sample!.config.stepTimings).toHaveLength(5);
    expect(sample!.config.investigation?.findings?.length).toBeGreaterThanOrEqual(3);
    expect(sample!.config.investigation?.hypotheses?.map(h => h.name)).toContain(
      'Step 2 standard-work drift'
    );
    expect(sample!.config.improvementProject?.actions?.length).toBeGreaterThanOrEqual(3);
    expect(sample!.config.improvementProject?.issueStatement).toContain('Step 2 variation');
  });
});
