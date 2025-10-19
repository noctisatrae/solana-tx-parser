import { createSolanaRpc, type Signature } from "@solana/kit";
import { analyzeTransaction } from "../src";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");

const swapTxSig =
  "41A15rgf8AFVq4Egsygf8PMw7soEtgjpFwn9NjVPQT91N2iv5Q11QL8nj2EoeQiGz7hG2vCKzctdLkXnqkuEAJKP" as Signature;

console.debug(await analyzeTransaction(rpc, swapTxSig));
