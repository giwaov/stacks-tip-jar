export const RATE_LIMIT = { perMinute: 10, perHour: 50 };
const history: number[] = [];
export const canSend = () => history.filter(t => Date.now() - t < 60000).length < RATE_LIMIT.perMinute;