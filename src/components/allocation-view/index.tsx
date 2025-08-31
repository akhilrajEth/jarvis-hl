"use client";

import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import JarvisAIChat from "@/components/jarvis-ai-chat";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Navbar from "@/components/navbar";
import PrimaryButton from "@/components/primary-button";
import AllocationSummaryBox from "@/components/allocation-summary-box";
import { useCallback } from "react";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PsychologyIcon from "@mui/icons-material/Psychology";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { getAdvisorAssessment } from "@/utils/getAdvisorAssessment";
import { AdvisorAssessment } from "@/types";
import {
  LENDING_ALLOCATION_FORMAT,
  LP_ALLOCATION_FORMAT,
  SPOT_ALLOCATION_FORMAT,
  VAULT_ALLOCATION_FORMAT,
} from "./constants";
import { AllocationType } from "@/constants";

interface AllocationViewProps {
  isOnboarding?: boolean;
  onSkip?: () => void;
}

export default function Allocation({ isOnboarding = false, onSkip }: AllocationViewProps) {
  const { state: portfolio, dispatch } = usePortfolio();
  // Listen for percent edit events from AllocationSummaryBox
  useEffect(() => {
    const handler = (e: any) => {
      const { category, percentage } = e.detail;
      dispatch({
        type: "SET_PORTFOLIO_PERCENTAGES",
        payload: portfolio.map((item) =>
          item.category === category
            ? { category, percentage }
            : { category: item.category, percentage: item.percentage }
        ),
      });
    };
    window.addEventListener("validate-allocation-percent", handler);
    return () => window.removeEventListener("validate-allocation-percent", handler);
  }, [portfolio, dispatch]);
  const router = useRouter();
  const { user } = usePrivy();

  // 2. Add state to hold the fetched assessment data
  const [assessment, setAssessment] = useState<AdvisorAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 3. Fetch the advisor assessment when the component mounts
  useEffect(() => {
    console.log("INSIDE USE EFFECT");
    const fetchAssessment = async () => {
      if (user?.wallet?.address) {
        setIsLoading(true);
        const fetchedAssessment = await getAdvisorAssessment(
          user.wallet.address
        );
        setAssessment(fetchedAssessment);
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [user?.wallet?.address]);

  const handleContinue = () => {
    const total = portfolio.reduce((sum, item) => sum + item.percentage, 0);
    if (total !== 100) {
      alert("Total allocation percentage must add up to 100%.");
      return;
    }
    if (isOnboarding) {
      // Go to next onboarding step (step 2)
      window.dispatchEvent(new CustomEvent("onboarding-next-step"));
    } 
  };

  const findAllocation = (category: AllocationType) => {
    return (
      portfolio.find((item) => item.category === category) || {
        category,
        percentage: 0,
        allocations: [],
      }
    );
  };

  return (
    <div className="flex flex-col h-screen">
      <main className="p-8 overflow-y-auto">
        <div className="flex flex-col gap-4 max-w-[40rem] pt-8">
          <div className="flex flex-row gap-12">
            <AllocationSummaryBox
              format={SPOT_ALLOCATION_FORMAT}
              allocation={findAllocation(AllocationType.SPOT)}
            />
            <AllocationSummaryBox
              format={VAULT_ALLOCATION_FORMAT}
              allocation={findAllocation(AllocationType.VAULT)}
              hasButton={false}
            />
          </div>
          <div className="flex flex-row gap-12">
            <AllocationSummaryBox
              format={LENDING_ALLOCATION_FORMAT}
              allocation={findAllocation(AllocationType.LENDING)}
            />
            <AllocationSummaryBox
              format={LP_ALLOCATION_FORMAT}
              allocation={findAllocation(AllocationType.LP)}
            />
          </div>
          <div className="pt-12 flex gap-4 justify-center">
            <PrimaryButton
              onClick={handleContinue}
            >
              Continue
            </PrimaryButton>
            {isOnboarding && (
              <Button
                variant="text"
                size="medium"
                sx={{
                  color: "#b3b3b3",
                  fontWeight: 400,
                  fontSize: "0.98rem",
                  boxShadow: "none",
                  border: "none",
                  background: "none",
                  textTransform: "none",
                  p: 0,
                  minWidth: 0,
                  fontStyle: "italic",
                  letterSpacing: 0,
                  opacity: 0.85,
                  '&:hover': {
                    background: 'none',
                    textDecoration: 'underline',
                    opacity: 1,
                  },
                }}
                onClick={onSkip}
              >
                Skip →
              </Button>
            )}
          </div>
        </div>
        {/* Jarvis AI Chat floating chatbox */}
        <JarvisAIChat />
      </main>
    </div>
  );
}