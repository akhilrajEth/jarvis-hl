"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  Box,
  Skeleton,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "@/components/navbar";
import { usePrivy, WalletWithMetadata } from "@privy-io/react-auth";
import { getUserPortfolio } from "@/utils/getUserPortfolio";
import { getTokenBalance } from "@/utils/getTokenBalance";
import { AllocationItem } from "@/types";
import { useSessionSigners } from "@privy-io/react-auth";

// Icon Imports
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import SavingsIcon from "@mui/icons-material/Savings";
import DonutLargeIcon from "@mui/icons-material/DonutLarge";
import LockIcon from "@mui/icons-material/Lock";
import { AllocationType } from "@/constants";

// Styled components and helper functions
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: "16px",
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
}));

const StyledTableHeadCell = styled(StyledTableCell)(({ theme }) => ({
  backgroundColor: theme.palette.grey[50],
  color: theme.palette.text.primary,
  fontWeight: 600,
}));

const getCategoryIcon = (category: AllocationType) => {
  switch (category) {
    case AllocationType.SPOT:
      return <AccountBalanceWalletIcon color="primary" />;
    case AllocationType.LENDING:
      return <SavingsIcon color="success" />;
    case AllocationType.LP:
      return <DonutLargeIcon color="warning" />;
    case AllocationType.VAULT:
      return <LockIcon color="info" />;
    default:
      return null;
  }
};

type AssetBalance = {
  balance: string;
  symbol: string;
};

export default function Dashboard() {
  const { user } = usePrivy();
  const [portfolio, setPortfolio] = useState<AllocationItem[] | null>(null);
  const [assetBalances, setAssetBalances] = useState<
    Record<string, AssetBalance | null>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { removeSessionSigners } = useSessionSigners();

  const embeddedWallet = user?.linkedAccounts.find(
    (account) =>
      account.type === "wallet" && account.walletClientType === "privy"
  ) as WalletWithMetadata;

  useEffect(() => {
    const fetchPortfolioAndBalances = async () => {
      if (
        user?.wallet?.address &&
        user.smartWallet?.address &&
        embeddedWallet?.address
      ) {
        try {
          setIsLoading(true);
          const smartWalletAddress = user.smartWallet.address;
          const embeddedWalletAddress = embeddedWallet.address;

          console.log("EMBEDDED WALLET:", embeddedWalletAddress);
          const userPortfolio = await getUserPortfolio(user.wallet.address);
          setPortfolio(userPortfolio || []);

          if (userPortfolio && userPortfolio.length > 0) {
            const balancePromises = userPortfolio.flatMap((item) =>
              item.allocations.map((assetAddress) => {
                const walletToUse =
                  item.category === AllocationType.SPOT
                    ? embeddedWalletAddress
                    : smartWalletAddress;

                return getTokenBalance(assetAddress, walletToUse).then(
                  (balance) => ({
                    address: assetAddress,
                    balance: balance,
                  })
                );
              })
            );

            const results = await Promise.all(balancePromises);

            const balances: Record<string, AssetBalance | null> = {};
            results.forEach((result) => {
              if (result) {
                balances[result.address] = result.balance;
              }
            });

            setAssetBalances(balances);
          }
        } catch (err) {
          setError(
            "Failed to fetch your portfolio data. Please try again later."
          );
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };
    fetchPortfolioAndBalances();
  }, [user]);

  const removeSessionSigner = useCallback(
    async (walletAddress: string) => {
      setIsLoading(true);
      try {
        if (walletAddress) {
          await removeSessionSigners({ address: walletAddress });
        }
      } catch (error) {
        console.error("Error removing session signer:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [removeSessionSigners]
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <CircularProgress />
        </div>
      );
    }
    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }
    if (!portfolio || portfolio.length === 0) {
      return (
        <Alert severity="info">You haven't set up your portfolio yet.</Alert>
      );
    }

    return (
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 2 }}
      >
        <Table aria-label="user portfolio">
          <TableHead>
            <TableRow>
              <StyledTableHeadCell>Category</StyledTableHeadCell>
              <StyledTableHeadCell align="right">
                Allocation %
              </StyledTableHeadCell>
              <StyledTableHeadCell>Allocations</StyledTableHeadCell>
              <StyledTableHeadCell align="right">Balance</StyledTableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {portfolio.map((item) => (
              <TableRow key={item.category}>
                <StyledTableCell>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    {getCategoryIcon(item.category)}
                    <Typography
                      variant="body1"
                      fontWeight={500}
                      sx={{ textTransform: "capitalize" }}
                    >
                      {item.category}
                    </Typography>
                  </Box>
                </StyledTableCell>
                <StyledTableCell align="right">
                  <Typography variant="body1">{`${item.percentage}%`}</Typography>
                </StyledTableCell>
                <StyledTableCell>
                  {item.allocations.length > 0 ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {item.allocations.map((address) => (
                        <Typography
                          key={address}
                          variant="body2"
                          sx={{ fontFamily: "monospace" }}
                        >
                          {address}
                        </Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No specific allocations
                    </Typography>
                  )}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {item.allocations.length > 0 ? (
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      {item.allocations.map((address) => {
                        const balanceInfo = assetBalances[address];
                        return (
                          <Box key={address} sx={{ height: 20 }}>
                            {balanceInfo === undefined ? (
                              <Skeleton width={80} />
                            ) : balanceInfo ? (
                              <Typography variant="body2" fontWeight={500}>
                                {`${balanceInfo.balance} ${balanceInfo.symbol}`}
                              </Typography>
                            ) : (
                              <Typography
                                variant="body2"
                                color="error"
                                sx={{ fontSize: "0.8rem" }}
                              >
                                Balance N/A
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    "—"
                  )}
                </StyledTableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const hasSessionSigners = embeddedWallet?.delegated === true;

  return (
    <div>
      <Navbar />
      <main className="p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Typography variant="h5" fontWeight={600}>
                Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                A summary of your current onchain portfolio.
              </Typography>
            </div>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={() => removeSessionSigner(embeddedWallet?.address)}
              disabled={isLoading || !hasSessionSigners}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                borderRadius: "12px",
              }}
            >
              {isLoading ? "Processing..." : "Remove Session Signer"}
            </Button>
          </div>
          <div className="mt-8">{renderContent()}</div>
        </div>
      </main>
    </div>
  );
}
