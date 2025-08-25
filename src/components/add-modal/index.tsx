"use client";

import { Modal, Card, Typography, Chip, TextField } from "@mui/material";
import { useEffect, useState } from "react";
import PrimaryButton from "../primary-button";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { AddModalProps } from "./types";

export default function AddModal({
  format,
  allocation,
  open,
  onClose,
}: AddModalProps) {
  const { dispatch } = usePortfolio();

  const [addresses, setAddresses] = useState<string[]>(["", "", "", "", ""]);

  useEffect(() => {
    if (open) {
      const currentAddresses = allocation.allocations;
      const newAddresses = [...currentAddresses];
      while (newAddresses.length < 5) {
        newAddresses.push("");
      }
      setAddresses(newAddresses);
    }
  }, [open, allocation.allocations]);

  const handleAddressChange = (index: number, value: string) => {
    const newAddresses = [...addresses];
    newAddresses[index] = value;
    setAddresses(newAddresses);
  };

  const handleSubmit = () => {
    const finalAddresses = addresses.filter((addr) => addr.trim() !== "");
    console.log("Submitting addresses:", finalAddresses);

    dispatch({
      type: "UPDATE_ALLOCATION",
      payload: {
        category: allocation.category,
        allocations: finalAddresses,
      },
    });
    onClose();
  };

  const assetInputFields = addresses.map((address, i) => (
    <TextField
      key={i}
      variant="outlined"
      fullWidth
      value={address}
      onChange={(e) => handleAddressChange(i, e.target.value)}
      placeholder={"0x..."}
      sx={{
        "& .MuiOutlinedInput-root": {
          borderRadius: "12px",
          "&.Mui-focused fieldset": {
            borderColor: "black",
          },
        },
      }}
    />
  ));

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="allocation-settings-modal-title"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Card
          sx={{
            borderRadius: "24px",
            p: 3,
            width: "100%",
            minWidth: "600px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.05)",
            outline: "none",
          }}
        >
          <div className="flex flex-col gap-6">
            <div>
              <Typography id="allocation-settings-modal-title" variant="h4">
                {format.category}
              </Typography>
              <div className="flex items-center gap-2 mt-2">
                <Chip
                  label={`${allocation.percentage}% Allocation`}
                  sx={{
                    backgroundColor: "#e3f2fd",
                    color: "#1565c0",
                    fontWeight: "500",
                  }}
                />
                <Chip
                  label={format.riskLevel.description}
                  sx={{
                    backgroundColor: format.riskLevel.bgColor,
                    color: format.riskLevel.textColor,
                    fontWeight: "500",
                  }}
                />
              </div>
            </div>

            {assetInputFields}

            <div className="flex justify-end">
              <PrimaryButton onClick={handleSubmit}>Submit</PrimaryButton>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
