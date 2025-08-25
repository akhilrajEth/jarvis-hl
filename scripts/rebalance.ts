// Note: Run this script with "npx ts-node --project tsconfig.scripts.json scripts/rebalance.ts"

import axios from "axios";
import { PriceData, TokenData, UserForRebalance } from "./types";
import { supabase } from "@/utils/supabaseClient";
import { AllocationItem } from "@/types";
import {
  GECKOTERMINAL_BASE_URL,
  NETWORK,
  REBALANCE_THRESHOLD,
} from "./constants";

export async function getCurrentTokenPrice(
  tokenAddress: string
): Promise<TokenData | null> {
  if (!tokenAddress) {
    console.error("Error: Token address is required.");
    return null;
  }

  const url = `${GECKOTERMINAL_BASE_URL}/networks/${NETWORK}/tokens/${tokenAddress}`;

  try {
    console.log(`Fetching data for ${tokenAddress} from GeckoTerminal...`);

    const response = await axios.get(url);

    const attributes = response.data.data.attributes;
    const priceUsd = attributes.price_usd;
    const symbol = attributes.symbol;
    const address = attributes.address;

    if (!priceUsd || !symbol || !address) {
      console.error(
        `Error: Incomplete data received for token ${tokenAddress}.`
      );
      return null;
    }

    return {
      price_usd: priceUsd,
      symbol: symbol,
      address: address,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `Error fetching data from GeckoTerminal API: ${error.response.status} ${error.response.statusText}`
      );
    } else {
      console.error("An unexpected error occurred:", error);
    }
    return null;
  }
}

async function getAllUsers(): Promise<UserForRebalance[]> {
  console.log("Fetching all users from the database...");
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, userPublicAddress, portfolio, initial_asset_prices, total_deposit_amount"
    )
    .not("portfolio", "is", null);

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  console.log(`Found ${data.length} users with portfolios.`);
  return data as UserForRebalance[];
}

function processUserRebalance(
  user: UserForRebalance,
  currentPriceMap: Map<string, PriceData>
): void {
  console.log(`\n--- Analyzing user: ${user.userPublicAddress} ---`);

  const spotAllocation = user.portfolio.find(
    (p: AllocationItem) => p.category === "spot"
  );

  if (!spotAllocation || spotAllocation.allocations.length === 0) {
    console.log("User has no assets in their spot allocation. Skipping.");
    return;
  }

  const totalDeposit = user.total_deposit_amount?.amount;
  if (!totalDeposit) {
    console.log("User has no total deposit amount. Skipping.");
    return;
  }

  const spotPercentage = spotAllocation.percentage / 100;
  const initialSpotValue = totalDeposit * spotPercentage;
  const numSpotAssets = spotAllocation.allocations.length;
  const initialValuePerAsset = initialSpotValue / numSpotAssets;

  // Creates a mapping from token address to initial price for quick lookup
  const initialPricesMap = new Map(
    user.initial_asset_prices.map((p) => [p.token_address, p.initial_price])
  );

  let totalCurrentSpotValue = 0;

  const assetDetails = spotAllocation.allocations
    .map((tokenAddress: string) => {
      const initialPrice = initialPricesMap.get(tokenAddress);
      const currentPriceData = currentPriceMap.get(tokenAddress);

      if (!initialPrice || !currentPriceData) {
        console.warn(
          `Missing price data for ${tokenAddress}. Cannot process this asset.`
        );
        return null;
      }

      const initialQuantity = initialValuePerAsset / initialPrice;

      // Get the current value of the initial amount of the asset purchased
      const currentValue =
        initialQuantity * parseFloat(currentPriceData.price_usd);

      totalCurrentSpotValue += currentValue;

      return {
        tokenAddress,
        symbol: currentPriceData.symbol,
        currentValue,
      };
    })
    .filter(Boolean);

  if (assetDetails.length === 0) {
    console.log(
      "Could not process any assets for this user due to missing data."
    );
    return;
  }

  const targetValuePerAsset = totalCurrentSpotValue / assetDetails.length;

  // Note: If any asset's current value exceeds this threshold, we flag for rebalancing
  const rebalanceHighThreshold =
    targetValuePerAsset * (1 + REBALANCE_THRESHOLD);

  console.log(`Initial Spot Value: $${initialSpotValue.toFixed(2)}`);
  console.log(`Total Current Spot Value: $${totalCurrentSpotValue.toFixed(2)}`);
  console.log(
    `Target Value Per Asset: $${targetValuePerAsset.toFixed(
      2
    )} (Threshold: > $${rebalanceHighThreshold.toFixed(2)})`
  );

  let rebalanceNeeded = false;

  assetDetails.forEach((asset) => {
    if (asset && asset.currentValue > rebalanceHighThreshold) {
      console.log(
        `REBALANCE NEEDED for ${asset.symbol} (${asset.tokenAddress.slice(
          0,
          8
        )}...). Current Value: $${asset.currentValue.toFixed(2)}`
      );
      rebalanceNeeded = true;
    } else if (asset) {
      console.log(
        `${
          asset.symbol
        } is within allocation. Current Value: $${asset.currentValue.toFixed(
          2
        )}`
      );
    }
  });

  if (!rebalanceNeeded) {
    console.log("Portfolio is balanced.");
  }
}

(async () => {
  console.log("Starting rebalancing script...");

  const users = await getAllUsers();

  if (users.length === 0) {
    console.log("No users to process. Exiting.");
    return;
  }

  const allTokenAddresses = new Set<string>();

  users.forEach((user) => {
    const spotAllocation = user.portfolio.find((p) => p.category === "spot");
    spotAllocation?.allocations.forEach((address) =>
      allTokenAddresses.add(address)
    );
  });

  console.log(
    `\nFetching prices for ${allTokenAddresses.size} unique tokens...`
  );

  const pricePromises = Array.from(allTokenAddresses).map(getCurrentTokenPrice);
  const priceResults = await Promise.all(pricePromises);

  const priceMap = new Map<string, PriceData>();
  priceResults.forEach((result) => {
    if (result) {
      priceMap.set(result.address, result);
    }
  });

  console.log(`Successfully fetched prices for ${priceMap.size} tokens.`);

  users.forEach((user) => processUserRebalance(user, priceMap));
})();
