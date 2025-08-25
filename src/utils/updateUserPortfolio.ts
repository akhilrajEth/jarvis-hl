import { InitialAssetPrices, PortfolioState, TokenData } from "@/types";
import { supabase } from "./supabaseClient";
import { AllocationType } from "@/constants";
import { getCurrentTokenPrice } from "./getCurrentTokenPrice";

/**
 * Updates the portfolio for a given user. If the portfolio includes a 'spot' allocation,
 * it fetches the initial prices of the assets and updates the 'initial_asset_prices' column.
 *
 * @param publicAddress The user's public wallet address.
 * @param portfolio The new portfolio state to save.
 * @returns The updated user data or null if an error occurred.
 */
export const updateUserPortfolio = async (
  publicAddress: string,
  portfolio: PortfolioState
) => {
  if (!publicAddress) {
    console.error("updateUserPortfolio Error: publicAddress is missing.");
    return null;
  }

  try {
    const updatePayload: {
      portfolio: PortfolioState;
      initial_asset_prices?: InitialAssetPrices;
    } = {
      portfolio: portfolio,
    };

    const spotAllocation = portfolio.find(
      (item) => item.category === AllocationType.SPOT
    );

    if (spotAllocation && spotAllocation.allocations.length > 0) {
      console.log("Found 'spot' allocation, fetching initial asset prices...");

      const pricePromises = spotAllocation.allocations.map((address) =>
        getCurrentTokenPrice(address)
      );

      const tokenDataResults = await Promise.all(pricePromises);

      const initialAssetPrices = tokenDataResults
        .filter((data): data is TokenData => data !== null)
        .map((data) => ({
          token_address: data.address,
          initial_price: parseFloat(data.price_usd),
        }));

      if (initialAssetPrices.length > 0) {
        updatePayload.initial_asset_prices = initialAssetPrices;
        console.log("Initial asset prices saved:", initialAssetPrices);
      }
    }

    const { data, error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("userPublicAddress", publicAddress)
      .select()
      .single();

    if (error) {
      throw error;
    }
    console.log("Successfully updated portfolio for user:", publicAddress);
    return data;
  } catch (error) {
    console.error(
      "Database error in updateUserPortfolio:",
      (error as Error).message
    );
    return null;
  }
};
