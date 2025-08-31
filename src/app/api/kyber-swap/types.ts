export interface BuildAggregatorTxParams {
  routeSummary: any;
  sender: string;
  recipient: string;
  slippageTolerance: number;
  deadline?: number;
  source?: string;
}

export interface TransactionCall {
  to: string;
  data: string;
  value: string;
}

export interface AggregatorApiParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
}
