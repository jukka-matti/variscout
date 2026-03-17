import { describe, it, expect } from 'vitest';
import { getMessage, getMessages, detectLocale } from '../index';

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
});

describe('getMessages', () => {
  it('returns the full English catalog', () => {
    const messages = getMessages('en');
    expect(messages['stats.mean']).toBe('Mean');
    expect(messages['action.save']).toBe('Save');
    expect(messages['empty.noData']).toBe('No data available');
  });

  it('returns a complete catalog for each locale', () => {
    const enKeys = Object.keys(getMessages('en'));
    for (const locale of ['de', 'es', 'fr', 'pt'] as const) {
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

  it('detects regional variants by prefix', () => {
    expect(detectLocale('de-AT')).toBe('de');
    expect(detectLocale('de-CH')).toBe('de');
    expect(detectLocale('fr-CA')).toBe('fr');
    expect(detectLocale('es-MX')).toBe('es');
    expect(detectLocale('pt-BR')).toBe('pt');
    expect(detectLocale('en-GB')).toBe('en');
  });

  it('falls back to English for unsupported locales', () => {
    expect(detectLocale('ja')).toBe('en');
    expect(detectLocale('zh-CN')).toBe('en');
    expect(detectLocale('ko')).toBe('en');
  });

  it('handles case-insensitive input', () => {
    expect(detectLocale('DE')).toBe('de');
    expect(detectLocale('FR-ca')).toBe('fr');
  });
});
