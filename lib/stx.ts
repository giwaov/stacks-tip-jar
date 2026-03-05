import { MICRO_STX } from './constants';
export const toMicroSTX = (stx: number) => Math.floor(stx * MICRO_STX);
export const fromMicroSTX = (micro: number) => micro / MICRO_STX;
export const formatSTXAmount = (micro: number) => `${fromMicroSTX(micro).toFixed(6)} STX`;