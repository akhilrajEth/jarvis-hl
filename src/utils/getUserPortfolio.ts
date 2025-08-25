import { PortfolioState } from "@/types";
import { supabase } from "./supabaseClient";

/**
 * Retrieves the portfolio for a given user from the database.
 *
 * @param publicAddress The user's public wallet address.
 * @returns The user's portfolio state or null if an error occurred or the user was not found.
 */
export const getUserPortfolio = async (
  publicAddress: string
): Promise<PortfolioState | null> => {
  if (!publicAddress) {
    console.error("getUserPortfolio Error: publicAddress is missing.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("portfolio")
      .eq("userPublicAddress", publicAddress)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log(`No portfolio found for user: ${publicAddress}`);
        return null;
      }
      throw error;
    }

    console.log("Successfully retrieved portfolio for user:", publicAddress);
    return data?.portfolio || null;
  } catch (error) {
    console.error(
      "Database error in getUserPortfolio:",
      (error as Error).message
    );
    return null;
  }
};
