"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { SmartAccountState } from "@/types";

export function useSmartAccount() {
  const { user, ready, authenticated } = usePrivy();
  console.log("USER OBJECT IN USESMARTACCOUNT HOOK:", user);

  const [state, setState] = useState<SmartAccountState>({
    smartWalletAddress: null,
    smartWalletType: null,
    lastVerified: null,
    firstVerified: null,
    error: null,
  });

  useEffect(() => {
    // Update state when user or authentication status changes
    if (user && ready && authenticated) {
      const smartWallet = user.linkedAccounts?.find((account) => account.type === "smart_wallet");
      setState({
        smartWalletAddress: smartWallet?.address || null,
        smartWalletType: smartWallet?.type || null,
        lastVerified: smartWallet?.latestVerifiedAt || null,
        firstVerified: smartWallet?.firstVerifiedAt || null,
        error: null,
      });
    } else {
      setState({
        smartWalletAddress: null,
        smartWalletType: null,
        lastVerified: null,
        firstVerified: null,
        error: null,
      });
    }
  }, [user, ready, authenticated]);

  return {
    ...state,
    isReady: ready && authenticated && !state.error,
  };
}