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
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("userPublicAddress", publicAddress)
      .maybeSingle();

    if (selectError) {
      throw selectError;
    }

    if (existingUser) {
      console.log(`User ${publicAddress} already exists.`);
      return existingUser;
    }

    console.log(`Creating new user for ${publicAddress}...`);
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        userPublicAddress: publicAddress,
        embedded_account: embeddedAccount,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    console.log(`Successfully created user:`, newUser);
    return newUser;
  } catch (error) {
    console.error(
      "Database error in findOrCreateUser:",
      (error as Error).message
    );
    return null;
  }
};
