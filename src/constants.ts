import { Chain } from "viem";

export enum AllocationType {
  SPOT = "spot",
  VAULT = "vault",
  LP = "lp",
  LENDING = "lending",
}

export const HYPER_EVM_CHAIN_INFO: Chain = {
  id: 999,
  name: "HyperEVM",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
    public: {
      http: ["https://rpc.hyperliquid.xyz/evm"],
    },
  },
  blockExplorers: {
    default: {
      name: "HyperEVM Explorer",
      url: "https://hyperevmscan.io/",
    },
  },
};
