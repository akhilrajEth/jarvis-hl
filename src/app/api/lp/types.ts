export interface ZapApiParams {
  dex: string;
  "pool.id": string;
  "position.id"?: string;
  "position.tickLower"?: number;
  "position.tickUpper"?: number;
  tokensIn: string[];
  amountsIn: string[];
  slippage: number;
}

export interface BuildTxParams {
  route: string;
  sender: string;
  recipient: string;
  deadline?: number;
  source?: string;
}

export interface TransactionCall {
  to: string;
  data: string;
  value: string;
}
