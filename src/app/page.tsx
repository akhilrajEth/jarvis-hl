// src/app/page.tsx

"use client";

import React, { useEffect } from "react";
import { Box, Typography, Button } from "@mui/material";
import { TypeAnimation } from "react-type-animation";
import "./typeAnimation.css";
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
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: 500, pt: 8 }}
        >
          Crypto on Autopilot
        </Typography>

        <Typography
          variant="h5"
          component="h2"
          gutterBottom
          sx={{ fontWeight: 400, color: "#73F4C9" }}
        >
          <span style={{ position: "relative" }}>
            <span className="custom-type-animation">
              <TypeAnimation
                sequence={[
                  "Lending",
                  2000,
                  "Swaps",
                  2000,
                  "Vaults",
                  2000,
                  "LP",
                  2000,
                ]}
                wrapper="span"
                speed={50}
                repeat={Infinity}
                cursor={false}
              />
            </span>
            <span className="custom-cursor" style={{ fontWeight: 700, color: "#73F4C9" }}>_</span>
          </span>
        </Typography>

        <Button
          variant="contained"
          size="large"
          sx={{ ...ButtonStyles, mt: 4 }}
          onClick={handleButtonClick}
        >
          {authenticated ? "Go to App" : "Get Started"}
        </Button>
      </Box>
    </div>
  );
}
