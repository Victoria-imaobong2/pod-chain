import { NextResponse } from "next/server";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      receiverPhone,
      destinationAddress,
      contentsName,
      confirmationHash,
      feeSol,
      senderPublicKey,
    } = body;

    const rpcUrl =
      process.env.SOLANA_RPC_URL ||
      process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
      clusterApiUrl("devnet");
    const connection = new Connection(rpcUrl, "confirmed");

    // 1. Reconstitute the backend payer keypair from env
    const secretKeyArray = JSON.parse(process.env.SOLANA_BACKEND_SECRET_KEY || "[]");
    if (!secretKeyArray.length) {
      throw new Error("SOLANA_BACKEND_SECRET_KEY is not configured.");
    }
    const backendPayer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

    // 2. Format on-chain record payload
    const recordPayload = JSON.stringify({
      action: "CREATE_PARCEL",
      phone: receiverPhone,
      dest: destinationAddress,
      item: contentsName,
      hash: confirmationHash,
      fee: feeSol || "0.001",
      sender: senderPublicKey,
      timestamp: Date.now(),
    });

    const memoProgramId = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

    // 3. Build & sign real transaction on Devnet
    const transaction = new Transaction().add(
      new TransactionInstruction({
        keys: [{ pubkey: backendPayer.publicKey, isSigner: true, isWritable: false }],
        programId: memoProgramId,
        data: Buffer.from(recordPayload, "utf-8"),
      })
    );

    const txSignature = await sendAndConfirmTransaction(connection, transaction, [backendPayer]);

    return NextResponse.json({
      success: true,
      txHash: txSignature,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal relay error";
    console.error("Relay signing error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}