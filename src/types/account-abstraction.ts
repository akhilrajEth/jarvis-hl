// Account Abstraction types for Privy + Pimlico integration

export interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData?: string;
  signature?: string;
}

export interface SmartAccountInfo {
  address: string;
  isDeployed: boolean;
  balance: string;
  nonce: number;
  owner: string; // EOA address
  chainId: number;
  factory: string;
}

export interface UserOperationReceipt {
  userOperationHash: string;
  transactionHash: string;
  status: 'pending' | 'success' | 'failed';
  gasUsed: string;
  gasPrice: string;
  sponsored: boolean;
  blockNumber?: number;
  blockHash?: string;
}

export interface PaymasterPolicy {
  id: string;
  name: string;
  maxGasPerOperation: string | 'unlimited';
  maxOperationsPerDay: number | 'unlimited';
  allowedContracts?: string[];
  userUsage?: {
    operationsToday: number;
    gasUsedToday: string;
    remainingOperations: number | 'unlimited';
  };
}

export interface PaymasterStatus {
  isActive: boolean;
  balance: string;
  policies: PaymasterPolicy[];
  supportedChains: number[];
}

export interface SponsoredUserOperation extends UserOperation {
  paymasterAddress: string;
  sponsored: boolean;
  estimatedGasCost: string;
  policy: {
    id: string;
    name: string;
    remainingOperations: number | 'unlimited';
  };
}

export interface SmartAccountTransaction {
  to: string;
  value: bigint;
  data: string;
  gasLimit?: bigint;
}

export interface BatchTransaction {
  transactions: SmartAccountTransaction[];
  description?: string;
}

// ZeroDev specific types
export interface ZeroDevKernelAccount {
  address: string;
  entryPoint: string;
  factory: string;
  factoryData: string;
  validatorAddress: string;
}

export interface ZeroDevPaymasterConfig {
  paymasterUrl: string;
  bundlerUrl: string;
  projectId: string;
  apiKey: string;
  chain: {
    id: number;
    name: string;
    rpcUrl: string;
  };
}

// Privy integration types
export interface PrivyEmbeddedWallet {
  address: string;
  walletClientType: 'privy';
  connectorType: 'embedded';
  getEthereumProvider: () => Promise<any>;
}

export interface SmartAccountHookState {
  isLoading: boolean;
  smartAccount: ZeroDevKernelAccount | null;
  smartAccountAddress: string | null;
  kernelClient: any | null;
  error: string | null;
  isReady: boolean;
}

export interface SmartAccountHookActions {
  createSmartAccount: () => Promise<void>;
  sendUserOperation: (to: string, value?: bigint, data?: string) => Promise<string>;
  estimateUserOperationGas: (to: string, value?: bigint, data?: string) => Promise<bigint>;
  sendBatchTransaction: (transactions: SmartAccountTransaction[]) => Promise<string>;
}

// Session key types for automated transactions
export interface SessionKey {
  address: string;
  privateKey: string;
  permissions: {
    allowedTargets: string[];
    allowedFunctions: string[];
    spendingLimit: string;
    validUntil: number;
  };
}

export interface SessionKeyPermission {
  target: string;
  functionSelector: string;
  valueLimit: string;
  rules: {
    condition: 'equal' | 'greater' | 'less' | 'between';
    value: any;
  }[];
}

// Gas estimation types
export interface UserOperationGasEstimate {
  preVerificationGas: string;
  verificationGasLimit: string;
  callGasLimit: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  totalCostEth: string;
  sponsored: boolean;
}

// Error types
export interface SmartAccountError {
  code: string;
  message: string;
  details?: {
    userOperation?: UserOperation;
    revertReason?: string;
    gasEstimate?: UserOperationGasEstimate;
  };
}
