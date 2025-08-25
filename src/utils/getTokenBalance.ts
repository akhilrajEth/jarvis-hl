import { ethers } from "ethers";

const HYPEREVM_RPC_URL = process.env.NEXT_PUBLIC_HYPEREVM_RPC_URL;
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

/**
 * Fetches the balance, decimals, and symbol for a given ERC20 token address.
 *
 * @param tokenAddress The address of the ERC20 token contract.
 * @param walletAddress The address of the wallet to check the balance of.
 * @returns An object with the formatted balance and symbol, or null if an error occurs.
 */
export const getTokenBalance = async (
  tokenAddress: string,
  walletAddress: string
): Promise<{ balance: string; symbol: string } | null> => {
  if (!HYPEREVM_RPC_URL) {
    console.error("HYPEREVM_RPC_URL is not set in environment variables.");
    return null;
  }

  try {
    const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC_URL);
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ERC20_ABI,
      provider
    );

    const [balance, decimals, symbol] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
      tokenContract.symbol(),
    ]);

    const formattedBalance = ethers.formatUnits(balance, decimals);

    return {
      balance: parseFloat(formattedBalance).toFixed(4),
      symbol,
    };
  } catch (error) {
    console.error(`Error fetching balance for token ${tokenAddress}:`, error);
    return null;
  }
};
