const API = 'https://api.mainnet.hiro.so';
export const getBalance = async (a: string) => (await fetch(`${API}/extended/v1/address/${a}/balances`)).json();
export const getTx = async (id: string) => (await fetch(`${API}/extended/v1/tx/${id}`)).json();