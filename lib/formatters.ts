export const formatSTX = (m: number) => (m / 1e6).toFixed(2);
export const formatDate = (d: Date) => d.toLocaleDateString();
export const truncateAddress = (a: string) => a.slice(0, 6) + '...' + a.slice(-4);