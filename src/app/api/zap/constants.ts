export const ERC20_ABI = [
  "function decimals() view returns (uint8)",
  "function approve(address spender, uint256 amount) external",
];
export const GLUEX_QUOTE_ENDPOINT = "https://router.gluex.xyz/v1/quote";
export const HYPERLEND_MARKETS_ENDPOINT =
  "https://api.hyperlend.finance/data/markets?chain=hyperEvm";

export enum AllocationType {
  SPOT = "spot",
  VAULT = "vault",
  LP = "lp",
  LENDING = "lending",
}
