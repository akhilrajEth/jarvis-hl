import { PortfolioState } from "@/types";

export interface TokenData {
  price_usd: string;
  symbol: string;
  address: string;
}

export interface PriceData extends TokenData {
  symbol: string;
}

export interface UserForRebalance {
  id: string;
  userPublicAddress: string;
  portfolio: PortfolioState;
  initial_asset_prices: { token_address: string; initial_price: number }[];
  total_deposit_amount: { amount: number; token_address: string };
}

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
