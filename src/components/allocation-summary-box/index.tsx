"use client";

import { Card, Typography } from "@mui/material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import PrimaryButton from "../primary-button";
import { useState } from "react";
import AddModal from "../add-modal";
import { AllocationFormat, AllocationItem } from "@/types";

interface AllocationSummaryBoxProps {
  format: AllocationFormat;
  allocation: AllocationItem;
  hasButton?: boolean;
}

export default function AllocationSummaryBox({
  format,
  allocation,
  hasButton = true,
}: AllocationSummaryBoxProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <>
      <Card
        variant="outlined"
        sx={{
          borderRadius: "16px",
          p: 4,
          width: "100%",
          maxWidth: "325px",
        }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between">
            <div>
              <Typography variant="h4" component="p" sx={{ lineHeight: 1.2 }}>
                {allocation.percentage}%
              </Typography>
              <Typography variant="h6">{format.category}</Typography>
            </div>

            {hasButton ? (
              <PrimaryButton
                endIcon={<AddCircleOutlineOutlinedIcon />}
                onClick={() => {
                  setIsModalOpen(true);
                }}
              >
                Add
              </PrimaryButton>
            ) : null}
          </div>

          <div className="mt-auto pt-4">
            <Typography variant="subtitle1" color="text.secondary">
              {format.description}
            </Typography>
          </div>
        </div>
      </Card>

      <AddModal
        format={format}
        allocation={allocation}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
