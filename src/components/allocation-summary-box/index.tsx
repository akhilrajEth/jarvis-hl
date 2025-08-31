"use client";

import { Card, Typography, IconButton, Modal, TextField, Avatar } from "@mui/material";
import { VAULT_ASSET_LIST } from "../add-modal/assets";
import EditIcon from "@mui/icons-material/Edit";
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
  const [isEditPercentOpen, setIsEditPercentOpen] = useState(false);
  const [editPercent, setEditPercent] = useState(allocation.percentage);
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
          <div className="flex flex-row items-start w-full">
            <div className="flex flex-col items-start flex-1">
              <div className="flex items-center gap-2">
                <Typography variant="h4" component="p" sx={{ lineHeight: 1.2 }}>
                  {allocation.percentage}%
                </Typography>
                <IconButton size="small" onClick={() => setIsEditPercentOpen(true)}>
                  <EditIcon fontSize="small" />
                </IconButton>
              </div>
              <Typography variant="h6" sx={{ textAlign: "left" }}>{format.category}</Typography>
            </div>
            <div className="flex items-center ml-4">
              {hasButton ? (
                <PrimaryButton
                  endIcon={<AddCircleOutlineOutlinedIcon />}
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                >
                  Add
                </PrimaryButton>
              ) : (
                // Vault allocation: show asset image as clickable link
                <a href="https://app.loopingcollective.org/product/whlp" target="_blank" rel="noopener noreferrer">
                  <Avatar
                    src={VAULT_ASSET_LIST[0].image}
                    alt={VAULT_ASSET_LIST[0].name}
                    sx={{ width: 48, height: 48, cursor: "pointer" }}
                  />
                </a>
              )}
            </div>
          </div>

          <div className="mt-auto pt-4">
            <Typography variant="subtitle1" color="text.secondary">
              {format.description}
            </Typography>
          </div>
        </div>
      </Card>

      {/* Edit Percentage Modal */}
      <Modal open={isEditPercentOpen} onClose={() => setIsEditPercentOpen(false)}>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <Card sx={{ borderRadius: "24px", p: 3, minWidth: "350px" }}>
            <Typography variant="h6">Edit {format.category} Percentage</Typography>
            <TextField
              type="number"
              value={editPercent === 0 ? "" : editPercent}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") {
                  setEditPercent(0);
                } else {
                  setEditPercent(Number(val));
                }
              }}
              inputProps={{ min: 0, max: 100 }}
              sx={{ mt: 2, mb: 2 }}
            />
            <div className="flex justify-end gap-2">
              <PrimaryButton onClick={() => setIsEditPercentOpen(false)} color="secondary">Cancel</PrimaryButton>
              <PrimaryButton
                onClick={() => {
                  const event = new CustomEvent("validate-allocation-percent", {
                    detail: { category: allocation.category, percentage: editPercent },
                  });
                  window.dispatchEvent(event);
                  setIsEditPercentOpen(false);
                }}
              >Save</PrimaryButton>
            </div>
          </Card>
        </div>
      </Modal>

      <AddModal
        format={format}
        allocation={allocation}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
