'use client';
export const Avatar = ({ address }: { address: string }) => <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white">{address.slice(0, 2)}</div>;