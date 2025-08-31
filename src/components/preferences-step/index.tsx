"use client";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
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
  Button,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import { useCallback, useState } from "react";
import { usePrivy, WalletWithMetadata } from "@privy-io/react-auth";
import PrimaryButton from "@/components/primary-button";
import EastRoundedIcon from "@mui/icons-material/EastRounded";
import { useSessionSigners } from "@privy-io/react-auth";
import VpnKeyIcon from "@mui/icons-material/VpnKey";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useRouter } from "next/navigation";



interface PreferencesStepProps {
  isOnboarding?: boolean;
  onBack?: () => void;
}

export default function PreferencesStep({isOnboarding = false, onBack }: PreferencesStepProps) {
  const router = useRouter();
  const { addSessionSigners } = useSessionSigners();

  const [rebalanceFrequency, setRebalanceFrequency] = useState("weekly");
  const [rebalanceEnabled, setRebalanceEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const { user } = usePrivy();
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
      if (!SESSION_SIGNER_ID) return;
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
        // handle error
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
  <div style={{ minHeight: "80vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", marginBottom: 48 }}>
      <Typography variant="h6" fontWeight={550} style={{ textAlign: "center", marginBottom: 32 }}>
        Before your self-custodied portfolio is created, please complete the following...
      </Typography>
      <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", width: "100%" }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, maxWidth: 480, width: "100%" }}>
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
                  sx={{ mt: 2 }}
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
                  sx={{ mt: 2, width: "100%" }}
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
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, maxWidth: 480, width: "100%" }}>
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
      <div style={{ paddingTop: 48, width: "100%", display: "flex", justifyContent: "center", gap: 16 }}>
        {isOnboarding && (
          <Button
            variant="text"
            size="medium"
            startIcon={<ArrowBackIosNewIcon />}
            sx={{
              color: "#b3b3b3",
              fontWeight: 400,
              fontSize: "0.98rem",
              boxShadow: "none",
              border: "none",
              background: "none",
              textTransform: "none",
              p: 0,
              minWidth: 0,
              fontStyle: "italic",
              letterSpacing: 0,
              opacity: 0.85,
              '&:hover': {
                background: 'none',
                textDecoration: 'underline',
                opacity: 1,
              },
            }}
            onClick={onBack}
          >
            Back
          </Button>
        )}
        <PrimaryButton onClick={handleContinue}>
          Continue
        </PrimaryButton>
      </div>
    </div>
  );
}
