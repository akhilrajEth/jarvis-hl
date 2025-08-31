// Note: Run this script with npx ts-node --project tsconfig.scripts.json scripts/kyberswap.ts

import axios from "axios";
import { URLSearchParams } from "url";
import * as dotenv from "dotenv";
import { Contract, Interface, isAddress, JsonRpcProvider } from "ethers";
import { BuildTxParams, TransactionCall, ZapApiParams } from "./types";
import { API_BASE_URL, CHAIN_ID, ERC_20_ABI } from "./constants";

dotenv.config({ path: ".env.local" });

if (!process.env.BASE_RPC_URL) {
  throw new Error(
    "Missing BASE_RPC_URL from .env file. Please check your setup."
  );
}
const provider = new JsonRpcProvider(process.env.BASE_RPC_URL);

const buildGetRouteApiUrl = (params: ZapApiParams): string => {
  const searchParams = new URLSearchParams();
  searchParams.append("dex", params.dex);
  searchParams.append("pool.id", params["pool.id"]);
  searchParams.append("slippage", params.slippage.toString());

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

  return `${API_BASE_URL}/${CHAIN_ID}/api/v1/in/route?${searchParams.toString()}`;
};

/**
 * @async
 * @function getZapInData
 * @description Step 1: Sends a request to get the zap route data.
 */
const getZapInData = async (params: ZapApiParams): Promise<any> => {
  const apiUrl = buildGetRouteApiUrl(params);
  console.log(`Constructed Get Route URL: ${apiUrl}`);
  try {
    console.log("Sending request to get zap route...");
    const response = await axios.get(apiUrl);
    console.log("Successfully received zap route.");
    return response.data;
  } catch (error) {
    console.error(
      "An error occurred while calling the KyberSwap Zap API (get route)."
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
 * @function buildZapInTransaction
 * @description Step 3: Sends the route to the build endpoint to get final transaction data.
 */
const buildZapInTransaction = async (params: BuildTxParams): Promise<any> => {
  const apiUrl = `${API_BASE_URL}/${CHAIN_ID}/api/v1/in/route/build`;
  console.log(`\n--- Building Final Transaction ---`);
  console.log(`Constructed Build TX URL: ${apiUrl}`);

  try {
    console.log("Sending request to build transaction...");
    const response = await axios.post(apiUrl, params);
    console.log("Successfully received transaction data.");
    return response.data;
  } catch (error) {
    console.error(
      "An error occurred while calling the KyberSwap Zap API (build tx)."
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
 * @description Main execution function to generate the list of required transactions.
 */
const main = async (): Promise<TransactionCall[]> => {
  console.log("--- Starting KyberSwap LP Creation Script ---");

  const userWalletAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B"; // Example address
  console.log(`Using wallet address: ${userWalletAddress}`);

  if (!isAddress(userWalletAddress)) {
    throw new Error("Invalid user wallet address provided.");
  }

  const transactions: TransactionCall[] = [];

  const USDC_ADDRESS = "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913";
  const zapAmount = "1000000"; // 1 USDC, since it has 6 decimals

  const zapParams: ZapApiParams = {
    dex: "DEX_UNISWAPV3",
    "pool.id": "0xedc625b74537ee3a10874f53d170e9c17a906b9c", // Pool: ZORA-WETH 0.05% on Base
    "position.tickLower": 193380,
    "position.tickUpper": 193440,
    tokensIn: [USDC_ADDRESS],
    amountsIn: [zapAmount],
    slippage: 50, // 0.5%
  };

  const NATIVE_TOKEN_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

  try {
    // Step 1: Get the encoded route from the API
    const routeResponse = await getZapInData(zapParams);
    const routerAddress = routeResponse?.data?.routerAddress;
    const route = routeResponse?.data?.route;

    if (routerAddress && route) {
      // Step 2 (Conditional): Generate approval transaction if the input is an ERC20 token
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

      // Step 3: Use the route to build the final transaction data
      const buildParams: BuildTxParams = {
        route: route,
        sender: userWalletAddress,
        recipient: userWalletAddress,
        source: "jarvis-hl-script",
      };

      const buildResponse = await buildZapInTransaction(buildParams);

      if (buildResponse && buildResponse.data) {
        const swapTransaction: TransactionCall = {
          to: buildResponse.data.routerAddress,
          data: buildResponse.data.callData,
          value: buildResponse.data.value || "0", // Use value from API, default to "0"
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

// --- Run the main function ---
main();
