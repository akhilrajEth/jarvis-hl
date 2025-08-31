"use client";

import React, { useEffect } from "react";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { ButtonStyles, AppBarStyles } from "./constants";
import { usePrivy } from "@privy-io/react-auth";
import { useSmartAccount } from "@/utils/useSmartAccount";
import { findOrCreateUser } from "@/utils/findOrCreateUser";

export default function Navbar() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { smartWalletAddress } = useSmartAccount();

  const router = useRouter();

  const isSignedIn = ready && authenticated;

  useEffect(() => {
    const handleUserSession = async () => {
      if (isSignedIn && user?.wallet?.address) {
        console.log("User is authenticated, checking database...");

        const linkedAccounts = user?.linkedAccounts;

        console.log("EMBEDDED WALLET:", linkedAccounts);

        const embeddedAccount = linkedAccounts?.[1] || "";

        console.log("EMBEDDED ACCOUNT ID:", embeddedAccount);
        await Promise.all([
          findOrCreateUser(user.wallet.address, embeddedAccount),
        ]);
      }
    };

    handleUserSession();
  }, [isSignedIn, router, user?.wallet?.address, user?.linkedAccounts]);

  const handleLogout = async () => {
    console.log("Logging out...");
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed with an error:", error);
    }
  };

  return (
    <AppBar position="static" elevation={0} sx={AppBarStyles}>
      <Toolbar>
       <Typography
        variant="h5" 
        component="div"
        sx={{
          flexGrow: 1,
          color: "text.primary",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 500,
          letterSpacing: "0.02em",
          textTransform: "none",
          cursor: "pointer",
          "&:hover": {
            color: "#B0B0B0", 
            transition: "color 0.2s ease-in-out", 
          },
        }}
        onClick={() => router.push("/")}
      >
        Jarvis
      </Typography>

        {ready && (
          <>
            <Box sx={{ mx: 2 }}>
              <Typography variant="body2" color="text.secondary" noWrap>
                {smartWalletAddress
                  ? `Smart Wallet: ${smartWalletAddress}`
                  : "No Smart Wallet"}
              </Typography>
            </Box>
            <Box>
              <Button
                variant="contained"
                color="primary"
                sx={ButtonStyles}
                onClick={isSignedIn ? handleLogout : login}
              >
                {isSignedIn ? "Sign Out" : "Sign In"}
              </Button>
            </Box>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}