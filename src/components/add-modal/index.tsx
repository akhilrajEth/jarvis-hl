"use client";

import { Modal, Card, Typography, Chip, TextField, List, ListItem, ListItemAvatar, Avatar, ListItemText, Checkbox, ListItemButton } from "@mui/material";
import { SPOT_ASSETS_LIST, LENDING_ASSETS_LIST, VAULT_ASSET_LIST, LP_ASSET_LIST } from "./assets";
import type { Asset, LPAsset } from "./types";
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
  const [customAddress, setCustomAddress] = useState("");
  const { dispatch } = usePortfolio();

  const [selectedAssets, setSelectedAssets] = useState<string[]>(allocation.allocations || []);

  useEffect(() => {
    if (open) {
      setSelectedAssets(allocation.allocations || []);
    }
  }, [open, allocation.allocations]);

  const handleToggleAsset = (address: string) => {
    setSelectedAssets((prev) =>
      prev.includes(address)
        ? prev.filter((a) => a !== address)
        : [...prev, address]
    );
  };

  const handleSubmit = () => {
    dispatch({
      type: "UPDATE_ALLOCATION",
      payload: {
        category: allocation.category,
        allocations: selectedAssets,
      },
    });
    onClose();
  };

  // Choose asset list based on allocation category
  let currentAssetList = SPOT_ASSETS_LIST;
  if (allocation.category === "lending") currentAssetList = LENDING_ASSETS_LIST;
  else if (allocation.category === "vault") currentAssetList = VAULT_ASSET_LIST;
  else if (allocation.category === "lp") currentAssetList = LP_ASSET_LIST;

  // Build a combined list: prefilled assets + custom addresses
  const prefilledAddresses = (currentAssetList as Asset[]).map(a => a.address);
  const customAddresses = selectedAssets.filter(addr => !prefilledAddresses.includes(addr));
  const combinedAssets = [
    ...(currentAssetList as Asset[]),
    ...customAddresses.map(addr => ({
      name: "Custom Token",
      address: addr,
      image: undefined,
    }))
  ];

  const assetList = (
    <List>
      {combinedAssets.map((asset) => {
        const isLP = (a: Asset): a is LPAsset => 'image1' in a && 'image2' in a;
        return (
          <ListItem key={asset.address} disablePadding>
            <ListItemButton onClick={() => handleToggleAsset(asset.address)}>
              <ListItemAvatar>
                {isLP(asset) ? (
                  <div style={{ position: 'relative', width: 48, height: 48 }}>
                    <img
                      src={asset.image1}
                      alt={asset.name + ' 1'}
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        width: 32,
                        height: 32,
                        zIndex: 2,
                        borderRadius: '50%',
                        border: '2px solid #222',
                        background: '#222',
                      }}
                    />
                    <img
                      src={asset.image2}
                      alt={asset.name + ' 2'}
                      style={{
                        position: 'absolute',
                        left: 16,
                        top: 16,
                        width: 32,
                        height: 32,
                        zIndex: 1,
                        borderRadius: '50%',
                        border: '2px solid #222',
                        background: '#222',
                      }}
                    />
                  </div>
                ) : asset.image ? (
                  <Avatar src={asset.image} alt={asset.name} />
                ) : (
                  <Avatar>{asset.name[0]}</Avatar>
                )}
              </ListItemAvatar>
              <ListItemText
                primary={asset.name}
                secondary={asset.address}
              />
              <Checkbox
                edge="end"
                checked={selectedAssets.includes(asset.address)}
                tabIndex={-1}
                disableRipple
              />
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );

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


            {assetList}

            {/* Add custom contract address input */}
            <div className="flex items-center gap-2 mt-4">
              <TextField
                label="paste contract address"
                variant="outlined"
                size="small"
                value={customAddress}
                onChange={e => setCustomAddress(e.target.value)}
                sx={{ flex: 1 }}
              />
              <PrimaryButton
                onClick={() => {
                  if (customAddress && /^0x[a-fA-F0-9]{40}$/.test(customAddress)) {
                    setSelectedAssets(prev =>
                      prev.includes(customAddress)
                        ? prev
                        : [...prev, customAddress]
                    );
                    setCustomAddress("");
                  }
                }}
                disabled={!customAddress || !/^0x[a-fA-F0-9]{40}$/.test(customAddress)}
              >
                Add
              </PrimaryButton>
            </div>

            <div className="flex justify-end">
              <PrimaryButton onClick={handleSubmit}>Submit</PrimaryButton>
            </div>
          </div>
        </Card>
      </div>
    </Modal>
  );
}
