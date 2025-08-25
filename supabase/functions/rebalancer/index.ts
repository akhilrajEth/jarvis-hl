import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { http, createPublicClient, parseUnits, encodeFunctionData } from "https://esm.sh/viem@2.21.1";
import canonicalize from "https://esm.sh/canonicalize@2.0.0";

// Constants for GlueX
const GLUEX_QUOTE_ENDPOINT = "https://router.gluex.xyz/v1/quote";
const GLUEX_API_KEY = Deno.env.get("GLUEX_API_KEY") || "";
const GLUEX_UNIQUE_PID = Deno.env.get("GLUEX_UNIQUE_PID") || "";
const CHAIN_ID = "999";
const ERC20_ABI = [
  {
    name: "decimals",
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "approve",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
];

// Constants for network and rebalancing
const NETWORK = "hyperevm";
const REBALANCE_THRESHOLD = 0.1;
const GECKOTERMINAL_BASE_URL = Deno.env.get("GECKOTERMINAL_BASE_URL") || "https://api.geckoterminal.com/api/v2";
const INTERMEDIARY_TOKEN = "0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb"; // USDT on HyperEVM
const PRIVY_API_URL = "https://api.privy.io/v1";

// Supabase configuration
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Privy configuration
const privyAppId = Deno.env.get("PRIVY_APP_ID") || "";
const privyAppSecret = Deno.env.get("PRIVY_APP_SECRET") || "";
const privyPrivateKey = Deno.env.get("PRIVY_AUTHORIZATION_PRIVATE_KEY") || "";

// Viem client setup
const publicClient = createPublicClient({
  chain: {
    id: Number(CHAIN_ID),
    name: "HyperEVM",
    rpcUrls: { default: { http: ["https://rpc.hyperliquid.xyz/evm"] } },
  },
  transport: http(),
});

// Interfaces
interface TransactionResult {
  hash: string;
  tokenAddress: string;
  symbol: string;
  type: "approve" | "swap";
}

interface PriceData {
  price_usd: string;
  symbol: string;
  address: string;
}

interface AllocationItem {
  category: string;
  percentage: number;
  allocations: string[];
}

interface UserForRebalance {
  userPublicAddress: string;
  portfolio: AllocationItem[];
  initial_asset_prices: { token_address: string; initial_price: number }[];
  total_deposit_amount?: { amount: number };
  embedded_account?: {id: string};
}

// Function to generate Privy authorization signature
function getAuthorizationSignature({ url, body }: { url: string; body: object }): string {
  const payload = {
    version: 1,
    method: "POST",
    url,
    body,
    headers: { "privy-app-id": privyAppId },
  };

  const serializedPayload = canonicalize(payload) as string;
  const serializedPayloadBuffer = Buffer.from(serializedPayload);
  const privateKeyAsString = privyPrivateKey.replace("wallet-auth:", "");
  const privateKeyAsPem = `-----BEGIN PRIVATE KEY-----\n${privateKeyAsString}\n-----END PRIVATE KEY-----`;
  const privateKey = crypto.createPrivateKey({ key: privateKeyAsPem, format: "pem" });
  const signatureBuffer = crypto.sign("sha256", serializedPayloadBuffer, privateKey);
  return signatureBuffer.toString("base64");
}

// Function to execute transaction via Privy RPC
async function executePrivyTransaction(
  walletId: string,
  to: string,
  data: string,
  value: bigint
): Promise<string | null> {
  const url = `${PRIVY_API_URL}/wallets/${walletId}/rpc`;
  const body = {
    method: "eth_sendTransaction",
    params: [{ to, data, value: `0x${value.toString(16)}`, chainId: CHAIN_ID }],
  };

  const signature = getAuthorizationSignature({ url, body });
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "privy-app-id": privyAppId,
        Authorization: `Bearer ${signature}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Privy RPC error:", errorData);
      return null;
    }

    const result = await response.json();
    return result.result; // Transaction hash
  } catch (error) {
    console.error("Error executing Privy transaction:", error);
    return null;
  }
}

// Function to fetch token decimals for multiple tokens
async function getTokenDecimalsBatch(tokenAddresses: string[]): Promise<Map<string, number>> {
  const decimalsMap = new Map<string, number>();
  const uniqueAddresses = [...new Set([...tokenAddresses, INTERMEDIARY_TOKEN])];

  const decimalsPromises = uniqueAddresses.map(async (tokenAddress) => {
    try {
      const decimals = await publicClient.readContract({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "decimals",
      });
      decimalsMap.set(tokenAddress, Number(decimals));
    } catch (error) {
      console.error(`Error fetching decimals for ${tokenAddress}:`, error);
      decimalsMap.set(tokenAddress, 18);
    }
  });

  await Promise.all(decimalsPromises);
  return decimalsMap;
}

// Function to check token balances
async function checkBalance(
  tokenAddress: string,
  userAddress: string,
  requiredAmount: bigint
): Promise<boolean> {
  try {
    const balance = await publicClient.readContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [userAddress as `0x${string}`],
    });
    return BigInt(balance) >= requiredAmount;
  } catch (error) {
    console.error(`Error checking balance for ${tokenAddress}:`, error);
    return false;
  }
}

// Function to fetch current token price from GeckoTerminal
async function getCurrentTokenPrice(tokenAddress: string): Promise<PriceData | null> {
  if (!tokenAddress) {
    console.error("Error: Token address is required.");
    return null;
  }

  const url = `${GECKOTERMINAL_BASE_URL}/networks/${NETWORK}/tokens/${tokenAddress}`;
  try {
    console.log(`Fetching data for ${tokenAddress} from GeckoTerminal...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const attributes = data.data.attributes;
    const priceUsd = attributes.price_usd;
    const symbol = attributes.symbol;
    const address = attributes.address;

    if (!priceUsd || !symbol || !address) {
      console.error(`Error: Incomplete data received for token ${tokenAddress}.`);
      return null;
    }

    return { price_usd: priceUsd, symbol, address };
  } catch (error) {
    console.error(`Error fetching data for ${tokenAddress}:`, error);
    return null;
  }
}

