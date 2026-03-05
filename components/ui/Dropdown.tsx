'use client';
import { useState } from 'react';
export const Dropdown = ({ trigger, children }: any) => { const [open, setOpen] = useState(false); return <div className="relative"><div onClick={() => setOpen(!open)}>{trigger}</div>{open && <div className="absolute top-full mt-2 bg-white rounded-lg shadow-lg border py-2 min-w-[160px] z-50">{children}</div>}</div>; };
export const DropdownItem = ({ children, onClick }: any) => <button onClick={onClick} className="w-full px-4 py-2 text-left hover:bg-gray-100">{children}</button>;