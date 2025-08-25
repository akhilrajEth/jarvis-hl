export const SPOT_ALLOCATION_FORMAT = {
  category: "Spot",
  description: "Add up to 5 assets.",
  riskLevel: {
    description: "High Volatility / High Reward",
    bgColor: "#ffebee",
    textColor: "#c62828",
  },
  editTitleName: "Assets",
};

export const VAULT_ALLOCATION_FORMAT = {
  category: "HL Vault",
  description: "Only support one vault.",
  riskLevel: {
    description: "Managed Strategy Risk",
    bgColor: "#fff3e0",
    textColor: "#E65100",
  },
  editTitleName: "",
};

export const LP_ALLOCATION_FORMAT = {
  category: "LP Pools",
  description: "Add up to 5 pools.",
  riskLevel: {
    description: "High Yield / Impermanent Loss",
    bgColor: "#fff3e0",
    textColor: "#E65100",
  },
  editTitleName: "Liquidity Pools",
};

export const LENDING_ALLOCATION_FORMAT = {
  category: "Lending",
  description: "Add up to 5 lending markets.",
  riskLevel: {
    description: "Conservative / Protocol Risk",
    bgColor: "#e8f5e9",
    textColor: "#1B5E20",
  },
  editTitleName: "Lending Markets",
};
