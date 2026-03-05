import { renderHook } from '@testing-library/react';
import { useDebounce } from '../hooks/useDebounce';
describe('useDebounce', () => { it('works', () => { const { result } = renderHook(() => useDebounce('test', 500)); expect(result.current).toBe('test'); }); });