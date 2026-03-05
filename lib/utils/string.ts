export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const truncate = (s: string, len: number) => s.length <= len ? s : s.slice(0, len - 3) + '...';
export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-');