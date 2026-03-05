export const isToday = (date: Date): boolean => {
  return new Date().toDateString() === date.toDateString();
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toDateString() === date.toDateString();
};

export const daysAgo = (date: Date): number => {
  return Math.floor((Date.now() - date.getTime()) / 86400000);
};

export const formatRelativeDate = (date: Date): string => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  const days = daysAgo(date);
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
};