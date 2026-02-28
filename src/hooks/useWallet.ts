import { useState, useEffect, useCallback } from "react";
import { AppConfig, UserSession, showConnect } from "@stacks/connect";

const appConfig = new AppConfig(["store_write"]);
const userSession = new UserSession({ appConfig });

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setAddress(userData.profile.stxAddress.mainnet);
    }
  }, []);

  const connect = useCallback(() => {
    setIsConnecting(true);
    showConnect({
      appDetails: {
        name: "Stacks dApp",
        icon: "/icon.png",
      },
      onFinish: () => {
        const userData = userSession.loadUserData();
        setAddress(userData.profile.stxAddress.mainnet);
        setIsConnecting(false);
      },
      onCancel: () => {
        setIsConnecting(false);
      },
      userSession,
    });
  }, []);

  const disconnect = useCallback(() => {
    userSession.signUserOut();
    setAddress(null);
  }, []);

  return {
    address,
    isConnected: !!address,
    isConnecting,
    connect,
    disconnect,
    userSession,
  };
}
