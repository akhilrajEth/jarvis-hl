import { ethers } from "ethers";
import { NextRequest, NextResponse } from "next/server";
import {
  AllocationType,
  ERC20_ABI,
  GLUEX_QUOTE_ENDPOINT,
  HYPERLEND_MARKETS_ENDPOINT,
} from "./constants";
import { HyperLendReserve, TransactionCall } from "./types";

/**
 * Fetches the aToken address for a given underlying asset from the HyperLend API.
 * This is the equivalent of the output token for a deposit.
 * @param {string} underlyingAssetAddress - The address of the token to deposit (e.g., USDC).
 * @returns {Promise<string>} The corresponding aToken address.
 * @throws {Error} If the reserve or aToken address cannot be found.
 */
async function getATokenAddress(
  underlyingAssetAddress: string
): Promise<string> {
  try {
    const response = await fetch(HYPERLEND_MARKETS_ENDPOINT);
    if (!response.ok) {
      throw new Error(
        `HyperLend API request failed with status: ${response.status}`
      );
    }

    const data = await response.json();
    const reserves: HyperLendReserve[] = data.reserves;

    const reserve = reserves.find(
      (r) =>
        r.underlyingAsset.toLowerCase() === underlyingAssetAddress.toLowerCase()
    );

    if (!reserve || !reserve.aTokenAddress) {
      throw new Error(
        `No corresponding aToken found for asset ${underlyingAssetAddress}.`
      );
    }

    return reserve.aTokenAddress;
  } catch (error) {
    console.error("Error fetching aToken address:", error);
    throw new Error("Failed to resolve output token from HyperLend API.");
  }
}

/**
 * Handles POST requests to generate transaction calldata for a token deposit (swap).
 * @param {NextRequest} request - The incoming request object.
 * @body {string} inputToken - The address of the token to be deposited.
 * @body {string} requestedOutputToken - The address of the token to receive (optional, since we get output token internally for lending).
 * @body {string} userPublicAddress - The user's public address.
 * @body {number} amount - The amount to deposit (e.g., 20.5 for 20.5 tokens).
 * @body {string} allocationType - The type of action ("spot", "vault", "lp", "lending").
 * @returns {NextResponse} A JSON response with the transaction calldata or an error.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      inputToken,
      requestedOutputToken,
      userPublicAddress,
      embeddedWalletAddress,
      amount,
      allocationType,
    } = body;

    if (!inputToken || !userPublicAddress || !amount || !allocationType) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required parameters: inputToken, userPublicAddress, amount, or allocationType.",
        },
        { status: 400 }
      );
    }

    if (!ethers.isAddress(inputToken)) {
      return NextResponse.json(
        { success: false, error: "Invalid inputToken address provided." },
        { status: 400 }
      );
    }

    if (
      allocationType !== AllocationType.LENDING &&
      !ethers.isAddress(requestedOutputToken)
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid requestedOutputToken address provided.",
        },
        { status: 400 }
      );
    }

    const HYPEREVM_RPC_URL = process.env.HYPEREVM_RPC_URL;

    if (!HYPEREVM_RPC_URL) {
      console.error("Server configuration error: Missing HYPEREVM_RPC_URL.");
      return NextResponse.json(
        { success: false, error: "Server configuration error." },
        { status: 500 }
      );
    }

    const provider = new ethers.JsonRpcProvider(HYPEREVM_RPC_URL);

    const tokenContract = new ethers.Contract(inputToken, ERC20_ABI, provider);
    const decimals: bigint = await tokenContract.decimals();

    console.log("DECIMALS:", decimals);

    const inputAmount = ethers
      .parseUnits(amount.toString(), decimals)
      .toString();

    let outputToken: string;

    if (allocationType === AllocationType.LENDING) {
      // For lending, we need to get the aToken address for the input token
      // Note: We need to get output token address from HyperLend API since it's not displayed in the UI directly.
      console.log("Fetching aToken address for input token:", inputToken);
      outputToken = await getATokenAddress(inputToken);
    } else {
      // For other allocation types, use the requested output token from the user
      console.log(
        "Using requested output token for allocation type:",
        allocationType
      );
      outputToken = requestedOutputToken;
    }

    console.log("Output token address:", outputToken);

    const GLUEX_API_KEY = process.env.GLUEX_API_KEY;
    const GLUEX_UNIQUE_PID = process.env.GLUEX_UNIQUE_PID;
    const CHAIN_ID = "hyperevm";

    if (!GLUEX_API_KEY || !GLUEX_UNIQUE_PID) {
      console.error(
        "Server configuration error: Missing GLUEX_API_KEY or GLUEX_UNIQUE_PID."
      );
      return NextResponse.json(
        { success: false, error: "Server configuration error." },
        { status: 500 }
      );
    }
    let outputReceiver = userPublicAddress;
    if(allocationType === AllocationType.SPOT) {
      outputReceiver = embeddedWalletAddress || userPublicAddress;
    }
    // Fetch quote from GlueX
    const quoteResponse = await fetch(GLUEX_QUOTE_ENDPOINT, {
      method: "POST",
      headers: {
        "x-api-key": GLUEX_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chainID: CHAIN_ID,
        userAddress: userPublicAddress,
        outputReceiver: outputReceiver,
        uniquePID: GLUEX_UNIQUE_PID,
        inputToken,
        outputToken,
        inputAmount,
        isPermit2: false,
      }),
    });

    if (!quoteResponse.ok) {
      const errorData = await quoteResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: "Failed to fetch quote from GlueX.",
          details: errorData,
        },
        { status: quoteResponse.status }
      );
    }

    const quoteData = await quoteResponse.json();
    console.log("Quote data received:", quoteData);
    const { router: routerAddress, calldata: swapCallData } = quoteData.result;

    // Generate the approval calldata
    // We need to approve the gluex router to spend the input token
    const approveInterface = new ethers.Interface(ERC20_ABI);
    const approvalCallData = approveInterface.encodeFunctionData("approve", [
      routerAddress,
      inputAmount,
    ]);

    // Format the response for the bundler and return it
    const transactions: TransactionCall[] = [
      { to: inputToken, data: approvalCallData, value: "0" },
      { to: routerAddress, data: swapCallData, value: "0" },
    ];

    return NextResponse.json({ success: true, transactions });
  } catch (error) {
    console.error("Error in /api/quote:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred.";
    if (errorMessage.includes("call revert exception")) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Failed to fetch decimals. The provided address may not be a valid ERC20 token.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
