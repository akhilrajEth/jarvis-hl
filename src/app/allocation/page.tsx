"use client";

import { useEffect, useState } from "react";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import Navbar from "@/components/navbar";
import PrimaryButton from "@/components/primary-button";
import AllocationSummaryBox from "@/components/allocation-summary-box";
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

export default function Allocation() {
  const { state: portfolio } = usePortfolio();
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
    router.push("/preferences");
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
      <Navbar />

      <main className="p-8 overflow-y-auto">
        <div className="flex flex-col gap-1">
          <Typography variant="h6" fontWeight={550}>
            Here’s the portfolio I designed for you...
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your portfolio is based on a{" "}
            <b className="text-black">{assessment?.risk_profile || "..."}</b>{" "}
            risk profile. Start adding assets you prefer for each category.
          </Typography>
        </div>

        <div className="max-w-[40rem] pt-8">
          {!isLoading && assessment && (
            <Accordion
              variant="outlined"
              sx={{
                borderRadius: 2,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="reasoning-panel-content"
                id="reasoning-panel-header"
              >
                <div className="flex items-center gap-2">
                  <PsychologyIcon color="action" />
                  <Typography fontWeight={500}>
                    View Reasoning Behind This Portfolio
                  </Typography>
                </div>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary">
                  {assessment.reasoning}
                </Typography>
              </AccordionDetails>
            </Accordion>
          )}
        </div>

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

          <div className="pt-12">
            <PrimaryButton
              onClick={handleContinue}
              endIcon={<EastRoundedIcon />}
            >
              Continue
            </PrimaryButton>
          </div>
        </div>
      </main>
    </div>
  );
}
