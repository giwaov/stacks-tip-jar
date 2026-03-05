export const trackEvent = (name: string, props?: Record<string, unknown>) => console.log('[Analytics]', name, props);
export const trackPageView = (path: string) => trackEvent('page_view', { path });
export const trackTipSent = (amount: number) => trackEvent('tip_sent', { amount });