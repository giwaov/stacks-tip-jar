export async function fetchAccountBalance(address: string) { const response = await fetch('https://api.mainnet.hiro.so/extended/v1/address/' + address + '/balances'); return response.json(); }
