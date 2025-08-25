// Crypto and Web3 related types

export type SupportedNetwork = 'ethereum' | 'polygon';

export interface NetworkConfig {
  name: string;
  rpcUrl: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorer: string;
}

export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  address: string;
}

export interface WalletInfo {
  address: string;
  balance: string;
  transactionCount: number;
  isContract: boolean;
  network: SupportedNetwork;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasLimit: string;
  nonce: number;
  blockNumber?: number;
  blockHash?: string;
  transactionIndex?: number;
  confirmations?: number;
}

export interface TransactionReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  transactionIndex: number;
  from: string;
  to: string;
  gasUsed: string;
  status: number;
  logs: any[];
}

export interface ContractCall {
  contractAddress: string;
  method: string;
  params: any[];
  abi: any[];
}

export interface SmartContractError {
  reason: string;
  code: string;
  method: string;
  transaction: any;
}

// Common ERC standards
export interface ERC20Token extends TokenInfo {
  balanceOf?: (address: string) => Promise<string>;
  transfer?: (to: string, amount: string) => Promise<Transaction>;
  approve?: (spender: string, amount: string) => Promise<Transaction>;
  allowance?: (owner: string, spender: string) => Promise<string>;
}

export interface ERC721Token {
  name: string;
  symbol: string;
  totalSupply: string;
  address: string;
  ownerOf?: (tokenId: string) => Promise<string>;
  balanceOf?: (owner: string) => Promise<string>;
  tokenURI?: (tokenId: string) => Promise<string>;
}

// Gas estimation
export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  totalCost: string;
}

// Wallet connection
export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  provider?: any;
}

// DeFi protocols
export interface LiquidityPool {
  address: string;
  token0: ERC20Token;
  token1: ERC20Token;
  reserves: {
    token0: string;
    token1: string;
  };
  totalSupply: string;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOutMin: string;
  recipient: string;
  deadline: number;
}

// NFT metadata
export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  external_url?: string;
  background_color?: string;
}

// Event types for Web3 events
export interface Web3Event {
  event: string;
  address: string;
  returnValues: any;
  logIndex: number;
  transactionIndex: number;
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  raw: {
    data: string;
    topics: string[];
  };
}
