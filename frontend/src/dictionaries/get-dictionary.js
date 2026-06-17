const dictionaries = {
  en: () => import('./en.json').then((module) => module.default),
  vi: () => import('./vi.json').then((module) => module.default),
};

export const getDictionary = async (locale) => {
  return dictionaries[locale]?.() ?? dictionaries.vi();
};
