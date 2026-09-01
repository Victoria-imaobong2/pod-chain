import { NextResponse } from "next/server";
import { createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { baseSepolia } from "viem/chains";

export const ESCROW_CREATE_ABI = [
  {
    type: "function",
    name: "createParcel",
    stateMutability: "payable",
    inputs: [
      { name: "_receiverPhone", type: "string" },
      { name: "_destinationAddress", type: "string" },
      { name: "_contentsName", type: "string" },
      { name: "_confirmationHash", type: "bytes32" },
      { name: "_ipfsHash", type: "string" },
    ],
    outputs: [],
  },
] as const;

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  "0x5ec609ee5e21c8e00050228a1c51077589be5e39") as `0x${string}`;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { receiverPhone, destinationAddress, contentsName, confirmationHash, ipfsHash, feeEth } = body;

    // Use deployer/funder private key from environment or fallback
    const rawKey = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;
    if (!rawKey) {
      return NextResponse.json(
        { error: "Server missing PRIVATE_KEY for relay" },
        { status: 500 }
      );
    }

    const formattedKey = (rawKey.startsWith("0x") ? rawKey : `0x${rawKey}`) as `0x${string}`;
    const account = privateKeyToAccount(formattedKey);

    const client = createWalletClient({
      account,
      chain: baseSepolia,
      transport: http("https://sepolia.base.org"),
    });

    const txHash = await client.writeContract({
      address: CONTRACT_ADDRESS,
      abi: ESCROW_CREATE_ABI,
      functionName: "createParcel",
      args: [
        receiverPhone,
        destinationAddress,
        contentsName,
        confirmationHash,
        ipfsHash,
      ],
      value: parseEther(feeEth || "0.001"),
    });

    return NextResponse.json({ success: true, txHash });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to relay tx";
    console.error("Relay error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}