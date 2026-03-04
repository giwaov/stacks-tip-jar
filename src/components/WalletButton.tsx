import { Button } from './Button'; export function WalletButton({ isConnected, onConnect }: any) { return isConnected ? <span>Connected</span> : <Button onClick={onConnect}>Connect Wallet</Button>; }
