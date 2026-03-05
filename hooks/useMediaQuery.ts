import { useState, useEffect } from 'react';
export const useMediaQuery = (query: string) => { const [matches, setMatches] = useState(false); useEffect(() => { const m = window.matchMedia(query); setMatches(m.matches); m.addEventListener('change', e => setMatches(e.matches)); }, [query]); return matches; };
export const useIsMobile = () => useMediaQuery('(max-width: 768px)');