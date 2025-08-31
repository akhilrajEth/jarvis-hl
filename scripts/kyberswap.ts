import axios from "axios";
import { URLSearchParams } from "url";
import { BuildTxParams, ZapApiParams } from "./types";

// Note: Thiz zap script will only work for LPing
// To-Do: Find a zap script for other yield bearing tokens

const API_BASE_URL = "https://zap-api.kyberswap.com";
const CHAIN_ID = "base";

/**
 * Builds the API URL for getting the zap-in route.
 * @param params - The query parameters for the API request.
 * @returns A string representing the complete API URL.
 */
const buildGetRouteApiUrl = (params: ZapApiParams): string => {
  const searchParams = new URLSearchParams();

  searchParams.append("dex", params.dex);
  searchParams.append("pool.id", params["pool.id"]);
  searchParams.append("slippage", params.slippage.toString());

  if (params["position.id"]) {
    searchParams.append("position.id", params["position.id"]);
  }
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
 * @param {ZapApiParams} params - The parameters for the Zap API call.
 * @returns {Promise<any>} A promise that resolves with the API response data.
 */
const getZapInData = async (params: ZapApiParams): Promise<any> => {
  const apiUrl = buildGetRouteApiUrl(params);
  console.log(`Constructed Get Route URL: ${apiUrl}`);

  try {
    console.log("Sending request to get zap route...");
    const response = await axios.get(apiUrl);

    console.log("Successfully received zap route:");
    console.log(JSON.stringify(response.data, null, 2));
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
 * @function buildZapInTransaction
 * @description Step 2: Sends the route to the build endpoint to get final transaction data.
 * @param {BuildTxParams} params - The parameters for building the transaction.
 * @returns {Promise<any>} A promise that resolves with the final transaction data.
 */
const buildZapInTransaction = async (params: BuildTxParams): Promise<any> => {
  const apiUrl = `${API_BASE_URL}/${CHAIN_ID}/api/v1/in/route/build`;
  console.log(`\nConstructed Build TX URL: ${apiUrl}`);

  try {
    console.log("Sending request to build transaction...");
    const response = await axios.post(apiUrl, params);

    console.log("Successfully received transaction data:");
    console.log(JSON.stringify(response.data, null, 2));
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
 * @description Main execution function to demonstrate the usage of the script.
 */
const main = async () => {
  console.log("--- Starting KyberSwap LP Creation Script ---");

  const userWalletAddress = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B";

  const zapParams: ZapApiParams = {
    dex: "DEX_UNISWAPV3",
    "pool.id": "0xedc625b74537ee3a10874f53d170e9c17a906b9c",
    "position.tickLower": 193380,
    "position.tickUpper": 193440,
    tokensIn: ["0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"],
    amountsIn: ["10000000000000000"],
    slippage: 50, // 0.5%
  };

  try {
    const routeResponse = await getZapInData(zapParams);

    if (routeResponse && routeResponse.data && routeResponse.data.route) {
      const buildParams: BuildTxParams = {
        route: routeResponse.data.route,
        sender: userWalletAddress,
        recipient: userWalletAddress,
        source: "jarvis-hl-script",
      };

      await buildZapInTransaction(buildParams);
    }
  } catch (error) {
    console.error("\nScript finished with an error.");
  }

  console.log("\n--- Script execution finished ---");
};

main();
