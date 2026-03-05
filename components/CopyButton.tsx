'use client';
import { useClipboard } from '@/hooks/useClipboard';
export const CopyButton = ({ text }: { text: string }) => { const { copied, copy } = useClipboard(); return <button onClick={() => copy(text)} className="px-2 py-1 text-sm text-gray-600 hover:text-gray-900">{copied ? '✓ Copied' : '📋 Copy'}</button>; };