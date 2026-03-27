// @giwaov/stacks-tip-jar - Stacks Tip Jar SDK
const { makeContractCall, broadcastTransaction, AnchorMode, PostConditionMode, uintCV, stringAsciiCV, principalCV } = require('@stacks/transactions');

const TIP_JAR_CONTRACT = {
  address: 'SP33C21DH86NQ56RYYY69CGD1146H4E5NHNM32W5P',
  name: 'tip-jar-v5'
};

async function sendTip(recipient, amount, message, senderKey, network) {
  const tx = await makeContractCall({
    contractAddress: TIP_JAR_CONTRACT.address,
    contractName: TIP_JAR_CONTRACT.name,
    functionName: 'send-tip',
    functionArgs: [principalCV(recipient), uintCV(amount), stringAsciiCV(message)],
    senderKey,
    network,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 1500
  });
  return broadcastTransaction(tx, network);
}

module.exports = { sendTip, TIP_JAR_CONTRACT };
