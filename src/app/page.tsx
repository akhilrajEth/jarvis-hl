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
        // Only redirect if login was initiated by button
        if (loginInitiated) {
          router.push("/riskprofile");
          setLoginInitiated(false);
        }
      }
    };
    handleUserSession();
  }, [ready, authenticated, user, loginInitiated, router]);

  const handleButtonClick = async () => {
    if (!authenticated) {
      setLoginInitiated(true);
      await login();
      // Do not redirect here; wait for authentication in useEffect
    } else {
      router.push("/riskprofile");
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
          sx={{ fontWeight: 500, pt: 8 }}
        >
          Hey, I’m Jarvis{" "}
          <span role="img" aria-label="waving hand">
            👋
          </span>
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 4, maxWidth: 500, fontSize: 20 }}
        >
          No manual tweaking needed – just set it and forget it.
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
