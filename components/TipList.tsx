'use client';
import { TipCard } from './TipCard';
export const TipList = ({ tips }: any) => tips.length === 0 ? <p className="text-center text-gray-500">No tips yet</p> : <div className="space-y-4">{tips.map((t: any) => <TipCard key={t.id} tip={t} />)}</div>;