'use client';
import { useState } from 'react';
export const Tooltip = ({ content, children }: any) => { const [v, setV] = useState(false); return <div className="relative" onMouseEnter={() => setV(true)} onMouseLeave={() => setV(false)}>{children}{v && <div className="absolute bottom-full mb-2 px-2 py-1 text-xs bg-gray-900 text-white rounded">{content}</div>}</div>; };