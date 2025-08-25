import { AdvisorAssessment } from "@/types";
import { supabase } from "./supabaseClient";

/**
 * Updates the 'advisor_assessment' JSONB column for a specific user.
 *
 * @param publicAddress The user's public wallet address.
 * @param assessment The assessment object containing the risk profile and reasoning.
 * @returns The updated user data or null if an error occurred.
 */
export const updateAdvisorAssessment = async (
  publicAddress: string,
  assessment: AdvisorAssessment
) => {
  if (!publicAddress) {
    console.error("updateAdvisorAssessment Error: publicAddress is missing.");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update({ advisor_assessment: assessment })
      .eq("userPublicAddress", publicAddress)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(
      "Successfully updated advisor assessment for user:",
      publicAddress
    );
    return data;
  } catch (error) {
    console.error(
      "Database error in updateAdvisorAssessment:",
      (error as Error).message
    );
    return null;
  }
};
