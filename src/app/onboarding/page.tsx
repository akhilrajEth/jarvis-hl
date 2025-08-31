"use client";


import React, { useState } from "react";
import { Box, Typography, Button, List, ListItem, ListItemIcon, ListItemText } from "@mui/material";
import { BoxStyles, ButtonStyles } from "../constants";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useRouter } from "next/navigation";
import AllocationView from "@/components/allocation-view";
import PreferencesStep from "@/components/preferences-step";

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState<number>(0);

  React.useEffect(() => {
    const nextStepHandler = () => setStep((prev) => prev + 1);
    window.addEventListener("onboarding-next-step", nextStepHandler);
    return () => {
      window.removeEventListener("onboarding-next-step", nextStepHandler);
    };
  }, []);

  return (
  <Box sx={{ ...BoxStyles, minHeight: "100vh", background: "var(--color-background)", pt: 8 }}>
      {/* Top left stepper and header */}
      {/* Centered stepper at top */}
  <Box sx={{ position: "absolute", top: 16, left: 0, width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2, justifyContent: "center" }}>
    <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: Number(step) === 0 ? "#73F4C9" : "#333", color: Number(step) === 0 ? "#222" : "#b3b3b3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>1</Box>
    <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: Number(step) === 1 ? "#73F4C9" : "#333", color: Number(step) === 1 ? "#222" : "#b3b3b3", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 20 }}>2</Box>
        </Box>
      </Box>
      {/* Header only, no Skip button */}
      {step === 0 && (
        <Box sx={{ position: "absolute", top: 60, left: 32 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: "var(--color-foreground)" }}>
            Create your portfolio
          </Typography>
        </Box>
      )}
      {step === 0 ? (
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", width: "100%", mt: 10, ml: 8 }}>
          <Box sx={{ width: "100%", maxWidth: "48rem", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            {/* AllocationView left-aligned under header, pass onboarding prop */}
            <AllocationView isOnboarding={true} onSkip={() => router.push("/dashboard")} />
          </Box>
        </Box>
      ) : (
        <Box sx={{ width: "100%", maxWidth: "48rem", mt: 10, ml: 8 }}>
          <PreferencesStep
            onContinue={() => router.push("/riskprofile")}
            isOnboarding={true}
            onBack={() => setStep(0)}
          />
        </Box>
      )}
    </Box>
  );
}
