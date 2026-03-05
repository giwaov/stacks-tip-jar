export const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
export const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
export const formatNum = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1) + 'M' : n >= 1e3 ? (n/1e3).toFixed(1) + 'K' : String(n);