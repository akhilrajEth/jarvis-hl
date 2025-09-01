import React, { FC, useState } from "react";
import { Box, Typography, IconButton, Tooltip } from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

interface SmartWalletAddressProps {
  address: string | undefined | null;
}

const truncateAddress = (address: string | undefined | null): string => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

export const SmartWalletAddress: FC<SmartWalletAddressProps> = ({
  address,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (): void => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!address) {
    return (
      <Typography variant="body2" color="text.secondary">
        No Smart Wallet
      </Typography>
    );
  }

  return (
    <Tooltip title={"This is your smart wallet address"} placement="bottom">
      <div className="flex items-center rounded-xl border border-black/[.12] bg-black/[.04] py-1 px-2 cursor-pointer">
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontFamily: "monospace", mr: 1 }}
        >
          {truncateAddress(address)}
        </Typography>
        <Tooltip title={copied ? "Copied!" : "Copy address"} placement="top">
          <IconButton onClick={handleCopy} size="small" sx={{ p: "2px" }}>
            {copied ? (
              <CheckCircleOutlineIcon fontSize="small" color="success" />
            ) : (
              <ContentCopyIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      </div>
    </Tooltip>
  );
};
