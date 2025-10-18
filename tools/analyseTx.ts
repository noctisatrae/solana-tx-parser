import { createSolanaRpc, type Signature } from "@solana/kit";
import { analyzeTransaction } from "../src";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");

const swapTxSig =
  "5Do3Yg7Rc752GvKwWwoBXZHb2s7VyTYJmSSvUHZvuasQofXX4TQY6odj65sgEmUTmXDbfXfZNooehCqQDKeRFmeg" as Signature;

console.debug(await analyzeTransaction(rpc, swapTxSig));
