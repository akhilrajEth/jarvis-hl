"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import { PortfolioAction, PortfolioState } from "@/types";
import { AllocationType } from "@/constants";

const initialState: PortfolioState = [
  { category: AllocationType.SPOT, allocations: [], percentage: 25 },
  {
    category: AllocationType.VAULT,
    allocations: ["0x1359b05241cA5076c9F59605214f4F84114c0dE8"], // Wrapped HLP Token Address
    percentage: 25,
  },
  { category: AllocationType.LP, allocations: [], percentage: 25 },
  { category: AllocationType.LENDING, allocations: [], percentage: 25 },
];

const portfolioReducer = (
  state: PortfolioState,
  action: PortfolioAction
): PortfolioState => {
  switch (action.type) {
    case "UPDATE_ALLOCATION":
      return state.map((item) =>
        item.category === action.payload.category
          ? { ...item, allocations: action.payload.allocations }
          : item
      );

    case "SET_PORTFOLIO_PERCENTAGES":
      return state.map((item) => {
        const newAllocation = action.payload.find(
          (p) => p.category === item.category
        );
        return newAllocation
          ? { ...item, percentage: newAllocation.percentage }
          : item;
      });

    default:
      return state;
  }
};

const PortfolioContext = createContext<
  | {
      state: PortfolioState;
      dispatch: React.Dispatch<PortfolioAction>;
    }
  | undefined
>(undefined);

export const PortfolioProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(portfolioReducer, initialState);

  return (
    <PortfolioContext.Provider value={{ state, dispatch }}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
};
