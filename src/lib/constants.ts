export const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";

export const CONTRACTS = {
  TIP_JAR: { address: CONTRACT_ADDRESS, name: "tip-jar-v3" },
} as const;

export const EXPLORER_URL = "https://explorer.hiro.so";

export function getContractUrl(contractName: string) {
  return `${EXPLORER_URL}/txid/${CONTRACT_ADDRESS}.${contractName}?chain=mainnet`;
}

export function getTxUrl(txId: string) {
  return `${EXPLORER_URL}/txid/${txId}?chain=mainnet`;
}

export function formatSTX(microSTX: number): string {
  return (microSTX / 1_000_000).toFixed(6) + " STX";
}

export function parseSTX(stx: number): number {
  return stx * 1_000_000;
}

export const MIN_TIP = 100000; // 0.1 STX
