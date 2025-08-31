/**
 * Fetches the aToken address for a given underlying asset from the HyperLend API.
 * This is the equivalent of the output token for a deposit.
 * @param {string} underlyingAssetAddress - The address of the token to deposit (e.g., USDC).
 * @returns {Promise<string>} The corresponding aToken address.
 * @throws {Error} If the reserve or aToken address cannot be found.
 */

interface HyperLendReserve {
  underlyingAsset: string;
  aTokenAddress: string;
}

export async function getATokenAddress(
  underlyingAssetAddress: string
): Promise<string> {
  try {
    const HYPERLEND_MARKETS_ENDPOINT =
      "https://api.hyperlend.finance/data/markets?chain=hyperEvm";
    const response = await fetch(HYPERLEND_MARKETS_ENDPOINT);
    if (!response.ok) {
      throw new Error(
        `HyperLend API request failed with status: ${response.status}`
      );
    }

    const data = await response.json();
    const reserves: HyperLendReserve[] = data.reserves;

    const reserve = reserves.find(
      (r) =>
        r.underlyingAsset.toLowerCase() === underlyingAssetAddress.toLowerCase()
    );

    if (!reserve || !reserve.aTokenAddress) {
      throw new Error(
        `No corresponding aToken found for asset ${underlyingAssetAddress}.`
      );
    }

    return reserve.aTokenAddress;
  } catch (error) {
    console.error("Error fetching aToken address:", error);
    throw new Error("Failed to resolve output token from HyperLend API.");
  }
}
