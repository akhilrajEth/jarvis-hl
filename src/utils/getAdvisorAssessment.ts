import { AdvisorAssessment } from "@/types";
import { supabase } from "./supabaseClient";

/**
 * Retrieves the 'advisor_assessment' JSONB column for a specific user.
 *
 * @param publicAddress The user's public wallet address.
 * @returns The assessment object or null if not found or an error occurred.
 */
export const getAdvisorAssessment = async (
  publicAddress: string
): Promise<AdvisorAssessment | null> => {
  if (!publicAddress) {
    console.error("getAdvisorAssessment Error: publicAddress is missing.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("advisor_assessment")
      .eq("userPublicAddress", publicAddress)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        console.log(`No advisor assessment found for user: ${publicAddress}`);
        return null;
      }
      throw error;
    }

    console.log(
      "Successfully retrieved advisor assessment for user:",
      publicAddress
    );
    return data?.advisor_assessment || null;
  } catch (error) {
    console.error(
      "Database error in getAdvisorAssessment:",
      (error as Error).message
    );
    return null;
  }
};
