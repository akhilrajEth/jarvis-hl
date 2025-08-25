import { TokenData } from "@/types";
import axios from "axios";
import { GECKOTERMINAL_BASE_URL, NETWORK } from "./constants";

export async function getCurrentTokenPrice(
  tokenAddress: string
): Promise<TokenData | null> {
  if (!tokenAddress) {
    console.error("Error: Token address is required.");
    return null;
  }

  const url = `${GECKOTERMINAL_BASE_URL}/networks/${NETWORK}/tokens/${tokenAddress}`;

  try {
    console.log(`Fetching data for ${tokenAddress} from GeckoTerminal...`);

    const response = await axios.get(url);

    const attributes = response.data.data.attributes;
    const priceUsd = attributes.price_usd;
    const symbol = attributes.symbol;
    const address = attributes.address;

    if (!priceUsd || !symbol || !address) {
      console.error(
        `Error: Incomplete data received for token ${tokenAddress}.`
      );
      return null;
    }

    return {
      price_usd: priceUsd,
      address: address,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `Error fetching data from GeckoTerminal API: ${error.response.status} ${error.response.statusText}`
      );
    } else {
      console.error("An unexpected error occurred:", error);
    }
    return null;
  }
}
