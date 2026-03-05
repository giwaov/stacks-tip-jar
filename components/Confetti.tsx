'use client';
import { useEffect, useState } from 'react';
export const Confetti = ({ active }: { active: boolean }) => { const [show, setShow] = useState(false); useEffect(() => { if (active) { setShow(true); setTimeout(() => setShow(false), 3000); } }, [active]); return show ? <div className="fixed inset-0 pointer-events-none z-50">🎉</div> : null; };