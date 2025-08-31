export interface TransactionCall {
  to: string;
  data: string;
  value: string;
}

export interface HyperLendReserve {
  underlyingAsset: string;
  aTokenAddress: string;
}
