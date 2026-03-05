'use client';
const variants = { default: 'bg-gray-100', success: 'bg-green-100', error: 'bg-red-100' };
export const Badge = ({ children, variant = 'default' }: any) => <span className={`px-2 py-0.5 rounded-full text-xs ${variants[variant]}`}>{children}</span>;