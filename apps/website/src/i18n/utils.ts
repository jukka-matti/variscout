import { ui, defaultLang } from './ui';

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang && lang in ui) return lang as keyof typeof ui;
  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  return function t(key: keyof (typeof ui)[typeof defaultLang]) {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getRouteFromUrl(url: URL): string | undefined {
  const [, lang, ...rest] = url.pathname.split('/');
  if (lang && lang in ui) {
    return rest.join('/') || undefined;
  }
  return url.pathname.slice(1) || undefined; // If default lang (no prefix)
}
