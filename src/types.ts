import { AllocationType } from "./constants";

export type AdvisorAssessment = {
  risk_profile: string;
  reasoning: string;
};

export type AllocationFormat = {
  category: string;
  description: string;
  riskLevel: {
    description: string;
    bgColor: string;
    textColor: string;
  };
  editTitleName: string;
};

export interface AllocationItem {
  category: AllocationType;
  percentage: number;
  allocations: string[];
}

export type PortfolioState = AllocationItem[];

export type PortfolioAction =
  | {
      type: "UPDATE_ALLOCATION";
      payload: {
        category: AllocationType;
        allocations: string[];
      };
    }
  | {
      type: "SET_PORTFOLIO_PERCENTAGES";
      payload: Array<{
        category: AllocationType;
        percentage: number;
      }>;
    };

export interface SmartAccountState {
  smartWalletAddress: string | null;
  smartWalletType: any | null;
  lastVerified: Date | null;
  firstVerified: Date | null;
  error: string | null;
}

export interface TokenData {
  price_usd: string;
  address: string;
}

type TokenPrice = {
  token_address: string;
  initial_price: number;
};

export type InitialAssetPrices = TokenPrice[];
