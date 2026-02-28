import { callReadOnlyFunction, cvToValue, standardPrincipalCV } from "@stacks/transactions";
import { STACKS_MAINNET } from "@stacks/network";

const CONTRACT_ADDRESS = "SP3E0DQAHTXJHH5YT9TZCSBW013YXZB25QFDVXXWY";
const CONTRACT_NAME = "tip-jar-v3";

export async function getTipCount() {
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-tip-count",
    functionArgs: [],
    network: STACKS_MAINNET,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result);
}

export async function getTotalTips() {
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-total-tips",
    functionArgs: [],
    network: STACKS_MAINNET,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result);
}

export async function getOwner() {
  const result = await callReadOnlyFunction({
    contractAddress: CONTRACT_ADDRESS,
    contractName: CONTRACT_NAME,
    functionName: "get-owner",
    functionArgs: [],
    network: STACKS_MAINNET,
    senderAddress: CONTRACT_ADDRESS,
  });
  return cvToValue(result);
}