// Function to fetch all users from Supabase
async function getAllUsers(): Promise<UserForRebalance[]> {
  console.log("Fetching all users from the database...");
  const { data, error } = await supabase
    .from("users")
    .select("userPublicAddress, portfolio, initial_asset_prices, total_deposit_amount, embedded_account")
    .not("portfolio", "is", null);

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  console.log(`Found ${data.length} users with portfolios.`);
  return data as UserForRebalance[];
}

// Function to fetch GlueX quote
async function getGlueXQuote(
  userPublicAddress: string,
  inputToken: string,
  outputToken: string,
  inputAmount: string,
  slippage: number = 0.01
): Promise<{ router: string; calldata: string } | null> {
  try {
    const quoteResponse = await fetch(GLUEX_QUOTE_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": GLUEX_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainID: CHAIN_ID,
        userAddress: userPublicAddress,
        outputReceiver: userPublicAddress,
        uniquePID: GLUEX_UNIQUE_PID,
        inputToken,
        outputToken,
        inputAmount,
        isPermit2: false,
        slippage,
      }),
    });

    if (!quoteResponse.ok) {
      const errorData = await quoteResponse.text();
      console.error("Failed to fetch GlueX quote:", errorData);
      return null;
    }

    const quoteData = await quoteResponse.json();
    console.log("Quote data received:", quoteData);
    return quoteData.result;
  } catch (error) {
    console.error("Error fetching GlueX quote:", error);
    return null;
  }
}

