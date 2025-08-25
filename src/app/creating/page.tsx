"use client";

import Navbar from "@/components/navbar";
import { Typography } from "@mui/material";
import { usePrivy, WalletWithMetadata } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { updateUserPortfolio } from "@/utils/updateUserPortfolio";
import { usePortfolio } from "@/providers/PortfolioProvider";
import { useRouter } from "next/navigation";
import { AllocationType } from "@/constants";

export default function Creating() {
  const [error, setError] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const { user } = usePrivy();
  const { client } = useSmartWallets();
  const { state: portfolio } = usePortfolio();
  const router = useRouter();

  const USDT_ADDRESS = "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb";
  const HYPEREVM_RPC_URL = process.env.NEXT_PUBLIC_HYPEREVM_RPC_URL;
  const ERC20_ABI = [
    "function balanceOf(address) view returns (uint256)",
    "function decimals() view returns (uint8)",
  ];

  useEffect(() => {
    if (
      user?.wallet?.address &&
      user?.smartWallet?.address &&
      client &&
      usdtBalance !== null
    ) {
      const executePortfolioCreation = async () => {
        try {
          const userAddress = user.wallet?.address;
          if (!userAddress) throw new Error("EOA wallet address not found.");

          // Create a deep copy to avoid mutating the original state directly
          const portfolioToUpdate = JSON.parse(JSON.stringify(portfolio));

          // Find the lending category allocation
          const lendingAllocation = portfolioToUpdate.find(
            (item: any) => item.category === AllocationType.LENDING
          );

          // If lending assets exist, resolve their aToken addresses
          if (lendingAllocation && lendingAllocation.allocations.length > 0) {
            console.log("Resolving aToken addresses for lending assets...");

            const aTokenPromises = lendingAllocation.allocations.map(
              (underlyingAddress: string) => getATokenAddress(underlyingAddress)
            );

            // Wait for all API calls to complete
            const aTokenAddresses = await Promise.all(aTokenPromises);

            console.log("Resolved aToken addresses:", aTokenAddresses);

            // Update the lending item with the new aToken addresses
            lendingAllocation.allocations = aTokenAddresses;
          }

          // Now, save the updated portfolio to the database
          const saved = await updateUserPortfolio(
            userAddress,
            portfolioToUpdate
          );
          if (!saved) {
            throw new Error(
              "Failed to save the updated portfolio to the database."
            );
          }

          console.log(
            "Portfolio saved successfully. Now creating positions..."
          );
          await createPositions();
        } catch (err) {
          console.error("Error during portfolio creation process:", err);
          setError(
            err instanceof Error ? err.message : "An unknown error occurred."
          );
        }
      };

      executePortfolioCreation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.smartWallet?.address, user?.wallet?.address, client, usdtBalance]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!user?.smartWallet?.address) {
        setUsdtBalance(null);
        return;
      }
      try {
        const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC_URL);
        const usdtContract = new ethers.Contract(
          USDT_ADDRESS,
          ERC20_ABI,
          provider
        );
        const balance = await usdtContract.balanceOf(user.smartWallet.address);
        const decimals = await usdtContract.decimals();
        const formattedBalance = ethers.formatUnits(balance, decimals);

        console.log("USER SMART WALLET:", user.smartWallet.address);
        console.log("USDT BALANCE:", formattedBalance);
        setUsdtBalance(formattedBalance);
      } catch (error) {
        console.error("Error fetching USDT balance:", error);
        setError("Failed to fetch USDT balance.");
        setUsdtBalance(null);
      }
    };
    fetchBalance();
  }, [user?.smartWallet?.address]);

  //   const createPositions = async () => {
  //     if (!user?.smartWallet?.address || !client) {
  //       throw new Error("Smart wallet is not available.");
  //     }
  //     if (!usdtBalance || parseFloat(usdtBalance) <= 0) {
  //       throw new Error("Insufficient USDT balance to create positions.");
  //     }

  //     // const testBalance = "5";

  //     const RATE_LIMIT_DELAY_MS = 400; // 1000ms / 3 RPS = 333ms. 400ms as buffer.

  //     const userAddress = user.smartWallet.address;
  //     const embeddedWallet = user?.linkedAccounts.find(
  //       (account) =>
  //         account.type === "wallet" && account.walletClientType === "privy"
  //     ) as WalletWithMetadata;

  //     const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC_URL);
  //     const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

  //     try {
  //       // Collect all transactions to batch send later
  //       const batchedTransactions: Array<{
  //         to: string;
  //         data: string;
  //         value: bigint;
  //       }> = [];

  //       for (const categoryAllocation of portfolio) {
  //         console.log("Processing category:", categoryAllocation.category);
  //         if (
  //           categoryAllocation.percentage <= 0 ||
  //           categoryAllocation.allocations.length === 0
  //         ) {
  //           console.log(
  //             `Skipping category ${categoryAllocation.category} (0% or no assets).`
  //           );
  //           continue;
  //         }

  //         const categoryTotalAmount =
  //           (categoryAllocation.percentage / 100) * parseFloat(usdtBalance);
  //         const amountPerAsset =
  //           categoryTotalAmount / categoryAllocation.allocations.length;

  //         if (amountPerAsset <= 0) continue;

  //         for (const outputTokenAddress of categoryAllocation.allocations) {
  //           console.log("Creating position for asset:", outputTokenAddress);
  //           const decimals = await usdtContract.decimals();
  //           const amountInWei = ethers.parseUnits(
  //             amountPerAsset.toString(),
  //             decimals
  //           );

  //           const apiPayload = {
  //             inputToken: USDT_ADDRESS,
  //             requestedOutputToken: outputTokenAddress,
  //             userPublicAddress: userAddress,
  //             embeddedWalletAddress: embeddedWallet?.address,
  //             amount: amountPerAsset,
  //             allocationType: categoryAllocation.category,
  //           };

  //           await new Promise((resolve) =>
  //             setTimeout(resolve, RATE_LIMIT_DELAY_MS)
  //           );

  //           console.log("Sending API payload:", apiPayload);
  //           const response = await fetch("/api/zap", {
  //             method: "POST",
  //             headers: { "Content-Type": "application/json" },
  //             body: JSON.stringify(apiPayload),
  //           });

  //           const result = await response.json();
  //           if (!response.ok || !result.success) {
  //             throw new Error(
  //               `API call failed for ${outputTokenAddress}: ${
  //                 result.error || "Unknown error"
  //               }`
  //             );
  //           }

  //           console.log("RESULT", result);

  //           //   const transactions = result.transactions;
  //           //   console.log(`Batching transactions for ${outputTokenAddress}...`);

  //           //   const txHash = await client.sendTransaction({
  //           //     calls: transactions.map(
  //           //       (tx: { to: string; data: string; value: string }) => ({
  //           //         to: tx.to,
  //           //         data: tx.data,
  //           //         value: BigInt(tx.value || "0"),
  //           //       })
  //           //     ),
  //           //   });

  //           //   console.log(
  //           //     `Transaction successful for ${outputTokenAddress}! Tx Hash:`,
  //           //     txHash
  //           //   );

  //           // Collect transactions from API response
  //           if (Array.isArray(result.transactions)) {
  //             console.log("INSIDE RESULTS TRANSACTIONS");
  //             batchedTransactions.push(
  //               ...result.transactions.map(
  //                 (tx: { to: string; data: string; value?: string }) => ({
  //                   to: tx.to,
  //                   data: tx.data,
  //                   value: BigInt(tx.value || "0"),
  //                 })
  //               )
  //             );

  //             console.log("RESULT TRANSACTIONS:", result.transactions);
  //           }
  //         }
  //       }

  //       // Send all transactions in a single batch
  //       if (batchedTransactions.length > 0) {
  //         console.log(
  //           `Batching and sending ${batchedTransactions.length} transactions...`
  //         );
  //         // If type error persists, cast to expected type
  //         const txHash = await client.sendTransaction({
  //           calls: batchedTransactions as any,
  //         });
  //         console.log(`Batch transaction successful! Tx Hash:`, txHash);
  //       } else {
  //         console.log("No transactions to send.");
  //       }

  //       console.log("All positions created successfully!");
  //       setTimeout(() => router.push("/dashboard"), 2000);
  //     } catch (error) {
  //       console.error("Error creating positions:", error);
  //       setError(
  //         error instanceof Error
  //           ? error.message
  //           : "An error occurred during position creation."
  //       );
  //     }
  //   };

  const createPositions = async () => {
    if (!user?.smartWallet?.address || !client) {
      throw new Error("Smart wallet is not available.");
    }
    if (!usdtBalance || parseFloat(usdtBalance) <= 0) {
      throw new Error("Insufficient USDT balance to create positions.");
    }

    const RATE_LIMIT_DELAY_MS = 400;

    const userAddress = user.smartWallet.address;
    const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC_URL);
    const usdtContract = new ethers.Contract(USDT_ADDRESS, ERC20_ABI, provider);

    try {
      for (const categoryAllocation of portfolio) {
        if (
          categoryAllocation.percentage <= 0 ||
          categoryAllocation.allocations.length === 0
        ) {
          console.log(
            `Skipping category ${categoryAllocation.category} (0% or no assets).`
          );
          continue;
        }

        const categoryTotalAmount =
          (categoryAllocation.percentage / 100) * parseFloat(usdtBalance);
        const amountPerAsset =
          categoryTotalAmount / categoryAllocation.allocations.length;

        if (amountPerAsset <= 0) continue;

        for (const outputTokenAddress of categoryAllocation.allocations) {
          const decimals = await usdtContract.decimals();
          const amountInWei = ethers.parseUnits(
            amountPerAsset.toString(),
            decimals
          );

          const smartWalletBalance = await usdtContract.balanceOf(userAddress);
          if (smartWalletBalance < amountInWei) {
            throw new Error(
              `Insufficient USDT for next transaction. Please top up your smart wallet.`
            );
          }
          const embeddedWallet = user?.linkedAccounts.find(
            (account) =>
              account.type === "wallet" && account.walletClientType === "privy"
          ) as WalletWithMetadata;

          const apiPayload = {
            inputToken: USDT_ADDRESS,
            requestedOutputToken: outputTokenAddress,
            userPublicAddress: userAddress,
            embeddedWalletAddress: embeddedWallet?.address,
            amount: amountPerAsset,
            allocationType: categoryAllocation.category,
          };

          await new Promise((resolve) =>
            setTimeout(resolve, RATE_LIMIT_DELAY_MS)
          );

          console.log("Sending API payload:", apiPayload);
          const response = await fetch("/api/zap", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(apiPayload),
          });

          const result = await response.json();
          if (!response.ok || !result.success) {
            throw new Error(
              `API call failed for ${outputTokenAddress}: ${
                result.error || "Unknown error"
              }`
            );
          }

          const transactionsForThisAsset = result.transactions.map(
            (tx: { to: string; data: string; value?: string }) => ({
              to: tx.to,
              data: tx.data,
              value: BigInt(tx.value || "0"),
            })
          );

          if (transactionsForThisAsset.length > 0) {
            console.log(`Sending batch for ${outputTokenAddress}...`);
            const txHash = await client.sendTransaction({
              calls: transactionsForThisAsset,
            });
            console.log(
              `Tx successful for ${outputTokenAddress}! Hash:`,
              txHash
            );
          }
        }
      }

      console.log("All positions created successfully!");
      setTimeout(() => router.push("/dashboard"), 2000);
    } catch (error) {
      console.error("Error creating positions:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during position creation."
      );
    }
  };
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center text-center p-8">
        {error ? (
          <Typography variant="h6" color="error">
            An error occurred: {error}
          </Typography>
        ) : (
          <Typography variant="h6" className="animate-pulse">
            Hold still. I’m setting up your portfolio...
          </Typography>
        )}
      </main>
    </div>
  );
}
