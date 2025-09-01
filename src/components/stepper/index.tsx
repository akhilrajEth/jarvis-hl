import React from "react";
import Chip from "@mui/material/Chip";

interface SimpleStepperProps {
  activeStep: number;
  totalSteps: number;
}

const SimpleStepper: React.FC<SimpleStepperProps> = ({
  activeStep,
  totalSteps,
}) => {
  const currentStep = Math.min(activeStep, totalSteps);

  return (
    <div className="w-full flex justify-center items-center">
      <Chip
        label={`Step ${currentStep}/${totalSteps}`}
        variant="outlined"
        sx={{
          fontWeight: 500,
          borderColor: "rgba(0, 0, 0, 0.12)",
          color: "text.secondary",
        }}
      />
    </div>
  );
};

export default SimpleStepper;
