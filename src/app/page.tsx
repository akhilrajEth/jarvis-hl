// src/app/page.tsx

"use client";

import React, { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { GlowOrb } from "../components/orb";
import { BoxStyles, ButtonStyles } from "./constants";
import Navbar from "../components/navbar";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { findOrCreateUser } from "@/utils/findOrCreateUser";

export default function Home() {
  const router = useRouter();
  const { ready, authenticated, user, login } = usePrivy();

  useEffect(() => {
    const handleUserSession = async () => {
      if (ready && authenticated && user?.wallet?.address) {
        console.log("User is authenticated, checking database...");

        const embeddedAccount = user.linkedAccounts.find(
          (account) =>
            account.type === "wallet" && account.walletClientType === "privy"
        );

        if (embeddedAccount) {
          await findOrCreateUser(user.wallet.address, embeddedAccount);
          router.push("/riskprofile");
        } else {
          console.error("Embedded wallet not found after login.");
        }
      }
    };

    handleUserSession();
  }, [ready, authenticated, user, router]);

  const handleLogin = () => {
    login();
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
          sx={{ fontWeight: 500, pt: 8 }}
        >
          Hey, I’m Jarvis{" "}
          <span role="img" aria-label="waving hand">
            👋
          </span>
        </Typography>

        <Typography variant="h5" component="p" gutterBottom>
          I can optimize your DeFi yield for you.
        </Typography>

        <Typography
          variant="body1"
          component="p"
          sx={{ fontStyle: "italic", color: "gray", marginBottom: 4 }}
        >
          No manual tweaking needed – just set it and forget it.
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={ButtonStyles}
          onClick={handleLogin}
        >
          Get Started
        </Button>
      </Box>
    </div>
  );
}
