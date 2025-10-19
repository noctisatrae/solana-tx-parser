import { createSolanaRpc, signature, type Signature } from "@solana/kit";
import { analyzeTransaction } from "../src";

const rpc = createSolanaRpc(
  process.env["TESTRUNNER_RPC"] || "https://api.mainnet-beta.solana.com",
);

const [, , sigArg] = Bun.argv;
const swapTxSig =
  (sigArg ? signature(sigArg) : undefined) ||
  ("2xRQGcC2xJFBQ4c5wa71uDpj4GwjpiDkGX83GQxL9P97iwLiJkKymR3CpyP6as8tjMK2hZ2iuDg997nrRLXD4UeY" as Signature);

console.debug(await analyzeTransaction(rpc, swapTxSig));
