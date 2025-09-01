"use client";

import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import PrimaryButton from "@/components/primary-button";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { AllocationType } from "@/constants";
import { AdvisorAssessment } from "@/types";
import { getAdvisorAssessment } from "@/utils/getAdvisorAssessment";
import { usePrivy } from "@privy-io/react-auth";
import AllocationSummaryBox from "@/components/allocation-summary-box";
import { usePortfolio } from "@/providers/PortfolioProvider";
import ReasoningAccordion from "@/components/reasoning-accordion";
import {
  LENDING_ALLOCATION_FORMAT,
  LP_ALLOCATION_FORMAT,
  SPOT_ALLOCATION_FORMAT,
  VAULT_ALLOCATION_FORMAT,
} from "./constants";
import CopilotButton from "@/components/copilot-button";
import SimpleStepper from "@/components/stepper";
import JarvisSidebar from "@/components/jarvis-ai-chat";

export default function Onboarding() {
  const router = useRouter();
  const [assessment, setAssessment] = useState<AdvisorAssessment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { user } = usePrivy();

  const { state: portfolio } = usePortfolio();

  useEffect(() => {
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
    router.push("/onboarding/preferences");
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

      <JarvisSidebar
        open={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="p-8 overflow-y-auto">
        <SimpleStepper activeStep={1} totalSteps={2} />
        <div className="flex flex-col gap-1">
          <Typography variant="h6" fontWeight={550}>
            Let’s create your portfolio
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Start adding assets, LP pools, or lending markets you prefer for
            each allocation category.{" "}
          </Typography>
        </div>

        <div className="pt-4">
          <CopilotButton onClick={() => setSidebarOpen(true)} />
        </div>

        <div className="max-w-[40rem] pt-8">
          {!isLoading && assessment && (
            <ReasoningAccordion reasoning={assessment.reasoning} />
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
