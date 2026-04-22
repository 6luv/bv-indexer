import "dotenv/config";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";

const infuraApiKey = process.env.INFURA_API_KEY;
if (!infuraApiKey) throw new Error("INFURA_KEY is not defined");

const rpcUrl = `https://sepolia.infura.io/v3/${infuraApiKey}`;

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(rpcUrl),
});
