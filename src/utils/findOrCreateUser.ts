import { supabase } from "./supabaseClient";

/**
 * Finds a user by their public address. If the user doesn't exist, it creates a new entry
 * with their public address and embedded account details.
 *
 * @param publicAddress The user's public wallet address.
 * @param embeddedAccount The user's embedded account data from Privy.
 * @returns The user's data from the database, or null if an error occurs.
 */
export const findOrCreateUser = async (
  publicAddress: string | undefined,
  embeddedAccount?: any
) => {
  if (!publicAddress) {
    console.error(
      "findOrCreateUser Error: publicAddress is missing or invalid."
    );
    return null;
  }

  try {
    // Use upsert for atomic insert/update
    const { data: upsertedUser, error: upsertError } = await supabase
      .from("users")
      .upsert({
        userPublicAddress: publicAddress,
        embedded_account: embeddedAccount,
      }, { onConflict: "userPublicAddress" })
      .select()
      .single();

    if (upsertError) {
      throw upsertError;
    }

    console.log(`User upserted:`, upsertedUser);
    return upsertedUser;
  } catch (error) {
    console.error(
      "Database error in findOrCreateUser:",
      (error as Error).message
    );
    return null;
  }
};