// Function to process rebalancing for a single user
async function processUserRebalance(
  user: UserForRebalance,
  currentPriceMap: Map<string, PriceData>
): Promise<{ userAddress: string; rebalanceNeeded: boolean; details: any[]; transactionResults: TransactionResult[] }> {
  console.log(`\n--- Analyzing user: ${user.userPublicAddress} ---`);

  // Validate user data
  if (!user.privy_wallet_id) {
    console.log("User has no privy_wallet_id. Skipping.");
    return { userAddress: user.userPublicAddress, rebalanceNeeded: false, details: [], transactionResults: [] };
  }

  const spotAllocation = user.portfolio.find((p) => p.category === "spot");
  if (!spotAllocation || spotAllocation.allocations.length === 0) {
    console.log("User has no spot allocation. Skipping.");
    return { userAddress: user.userPublicAddress, rebalanceNeeded: false, details: [], transactionResults: [] };
  }

  const totalDeposit = user.total_deposit_amount?.amount;
  if (!totalDeposit) {
    console.log("User has no total deposit amount. Skipping.");
    return { userAddress: user.userPublicAddress, rebalanceNeeded: false, details: [], transactionResults: [] };
  }

  // Calculate initial portfolio values
  const spotPercentage = spotAllocation.percentage / 100;
  const initialSpotValue = totalDeposit * spotPercentage;
  const numSpotAssets = spotAllocation.allocations.length;
  const initialValuePerAsset = initialSpotValue / numSpotAssets;

  // Map initial prices
  const initialPricesMap = new Map(user.initial_asset_prices.map((p) => [p.token_address, p.initial_price]));

  // Fetch decimals for all tokens
  const decimalsMap = await getTokenDecimalsBatch(spotAllocation.allocations);

  // Calculate current portfolio values
  let totalCurrentSpotValue = 0;
  const assetDetails = spotAllocation.allocations
    .map((tokenAddress) => {
      const initialPrice = initialPricesMap.get(tokenAddress);
      const currentPriceData = currentPriceMap.get(tokenAddress);
      const decimals = decimalsMap.get(tokenAddress) || 18;

      if (!initialPrice || !currentPriceData) {
        console.warn(`Missing price data for ${tokenAddress}. Skipping asset.`);
        return null;
      }

      const initialQuantity = initialValuePerAsset / initialPrice;
      const currentValue = initialQuantity * parseFloat(currentPriceData.price_usd);
      totalCurrentSpotValue += currentValue;

      return {
        tokenAddress,
        symbol: currentPriceData.symbol,
        currentValue,
        initialQuantity,
        currentPrice: parseFloat(currentPriceData.price_usd),
        decimals,
      };
    })
    .filter(Boolean);

  if (assetDetails.length === 0) {
    console.log("No assets processed due to missing data.");
    return { userAddress: user.userPublicAddress, rebalanceNeeded: false, details: [], transactionResults: [] };
  }

  // Calculate rebalance thresholds
  const targetValuePerAsset = totalCurrentSpotValue / assetDetails.length;
  const rebalanceHighThreshold = targetValuePerAsset * (1 + REBALANCE_THRESHOLD);
  const rebalanceLowThreshold = targetValuePerAsset * (1 - REBALANCE_THRESHOLD);

  console.log(`Initial Spot Value: $${initialSpotValue.toFixed(2)}`);
  console.log(`Total Current Spot Value: $${totalCurrentSpotValue.toFixed(2)}`);
  console.log(
    `Target Value Per Asset: $${targetValuePerAsset.toFixed(2)} (High: $${rebalanceHighThreshold.toFixed(2)}, Low: $${rebalanceLowThreshold.toFixed(2)})`
  );

  let rebalanceNeeded = false;
  const transactionResults: TransactionResult[] = [];
  const details = [];

  // Identify assets needing rebalance
  const overAllocated = assetDetails.filter((asset) => asset.currentValue > rebalanceHighThreshold);
  const underAllocated = assetDetails.filter((asset) => asset.currentValue < rebalanceLowThreshold);

  if (overAllocated.length > 0 && underAllocated.length > 0) {
    rebalanceNeeded = true;
    console.log("Rebalance needed. Executing swaps...");

    // Process sell transactions
    for (const overAsset of overAllocated) {
      const excessValue = overAsset.currentValue - targetValuePerAsset;
      const sellAmount = parseUnits((excessValue / overAsset.currentPrice).toString(), overAsset.decimals);
      
      // Check balance
      const hasBalance = await checkBalance(overAsset.tokenAddress, user.userPublicAddress, sellAmount);
      if (!hasBalance) {
        console.error(`Insufficient balance for ${overAsset.symbol}`);
        continue;
      }

      const sellQuote = await getGlueXQuote(
        user.userPublicAddress,
        overAsset.tokenAddress,
        INTERMEDIARY_TOKEN,
        sellAmount.toString()
      );

      if (!sellQuote) {
        console.error(`Failed to get sell quote for ${overAsset.symbol}`);
        continue;
      }

      // Execute approval
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [sellQuote.router as `0x${string}`, sellAmount],
      });

      const approveHash = await executePrivyTransaction(
        user.privy_wallet_id,
        overAsset.tokenAddress,
        approveData,
        BigInt(0)
      );

      if (approveHash) {
        console.log(`Approval transaction for ${overAsset.symbol}: ${approveHash}`);
        transactionResults.push({
          hash: approveHash,
          tokenAddress: overAsset.tokenAddress,
          symbol: overAsset.symbol,
          type: "approve",
        });
      } else {
        console.error(`Failed to execute approval for ${overAsset.symbol}`);
        continue;
      }

      // Execute swap
      const swapHash = await executePrivyTransaction(
        user.privy_wallet_id,
        sellQuote.router,
        sellQuote.calldata,
        BigInt(0)
      );

      if (swapHash) {
        console.log(`Swap transaction for ${overAsset.symbol}: ${swapHash}`);
        transactionResults.push({
          hash: swapHash,
          tokenAddress: overAsset.tokenAddress,
          symbol: overAsset.symbol,
          type: "swap",
        });
      } else {
        console.error(`Failed to execute swap for ${overAsset.symbol}`);
        continue;
      }
    }

    // Process buy transactions
    for (const underAsset of underAllocated) {
      const deficitValue = targetValuePerAsset - underAsset.currentValue;
      const buyAmount = parseUnits((deficitValue / underAsset.currentPrice).toString(), underAsset.decimals);

      // Check USDT balance
      const hasBalance = await checkBalance(INTERMEDIARY_TOKEN, user.userPublicAddress, buyAmount);
      if (!hasBalance) {
        console.error(`Insufficient USDT balance for ${underAsset.symbol}`);
        continue;
      }

      const buyQuote = await getGlueXQuote(
        user.userPublicAddress,
        INTERMEDIARY_TOKEN,
        underAsset.tokenAddress,
        buyAmount.toString()
      );

      if (!buyQuote) {
        console.error(`Failed to get buy quote for ${underAsset.symbol}`);
        continue;
      }

      // Execute approval for USDT
      const approveData = encodeFunctionData({
        abi: ERC20_ABI,
        functionName: "approve",
        args: [buyQuote.router as `0x${string}`, buyAmount],
      });

      const approveHash = await executePrivyTransaction(
        user.privy_wallet_id,
        INTERMEDIARY_TOKEN,
        approveData,
        BigInt(0)
      );

      if (approveHash) {
        console.log(`Approval transaction for ${underAsset.symbol} (USDT): ${approveHash}`);
        transactionResults.push({
          hash: approveHash,
          tokenAddress: INTERMEDIARY_TOKEN,
          symbol: "USDT",
          type: "approve",
        });
      } else {
        console.error(`Failed to execute approval for USDT`);
        continue;
      }

      // Execute swap
      const swapHash = await executePrivyTransaction(
        user.privy_wallet_id,
        buyQuote.router,
        buyQuote.calldata,
        BigInt(0)
      );

      if (swapHash) {
        console.log(`Swap transaction for ${underAsset.symbol}: ${swapHash}`);
        transactionResults.push({
          hash: swapHash,
          tokenAddress: underAsset.tokenAddress,
          symbol: underAsset.symbol,
          type: "swap",
        });
      } else {
        console.error(`Failed to execute swap for ${underAsset.symbol}`);
        continue;
      }
    }
  }

  // Generate reporting details
  for (const asset of assetDetails) {
    const status =
      asset.currentValue > rebalanceHighThreshold
        ? "Rebalance Needed (Over-allocated)"
        : asset.currentValue < rebalanceLowThreshold
        ? "Rebalance Needed (Under-allocated)"
        : "Balanced";

    if (status.includes("Rebalance Needed")) {
      rebalanceNeeded = true;
    }

    details.push({
      tokenAddress: asset.tokenAddress,
      symbol: asset.symbol,
      currentValue: asset.currentValue.toFixed(2),
      status,
    });
  }

  if (!rebalanceNeeded) {
    console.log("Portfolio is balanced.");
  }

  return { userAddress: user.userPublicAddress, rebalanceNeeded, details, transactionResults };
}

