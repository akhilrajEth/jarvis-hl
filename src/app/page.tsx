"use client";

import React, { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import "./typeAnimation.css";
import { BoxStyles, ButtonStyles } from "./constants";
import Navbar from "../components/navbar";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { findOrCreateUser } from "@/utils/findOrCreateUser";
import { GlowOrb } from "@/components/orb";
import { getUserPortfolio } from "@/utils/getUserPortfolio";

export default function Home() {
  const router = useRouter();
  const { ready, authenticated, user, login } = usePrivy();

  const [loginInitiated, setLoginInitiated] = React.useState(false);

  useEffect(() => {
    const handleUserSession = async () => {
      if (ready && authenticated && user?.wallet?.address) {
        const embeddedAccount = user.linkedAccounts.find(
          (account) =>
            account.type === "wallet" && account.walletClientType === "privy"
        );
        if (embeddedAccount) {
          await findOrCreateUser(user.wallet.address, embeddedAccount);
        }
      }
    };
    handleUserSession();
  }, [ready, authenticated, user, loginInitiated, router]);

  const handleButtonClick = async () => {
    if (!authenticated) {
      setLoginInitiated(true);
      await login();
    } else {
      const walletAddress = user?.wallet?.address;
      if (!walletAddress) {
        return;
      }
      const portfolio = await getUserPortfolio(walletAddress);
      if (!portfolio) {
        router.push("/onboarding");
      } else {
        router.push("/dashboard");
      }
    }
  };

  return (
    <div>
      <Navbar />
      <Box sx={BoxStyles}>
        <GlowOrb size={150} color="rgba(100, 200, 255, 0.3)" top="15%" />

        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 500, pt: 50 }}
        >
          Hey, I’m Jarvis{" "}
          <span role="img" aria-label="waving hand">
            👋
          </span>
        </Typography>

        <Typography variant="h5" component="p" gutterBottom>
          Your onchain co-pilot.
        </Typography>

        <Typography
          variant="body1"
          component="p"
          sx={{ fontStyle: "italic", color: "gray", marginBottom: 4 }}
        >
          I’ll help you create the best portfolio allocation across{" "}
          <strong>vaults, LP, lending, and spot</strong>, and actively rebalance
          it for you.
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={ButtonStyles}
          onClick={handleButtonClick}
        >
          {authenticated ? "Go to App" : "Get Started"}
        </Button>
      </Box>
    </div>
  );
}
