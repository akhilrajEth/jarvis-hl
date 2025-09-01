"use client";

import Navbar from "@/components/navbar";
import {
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  Box,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useCallback, useState } from "react";
import { usePrivy, WalletWithMetadata } from "@privy-io/react-auth";
import PrimaryButton from "@/components/primary-button";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { useRouter } from "next/navigation";
import { useSessionSigners } from "@privy-io/react-auth";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

export default function Preferences() {
  const { addSessionSigners } = useSessionSigners();

  const [rebalanceFrequency, setRebalanceFrequency] = useState("weekly");
  const [rebalanceEnabled, setRebalanceEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = usePrivy();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const smartWalletAddress = user?.smartWallet?.address || "";
  const SESSION_SIGNER_ID = process.env.NEXT_PUBLIC_SESSION_SIGNER_ID;

  const handleRebalanceFrequencyChange = (
    event: React.MouseEvent<HTMLElement>,
    newFrequency: string | null
  ) => {
    if (newFrequency !== null) {
      setRebalanceFrequency(newFrequency);
    }
  };

  const handleRebalanceToggle = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRebalanceEnabled(event.target.checked);
  };

  const handleCopy = () => {
    if (smartWalletAddress) {
      navigator.clipboard.writeText(smartWalletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleContinue = () => {
    router.push("/creating");
  };

  const addSessionSigner = useCallback(
    async (walletAddress: string) => {
      console.log("Adding session signer to wallet:", walletAddress);
      if (!SESSION_SIGNER_ID) {
        console.error("SESSION_SIGNER_ID must be defined to addSessionSigner");
        return;
      }

      setIsLoading(true);
      try {
        await addSessionSigners({
          address: walletAddress,
          signers: [
            {
              signerId: SESSION_SIGNER_ID,
              policyIds: ["zyvzv0qdnqu5a3f0s87jw3m8"],
            },
          ],
        });
      } catch (error) {
        console.error("Error adding session signer:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [addSessionSigners, SESSION_SIGNER_ID]
  );

  const embeddedWallet = user?.linkedAccounts.find(
    (account) =>
      account.type === "wallet" && account.walletClientType === "privy"
  ) as WalletWithMetadata;

  const hasSessionSigners = embeddedWallet?.delegated === true;

  return (
    <div>
      <Navbar />

      <main className="p-8">
        <Typography variant="h6" fontWeight={550}>
          Before I start creating your portfolio, please complete the
          following...
        </Typography>

        <div className="flex flex-col gap-12 mt-16 max-w-xl">
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <Typography variant="subtitle1" fontWeight={500}>
                  1. Enable Auto-Rebalance
                </Typography>
                <Switch
                  checked={rebalanceEnabled}
                  onChange={handleRebalanceToggle}
                />
              </div>

              {rebalanceEnabled && (
                <>
                  <ToggleButtonGroup
                    value={rebalanceFrequency}
                    exclusive
                    onChange={handleRebalanceFrequencyChange}
                    aria-label="rebalance frequency"
                  >
                    <ToggleButton
                      value="everyday"
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Everyday
                    </ToggleButton>
                    <ToggleButton
                      value="weekly"
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Weekly
                    </ToggleButton>
                    <ToggleButton
                      value="monthly"
                      sx={{ textTransform: "none", borderRadius: 2 }}
                    >
                      Monthly
                    </ToggleButton>
                  </ToggleButtonGroup>

                  <Alert
                    severity="info"
                    icon={<InfoOutlinedIcon fontSize="inherit" />}
                  >
                    This allows us to automatically handle rebalancing on your
                    behalf by using a temporary, secure session key.
                  </Alert>

                  <PrimaryButton
                    onClick={() => addSessionSigner(embeddedWallet.address)}
                    disabled={isLoading || hasSessionSigners}
                    startIcon={
                      hasSessionSigners ? <CheckCircleIcon /> : <VpnKeyIcon />
                    }
                    color={hasSessionSigners ? "success" : "primary"}
                  >
                    {isLoading
                      ? "Processing..."
                      : hasSessionSigners
                      ? "Session Key Active"
                      : "Add Session Key"}
                  </PrimaryButton>
                </>
              )}
            </div>
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
            <div className="flex flex-col gap-2">
              <Typography variant="subtitle1" fontWeight={500}>
                2. Deposit funds to your smart account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                To begin, send funds to the smart account address below. This
                address is unique to you.
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 1.5,
                  bgcolor: "grey.100",
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "grey.300",
                  mt: 1,
                }}
              >
                <Typography
                  variant="body2"
                  component="span"
                  sx={{
                    fontFamily: "monospace",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    mr: 2,
                  }}
                >
                  {smartWalletAddress || "Loading address..."}
                </Typography>
                <Tooltip
                  title={copied ? "Copied!" : "Copy address"}
                  placement="top"
                >
                  <IconButton onClick={handleCopy} size="small">
                    {copied ? (
                      <CheckIcon color="success" fontSize="small" />
                    ) : (
                      <ContentCopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Box>
            </div>
          </Paper>
        </div>

        <div className="pt-12">
          <PrimaryButton onClick={handleContinue} endIcon={<EastRoundedIcon />}>
            Continue
          </PrimaryButton>
        </div>
      </main>
    </div>
  );
}
