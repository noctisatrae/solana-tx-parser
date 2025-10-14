import { createSolanaRpc, type Signature } from "@solana/kit";
import { analyzeTransaction } from "../src";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");

const swapTxSig =
  "5Epf8Hy5bews1mnnwMG3TKtBfB98nSRzCrfKWjWkzm6UaEamvb4t6K1pPoFMsouzYLjkhn5HDnSy4Qymh4ruhp7m" as Signature;

console.debug(await analyzeTransaction(rpc, swapTxSig));