// HTTP handler for Supabase Edge Function
serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("Starting rebalancing process...");

    // Fetch all users
    const users = await getAllUsers();
    if (users.length === 0) {
      console.log("No users to process.");
      return new Response(JSON.stringify({ message: "No users to process", usersProcessed: 0 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Collect unique token addresses
    const allTokenAddresses = new Set<string>();
    users.forEach((user) => {
      const spotAllocation = user.portfolio.find((p) => p.category === "spot");
      spotAllocation?.allocations.forEach((address) => allTokenAddresses.add(address));
    });
    console.log(`Fetching prices for ${allTokenAddresses.size} unique tokens...`);

    // Fetch token prices
    const priceResults = await Promise.all(Array.from(allTokenAddresses).map(getCurrentTokenPrice));
    const priceMap = new Map<string, PriceData>();
    priceResults.forEach((result) => {
      if (result) priceMap.set(result.address, result);
    });
    console.log(`Successfully fetched prices for ${priceMap.size} tokens.`);

    // Process rebalancing for each user
    const results = await Promise.all(users.map((user) => processUserRebalance(user, priceMap)));

    // Summarize results
    const summary = {
      usersProcessed: users.length,
      usersNeedingRebalance: results.filter((r) => r.rebalanceNeeded).length,
      details: results.map((r) => ({
        userAddress: r.userAddress,
        rebalanceNeeded: r.rebalanceNeeded,
        details: r.details,
        transactionResults: r.transactionResults,
      })),
    };

    return new Response(JSON.stringify({ success: true, ...summary }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in rebalance function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});