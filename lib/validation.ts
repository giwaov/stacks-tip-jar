export const isValidSTXAddress = (a: string) => /^S[PM][A-Z0-9]{38,39}$/.test(a);
export const isValidAmount = (a: number) => a > 0 && a <= 1000000;
export const sanitize = (s: string) => s.replace(/[<>]/g, '');