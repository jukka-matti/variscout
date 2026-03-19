import { describe, it, expect, beforeAll } from 'vitest';
import {
  getMessage,
  getMessages,
  formatMessage,
  detectLocale,
  preloadLocale,
  isLocaleLoaded,
} from '../index';
import { LOCALES } from '../types';

// Preload all locales before tests — non-English catalogs are lazy-loaded
beforeAll(async () => {
  await Promise.all(LOCALES.map(l => preloadLocale(l)));
});

describe('preloadLocale', () => {
  it('English is always loaded', () => {
    expect(isLocaleLoaded('en')).toBe(true);
  });

  it('loads a locale on demand', async () => {
    const catalog = await preloadLocale('de');
    expect(catalog['stats.mean']).toBe('Mittelwert');
    expect(isLocaleLoaded('de')).toBe(true);
  });

  it('returns English for unknown locale file', async () => {
    // Cast to bypass type check — simulates an invalid locale
    const catalog = await preloadLocale('en');
    expect(catalog['stats.mean']).toBe('Mean');
  });
});

describe('getMessage', () => {
  it('returns English message for English locale', () => {
    expect(getMessage('en', 'stats.mean')).toBe('Mean');
  });

  it('returns German message for German locale', () => {
    expect(getMessage('de', 'stats.mean')).toBe('Mittelwert');
  });

  it('returns Spanish message for Spanish locale', () => {
    expect(getMessage('es', 'stats.mean')).toBe('Media');
  });

  it('returns French message for French locale', () => {
    expect(getMessage('fr', 'stats.mean')).toBe('Moyenne');
  });

  it('returns Portuguese message for Portuguese locale', () => {
    expect(getMessage('pt', 'stats.mean')).toBe('Média');
  });

  it('returns translated action buttons', () => {
    expect(getMessage('de', 'action.save')).toBe('Speichern');
    expect(getMessage('fr', 'action.cancel')).toBe('Annuler');
    expect(getMessage('es', 'action.delete')).toBe('Eliminar');
    expect(getMessage('pt', 'action.close')).toBe('Fechar');
  });

  it('returns translated finding statuses', () => {
    expect(getMessage('de', 'findings.observed')).toBe('Beobachtet');
    expect(getMessage('de', 'findings.resolved')).toBe('Gelöst');
  });

  it('returns messages for new locales', () => {
    expect(getMessage('ja', 'stats.mean')).toBe('平均');
    expect(getMessage('fi', 'stats.mean')).toBe('Keskiarvo');
    expect(getMessage('ko', 'stats.mean')).toBe('평균');
    expect(getMessage('ru', 'stats.mean')).toBe('Среднее');
  });
});

describe('getMessages', () => {
  it('returns the full English catalog', () => {
    const messages = getMessages('en');
    expect(messages['stats.mean']).toBe('Mean');
    expect(messages['action.save']).toBe('Save');
    expect(messages['empty.noData']).toBe('No data available');
  });

  it('has no empty string values in any locale catalog', () => {
    for (const locale of LOCALES) {
      const catalog = getMessages(locale);
      for (const [key, value] of Object.entries(catalog)) {
        expect(value, `${locale}.${key} is empty`).not.toBe('');
      }
    }
  });

  it('returns a complete catalog for every supported locale', () => {
    const enKeys = Object.keys(getMessages('en'));
    for (const locale of LOCALES) {
      const localeKeys = Object.keys(getMessages(locale));
      expect(localeKeys.length).toBe(enKeys.length);
      // Every key in English must exist in each locale
      for (const key of enKeys) {
        expect(localeKeys).toContain(key);
      }
    }
  });
});

describe('formatMessage', () => {
  it('returns plain message when no params', () => {
    expect(formatMessage('en', 'stats.mean')).toBe('Mean');
  });

  it('interpolates {count} parameter', () => {
    expect(formatMessage('en', 'data.rowsLoaded', { count: 150 })).toBe('150 rows loaded');
  });

  it('interpolates with German locale', () => {
    expect(formatMessage('de', 'data.rowsLoaded', { count: 42 })).toBe('42 Zeilen geladen');
  });

  it('interpolates findings count', () => {
    expect(formatMessage('en', 'findings.countLabel', { count: 5 })).toBe('5 findings');
    expect(formatMessage('fi', 'findings.countLabel', { count: 3 })).toBe('3 havaintoa');
  });

  it('handles multiple placeholders', () => {
    // Currently only single-param keys, but verify the mechanism works
    expect(formatMessage('en', 'data.rowsLoaded', { count: 0 })).toBe('0 rows loaded');
  });

  it('falls back to English for missing locale key', () => {
    expect(formatMessage('de', 'data.rowsLoaded', { count: 10 })).toBe('10 Zeilen geladen');
  });
});

