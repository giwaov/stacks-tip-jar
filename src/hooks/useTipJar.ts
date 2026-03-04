import { useState } from 'react'; export function useTipJar() { const [jarInfo, setJarInfo] = useState(null); return { jarInfo }; }
