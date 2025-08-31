// Note: Run this script with npx ts-node --project tsconfig.scripts.json scripts/kyberswap-aggregator.ts

import axios from "axios";
import { URLSearchParams } from "url";
import * as dotenv from "dotenv";
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

dotenv.config({ path: ".env.local" });

if (!process.env.BASE_RPC_URL) {
  throw new Error(
    "Missing BASE_RPC_URL from .env file. Please check your setup."
  );
}
const provider = new JsonRpcProvider(process.env.BASE_RPC_URL);

/**
 * Builds the API URL for getting the aggregator swap route.
 */
const buildGetRouteApiUrl = (params: AggregatorApiParams): string => {
  const searchParams = new URLSearchParams({
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    gasInclude: "true", // Recommended by KyberSwap docs
  });

  return `${AGGREGATOR_API_BASE_URL}/${CHAIN_ID}/api/v1/routes?${searchParams.toString()}`;
};

/**
 * @async
 * @function getAggregatorRouteData
 * @description Step 1: Fetches the best swap route from the Aggregator API.
 */
const getAggregatorRouteData = async (
  params: AggregatorApiParams
): Promise<any> => {
  const apiUrl = buildGetRouteApiUrl(params);
  console.log(`Constructed Get Route URL: ${apiUrl}`);
  try {
    console.log("Sending request to get aggregator route...");
    const response = await axios.get(apiUrl, {
      headers: { "x-client-id": "jarvis-hl-script" },
    });
    console.log("Successfully received aggregator route.");
    return response.data;
  } catch (error) {
    console.error(
      "An error occurred while calling the Aggregator API (get route)."
    );
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error("Error:", (error as Error).message);
    }
    throw error;
  }
};

/**
 * @async
 * @function generateApprovalTx
 * @description Checks token allowance and returns an approval transaction if needed.
 */
const generateApprovalTx = async (
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  amountToApprove: string
): Promise<TransactionCall | null> => {
  console.log(`\n--- Checking Approval for ${tokenAddress} ---`);
  const tokenContract = new Contract(tokenAddress, ERC_20_ABI, provider);

  console.log(`Owner: ${ownerAddress}`);
  console.log(`Spender (Router): ${spenderAddress}`);

  const currentAllowance = await tokenContract.allowance(
    ownerAddress,
    spenderAddress
  );
  console.log(`Current allowance: ${currentAllowance.toString()}`);
  console.log(`Required amount:   ${amountToApprove}`);

  if (currentAllowance < BigInt(amountToApprove)) {
    console.log(
      "Allowance is insufficient. Generating approval transaction data..."
    );
    const erc20Interface = new Interface(ERC_20_ABI);
    const approvalCallData = erc20Interface.encodeFunctionData("approve", [
      spenderAddress,
      amountToApprove,
    ]);

    const approvalTransaction: TransactionCall = {
      to: tokenAddress,
      data: approvalCallData,
      value: "0",
    };
    console.log("Approval transaction data generated.");
    return approvalTransaction;
  } else {
    console.log("Sufficient allowance already granted. No approval needed.");
    return null;
  }
};

/**
 * @async
 * @function buildAggregatorTransaction
 * @description Step 2: Sends the route summary to get the final transaction data.
 */
const buildAggregatorTransaction = async (
  params: BuildAggregatorTxParams
): Promise<any> => {
  const apiUrl = `${AGGREGATOR_API_BASE_URL}/${CHAIN_ID}/api/v1/route/build`;
  console.log(`\n--- Building Final Transaction ---`);
  console.log(`Constructed Build TX URL: ${apiUrl}`);

  try {
    console.log("Sending request to build transaction...");
    const response = await axios.post(apiUrl, params, {
      headers: { "x-client-id": "jarvis-hl-script" },
    });
    console.log("Successfully received transaction data.");
    return response.data;
  } catch (error) {
    console.error(
      "An error occurred while calling the Aggregator API (build tx)."
    );
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status}`);
      console.error("Data:", JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error("Error:", (error as Error).message);
    }
    throw error;
  }
};

/**
 * @function main
 * @description Main execution function to generate swap transactions.
 */
const main = async (): Promise<TransactionCall[]> => {
  console.log("--- Starting KyberSwap Aggregator Script ---");

  const userWalletAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";
  console.log(`Using wallet address: ${userWalletAddress}`);

  if (!isAddress(userWalletAddress)) {
    throw new Error("Invalid user wallet address provided.");
  }

  const transactions: TransactionCall[] = [];

  // --- Example: Swap 1 USDC for WETH on Base ---
  const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
  const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";
  const swapAmount = "1000000"; // 1 USDC (6 decimals)

  const aggregatorParams: AggregatorApiParams = {
    tokenIn: USDC_ADDRESS,
    tokenOut: WETH_ADDRESS,
    amountIn: swapAmount,
  };

  try {
    const routeResponse = await getAggregatorRouteData(aggregatorParams);
    const routerAddress = routeResponse?.data?.routerAddress;
    const routeSummary = routeResponse?.data?.routeSummary;

    if (routerAddress && routeSummary) {
      if (
        aggregatorParams.tokenIn.toLowerCase() !==
        NATIVE_TOKEN_ADDRESS.toLowerCase()
      ) {
        const approvalTx = await generateApprovalTx(
          aggregatorParams.tokenIn,
          userWalletAddress,
          routerAddress,
          aggregatorParams.amountIn
        );
        if (approvalTx) {
          transactions.push(approvalTx);
        }
      }

      const buildParams: BuildAggregatorTxParams = {
        routeSummary: routeSummary,
        sender: userWalletAddress,
        recipient: userWalletAddress,
        slippageTolerance: 50, // 0.5%
        source: "jarvis-hl-script",
      };

      const buildResponse = await buildAggregatorTransaction(buildParams);

      if (buildResponse && buildResponse.data) {
        const swapTransaction: TransactionCall = {
          to: buildResponse.data.routerAddress,
          data: buildResponse.data.data, // Note: field is named `data` in this API response
          value: buildResponse.data.transactionValue || "0",
        };
        transactions.push(swapTransaction);
      }
    }
  } catch (error) {
    console.error("\nScript finished with an error.");
  }

  console.log("\n--- Generated Transactions ---");
  console.log(JSON.stringify(transactions, null, 2));
  console.log("\n--- Script execution finished ---");
  return transactions;
};

main();