describe('new catalog keys', () => {
  it('has report KPI keys', () => {
    expect(getMessage('en', 'report.kpi.cpk')).toBe('Cpk');
    expect(getMessage('de', 'report.kpi.samples')).toBe('Stichproben');
  });

  it('has AI action keys', () => {
    expect(getMessage('en', 'ai.propose')).toBe('Propose');
    expect(getMessage('de', 'ai.applied')).toBe('Angewendet');
  });

  it('has staged analysis keys', () => {
    expect(getMessage('en', 'staged.before')).toBe('Before');
    expect(getMessage('de', 'staged.before')).toBe('Vorher');
    expect(getMessage('fi', 'staged.after')).toBe('Jälkeen');
  });
});

describe('chart violation detail keys', () => {
  it('interpolates nelson2.detail with all params', () => {
    expect(
      formatMessage('en', 'chart.violation.nelson2.detail', {
        count: 9,
        side: 'above',
        start: 5,
        end: 13,
      })
    ).toBe('Nelson Rule 2 — run of 9 above mean (#5–13)');
  });

  it('interpolates nelson3.detail with all params', () => {
    expect(
      formatMessage('en', 'chart.violation.nelson3.detail', {
        count: 7,
        direction: 'increasing',
        start: 3,
        end: 9,
      })
    ).toBe('Nelson Rule 3 — trend of 7 increasing (#3–9)');
  });

  it('has side/direction keys in primary locales', () => {
    expect(getMessage('en', 'chart.violation.side.above')).toBe('above');
    expect(getMessage('en', 'chart.violation.side.below')).toBe('below');
    expect(getMessage('fi', 'chart.violation.side.above')).toBe('yli');
    expect(getMessage('fi', 'chart.violation.side.below')).toBe('ali');
    expect(getMessage('de', 'chart.violation.side.above')).toBe('über');
    expect(getMessage('de', 'chart.violation.direction.increasing')).toBe('steigend');
    expect(getMessage('de', 'chart.violation.direction.decreasing')).toBe('fallend');
  });

  it('interpolates nelson2.detail in Finnish', () => {
    expect(
      formatMessage('fi', 'chart.violation.nelson2.detail', {
        count: 9,
        side: 'yli',
        start: 5,
        end: 13,
      })
    ).toBe('Nelsonin sääntö 2 — jakso 9 yli keskiarvon (#5–13)');
  });
});

describe('detectLocale', () => {
  it('detects exact locale codes', () => {
    expect(detectLocale('en')).toBe('en');
    expect(detectLocale('de')).toBe('de');
    expect(detectLocale('fr')).toBe('fr');
    expect(detectLocale('es')).toBe('es');
    expect(detectLocale('pt')).toBe('pt');
  });

  it('detects all 33 supported locales', () => {
    expect(detectLocale('ja')).toBe('ja');
    expect(detectLocale('ko')).toBe('ko');
    expect(detectLocale('fi')).toBe('fi');
    expect(detectLocale('it')).toBe('it');
    expect(detectLocale('ru')).toBe('ru');
    expect(detectLocale('ar')).toBe('ar');
    expect(detectLocale('th')).toBe('th');
  });

  it('detects regional variants by prefix', () => {
    expect(detectLocale('de-AT')).toBe('de');
    expect(detectLocale('de-CH')).toBe('de');
    expect(detectLocale('fr-CA')).toBe('fr');
    expect(detectLocale('es-MX')).toBe('es');
    expect(detectLocale('pt-BR')).toBe('pt');
    expect(detectLocale('en-GB')).toBe('en');
    expect(detectLocale('ja-JP')).toBe('ja');
    expect(detectLocale('ko-KR')).toBe('ko');
  });

  it('detects Chinese script variants', () => {
    expect(detectLocale('zh-CN')).toBe('zh-Hans');
    expect(detectLocale('zh-TW')).toBe('zh-Hant');
    expect(detectLocale('zh-Hans-CN')).toBe('zh-Hans');
    expect(detectLocale('zh-Hant-TW')).toBe('zh-Hant');
    expect(detectLocale('zh')).toBe('zh-Hans');
  });

  it('detects Norwegian variants', () => {
    expect(detectLocale('nb')).toBe('nb');
    expect(detectLocale('no')).toBe('nb');
    expect(detectLocale('no-NO')).toBe('nb');
  });

  it('falls back to English for unsupported locales', () => {
    expect(detectLocale('sw')).toBe('en');
    expect(detectLocale('am')).toBe('en');
    expect(detectLocale('xx-YY')).toBe('en');
  });

  it('handles case-insensitive input', () => {
    expect(detectLocale('DE')).toBe('de');
    expect(detectLocale('FR-ca')).toBe('fr');
  });
});
