import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import { URLSearchParams } from "url";
import { Contract, Interface, isAddress, JsonRpcProvider } from "ethers";
import { BuildTxParams, TransactionCall, ZapApiParams } from "./types";
import {
  ZAP_API_BASE_URL,
  CHAIN_ID,
  ERC_20_ABI,
  NATIVE_TOKEN_ADDRESS,
} from "./constants";

const provider = process.env.BASE_RPC_URL
  ? new JsonRpcProvider(process.env.BASE_RPC_URL)
  : null;

/**
 * Builds the API URL for getting the KyberSwap zap-in route.
 * @param {ZapApiParams} params - The parameters for the API request.
 * @returns {string} The fully constructed API URL.
 */
const buildGetRouteApiUrl = (params: ZapApiParams): string => {
  const searchParams = new URLSearchParams();
  searchParams.append("dex", params.dex);
  searchParams.append("pool.id", params["pool.id"]);
  searchParams.append("slippage", params.slippage.toString());

  // Conditionally add tick parameters only if they are provided
  if (params["position.tickLower"] !== undefined) {
    searchParams.append(
      "position.tickLower",
      params["position.tickLower"].toString()
    );
  }
  if (params["position.tickUpper"] !== undefined) {
    searchParams.append(
      "position.tickUpper",
      params["position.tickUpper"].toString()
    );
  }

  params.tokensIn.forEach((token) => searchParams.append("tokensIn", token));
  params.amountsIn.forEach((amount) =>
    searchParams.append("amountsIn", amount)
  );

  return `${ZAP_API_BASE_URL}/${CHAIN_ID}/api/v1/in/route?${searchParams.toString()}`;
};

/**
 * Fetches the zap route data from the KyberSwap API.
 * @param {ZapApiParams} params - The parameters for the zap route.
 * @returns {Promise<any>} The data from the API response.
 */
const getZapInData = async (params: ZapApiParams): Promise<any> => {
  const apiUrl = buildGetRouteApiUrl(params);
  console.log(`Constructed Get Route URL: ${apiUrl}`);
  const response = await axios.get(apiUrl);
  console.log("Successfully received zap route.");
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
    return {
      to: tokenAddress,
      data: approvalCallData,
      value: "0",
    };
  } else {
    console.log("Sufficient allowance already granted.");
    return null;
  }
};

/**
 * Fetches the final transaction data from the KyberSwap build endpoint.
 * @param {BuildTxParams} params - The parameters for building the transaction.
 * @returns {Promise<any>} The final transaction data from the API.
 */
const buildZapInTransaction = async (params: BuildTxParams): Promise<any> => {
  const apiUrl = `${ZAP_API_BASE_URL}/${CHAIN_ID}/api/v1/in/route/build`;
  console.log(`\n--- Building Final Transaction from URL: ${apiUrl} ---`);
  const response = await axios.post(apiUrl, params);
  console.log("Successfully received transaction data.");
  return response.data;
};

/**
 * Handles POST requests to generate transaction calldata for a KyberSwap Zap.
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
      dex,
      poolId,
      tokensIn,
      amountsIn,
      slippage,
      tickLower, // This is optional
      tickUpper, // This is optional
    } = body;

    if (
      !userWalletAddress ||
      !dex ||
      !poolId ||
      !tokensIn ||
      !amountsIn ||
      slippage === undefined
    ) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters." },
        { status: 400 }
      );
    }
    if (
      !isAddress(userWalletAddress) ||
      !isAddress(poolId) ||
      !Array.isArray(tokensIn) ||
      tokensIn.some((t: any) => !isAddress(t))
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid address provided in request." },
        { status: 400 }
      );
    }

    const zapParams: ZapApiParams = {
      dex,
      "pool.id": poolId,
      tokensIn,
      amountsIn,
      slippage,
    };

    if (tickLower !== undefined && tickUpper !== undefined) {
      zapParams["position.tickLower"] = tickLower;
      zapParams["position.tickUpper"] = tickUpper;
    }

    const transactions: TransactionCall[] = [];

    // Step 1: Get Route
    const routeResponse = await getZapInData(zapParams);
    const routerAddress = routeResponse?.data?.routerAddress;
    const route = routeResponse?.data?.route;

    if (!routerAddress || !route) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to get a valid route from KyberSwap API.",
        },
        { status: 500 }
      );
    }

    // Step 2: Check for Approval (if not using native token)
    const tokenIn = zapParams.tokensIn[0];
    if (tokenIn.toLowerCase() !== NATIVE_TOKEN_ADDRESS.toLowerCase()) {
      const approvalTx = await generateApprovalTx(
        tokenIn,
        userWalletAddress,
        routerAddress,
        zapParams.amountsIn[0]
      );
      if (approvalTx) {
        transactions.push(approvalTx);
      }
    }

    // Step 3: Build Final Transaction
    const buildParams: BuildTxParams = {
      route: route,
      sender: userWalletAddress,
      recipient: userWalletAddress,
      source: "jarvis-hl-api",
    };

    const buildResponse = await buildZapInTransaction(buildParams);

    if (buildResponse && buildResponse.data) {
      const swapTransaction: TransactionCall = {
        to: buildResponse.data.routerAddress,
        data: buildResponse.data.callData,
        value: buildResponse.data.value || "0",
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
    console.error("Error in /api/kyberswap-zap:", error);
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
