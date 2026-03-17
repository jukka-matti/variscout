import { describe, it, expect } from 'vitest';
import { getMessage, getMessages, detectLocale } from '../index';
import { LOCALES } from '../types';

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
