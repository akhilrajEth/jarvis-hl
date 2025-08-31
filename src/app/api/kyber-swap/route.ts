import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { URLSearchParams } from "url";
import { Contract, Interface, isAddress, JsonRpcProvider } from "ethers";
import {
  BuildAggregatorTxParams,
  TransactionCall,
  AggregatorApiParams,
} from "./types";

import {
  AGGREGATOR_API_BASE_URL,
  CHAIN_ID,
  ERC_20_ABI,
  NATIVE_TOKEN_ADDRESS,
} from "./constants";

const provider = process.env.BASE_RPC_URL
  ? new JsonRpcProvider(process.env.BASE_RPC_URL)
  : null;

/**
 * Builds the API URL for getting the aggregator swap route.
 * @param {AggregatorApiParams} params - The parameters for the API request.
 * @returns {string} The fully constructed API URL.
 */
const buildGetRouteApiUrl = (params: AggregatorApiParams): string => {
  const searchParams = new URLSearchParams({
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    gasInclude: "true",
  });

  return `${AGGREGATOR_API_BASE_URL}/${CHAIN_ID}/api/v1/routes?${searchParams.toString()}`;
};

/**
 * Fetches the best swap route from the Aggregator API.
 * @param {AggregatorApiParams} params - The parameters for the aggregator route.
 * @returns {Promise<any>} The data from the API response.
 */
const getAggregatorRouteData = async (
  params: AggregatorApiParams
): Promise<any> => {
  const apiUrl = buildGetRouteApiUrl(params);
  console.log(`Constructed Get Route URL: ${apiUrl}`);
  const response = await axios.get(apiUrl, {
    headers: { "x-client-id": "jarvis-hl-api" },
  });
  console.log("Successfully received aggregator route.");
  return response.data;
};

/**
 * Checks token allowance and generates an approval transaction if needed.
 * @param {string} tokenAddress - The address of the ERC20 token.
 * @param {string} ownerAddress - The user's wallet address.
 * @param {string} spenderAddress - The address of the contract to approve (the router).
 * @param {string} amountToApprove - The amount of the token to approve.
 * @returns {Promise<TransactionCall | null>} A transaction call object or null if no approval is needed.
 */
const generateApprovalTx = async (
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  amountToApprove: string
): Promise<TransactionCall | null> => {
  if (!provider) throw new Error("Provider not initialized.");
  console.log(`\n--- Checking Approval for ${tokenAddress} ---`);
  const tokenContract = new Contract(tokenAddress, ERC_20_ABI, provider);
  const currentAllowance = await tokenContract.allowance(
    ownerAddress,
    spenderAddress
  );

  if (currentAllowance < BigInt(amountToApprove)) {
    console.log(
      "Allowance is insufficient. Generating approval transaction..."
    );
    const erc20Interface = new Interface(ERC_20_ABI);
    const approvalCallData = erc20Interface.encodeFunctionData("approve", [
      spenderAddress,
      amountToApprove,
    ]);
    return { to: tokenAddress, data: approvalCallData, value: "0" };
  } else {
    console.log("Sufficient allowance already granted.");
    return null;
  }
};

/**
 * Fetches the final transaction data from the KyberSwap Aggregator build endpoint.
 * @param {BuildAggregatorTxParams} params - The parameters for building the transaction.
 * @returns {Promise<any>} The final transaction data from the API.
 */
const buildAggregatorTransaction = async (
  params: BuildAggregatorTxParams
): Promise<any> => {
  const apiUrl = `${AGGREGATOR_API_BASE_URL}/${CHAIN_ID}/api/v1/route/build`;
  console.log(`\n--- Building Final Transaction from URL: ${apiUrl} ---`);
  const response = await axios.post(apiUrl, params, {
    headers: { "x-client-id": "jarvis-hl-api" },
  });
  console.log("Successfully received transaction data.");
  return response.data;
};

/**
 * Handles POST requests to generate transaction calldata for a KyberSwap Aggregator swap.
 * @param {NextRequest} request - The incoming request object from Next.js.
 * @returns {NextResponse} A JSON response with the transaction calldata or an error.
 */
export async function POST(request: NextRequest) {
  try {
    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error: RPC URL not set.",
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const {
      userWalletAddress,
      tokenIn,
      tokenOut,
      amountIn,
      slippageTolerance,
    } = body;

    if (
      !userWalletAddress ||
      !tokenIn ||
      !tokenOut ||
      !amountIn ||
      slippageTolerance === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters." },
        { status: 400 }
      );
    }
    if (
      !isAddress(userWalletAddress) ||
      !isAddress(tokenIn) ||
      !isAddress(tokenOut)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid address provided in request." },
        { status: 400 }
      );
    }

    const aggregatorParams: AggregatorApiParams = {
      tokenIn,
      tokenOut,
      amountIn,
    };
    const transactions: TransactionCall[] = [];

    // Step 1: Get Route
    const routeResponse = await getAggregatorRouteData(aggregatorParams);
    const routerAddress = routeResponse?.data?.routerAddress;
    const routeSummary = routeResponse?.data?.routeSummary;

    if (!routerAddress || !routeSummary) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get a valid route from KyberSwap API.",
        },
        { status: 500 }
      );
    }

    // Step 2: Check for Approval
    if (tokenIn.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      const approvalTx = await generateApprovalTx(
        tokenIn,
        userWalletAddress,
        routerAddress,
        amountIn
      );
      if (approvalTx) {
        transactions.push(approvalTx);
      }
    }

    // Step 3: Build Final Transaction
    const buildParams: BuildAggregatorTxParams = {
      routeSummary,
      sender: userWalletAddress,
      recipient: userWalletAddress,
      slippageTolerance: slippageTolerance,
      source: "jarvis-hl-api",
    };

    const buildResponse = await buildAggregatorTransaction(buildParams);

    if (buildResponse && buildResponse.data) {
      const swapTransaction: TransactionCall = {
        to: buildResponse.data.routerAddress,
        data: buildResponse.data.data,
        value: buildResponse.data.transactionValue || "0",
      };
      transactions.push(swapTransaction);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to build the final transaction from KyberSwap API.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, transactions });
  } catch (error: any) {
    console.error("Error in /api/kyberswap-aggregator:", error);
    const errorMessage =
      error.response?.data?.message ||
      error.message ||
      "An unknown error occurred.";
    const status = error.response?.status || 500;
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status }
    );
  }
}
