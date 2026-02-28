import { openContractCall } from "@stacks/connect";
import { STACKS_MAINNET } from "@stacks/network";
import {
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  boolCV,
  principalCV,
  noneCV,
  someCV,
} from "@stacks/transactions";

export const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";

interface ContractCallOptions {
  contractName: string;
  functionName: string;
  functionArgs: any[];
  onFinish?: (data: { txId: string }) => void;
  onCancel?: () => void;
}

export async function callContract({
  contractName,
  functionName,
  functionArgs,
  onFinish,
  onCancel,
}: ContractCallOptions) {
  await openContractCall({
    network: STACKS_MAINNET,
    anchorMode: AnchorMode.Any,
    contractAddress: CONTRACT_ADDRESS,
    contractName,
    functionName,
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    onFinish: onFinish || ((data) => console.log("TX:", data.txId)),
    onCancel: onCancel || (() => console.log("Cancelled")),
  });
}

// Helper function for uint args
export function createUintArg(value: number) {
  return uintCV(value);
}

// Helper function for string args
export function createStringArg(value: string) {
  return stringAsciiCV(value);
}

// Helper function for bool args
export function createBoolArg(value: boolean) {
  return boolCV(value);
}

// Helper function for principal args
export function createPrincipalArg(address: string) {
  return principalCV(address);
}

// Helper function for optional args
export function createOptionalArg(value: any | null) {
  return value ? someCV(value) : noneCV();
}
