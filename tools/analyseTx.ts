import { createSolanaRpc, type Signature } from "@solana/kit";
import { analyzeTransaction } from "../src";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");

const swapTxSig =
  "2xRQGcC2xJFBQ4c5wa71uDpj4GwjpiDkGX83GQxL9P97iwLiJkKymR3CpyP6as8tjMK2hZ2iuDg997nrRLXD4UeY" as Signature;

console.debug(await analyzeTransaction(rpc, swapTxSig));
