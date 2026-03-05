import { formatSTX, truncateAddress } from '../lib/formatters';
describe('formatSTX', () => { it('formats', () => { expect(formatSTX(1000000)).toBe('1.00'); }); });