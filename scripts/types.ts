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
