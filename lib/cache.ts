const cache = new Map<string, any>();
export const getCache = (k: string) => cache.get(k);
export const setCache = (k: string, v: any) => cache.set(k, v);