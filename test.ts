import { createPublicClient, http, parseAbiItem, zeroAddress } from "viem";
import { nftAddress, nftABIArray } from "./src/lib/wagmi/contracts";

const publicClient = createPublicClient({ transport: http("https://mainnet-rpc.apolloscan.io") });

async function findTokenMintBlock(tokenId: number) {
  const logs = await publicClient.getLogs({
    address: nftAddress,
    event: parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"),
    fromBlock: BigInt(0),  // or some known starting block
    toBlock: "latest",
    args: { from: zeroAddress, tokenId: BigInt(tokenId) }, // only mints for that tokenId
  });

  if (!logs.length) return null;

  // The Transfer log contains the blockNumber
  return Number(logs[0].blockNumber);
}

// Example usage
const blockNumber = await findTokenMintBlock(419354);
console.log("Token 419354 minted in block:", blockNumber);