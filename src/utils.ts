import {
  getBase58Encoder,
  type Address,
  type Base58EncodedBytes,
  type ReadonlyUint8Array,
  type Signature,
  type TransactionForFullJson,
} from "@solana/kit";
import type { AggregatedAccountInfo } from "./accountMap";

// The solana foundation has the most dogshit SDK; how am I supposed to know I have to do that to get the meta part of a transaction?
export type ConfirmedTransactionMeta = NonNullable<
  TransactionForFullJson<0>["meta"]
>;

export type TransactionMessage =
  TransactionForFullJson<0>["transaction"]["message"];
// such a convenient way to get the type definition for TxInstruction...
export type TxInstruction =
  TransactionForFullJson<0>["transaction"]["message"]["instructions"][number];

export interface SimpleDecoderArgs {
  accounts: AggregatedAccountInfo[];
  data: ReadonlyUint8Array;
}

export interface AssetTransfer {
  from: Address;
  fromOwner?: Address;
  to: Address;
  toOwner?: Address;
  asset: Address;
  amount: string;
  decimals?: number;
}

export interface RawSwap {
  amm?: Address;
  inputMint: Address;
  inputAmount: bigint;
  outputMint: Address;
  outputAmount: bigint;
}

export interface AnySwap extends RawSwap {
  userTransferAuthority: Address;
  userSourceTokenAccount: Address;
  userDestinationTokenAccount: Address;
}

export interface SimpleTx {
  txHash: Base58EncodedBytes;
  blockNumber: string;
  status: "REVERTED" | "CONFIRMED";
  type: "TRANSFER" | "SWAP" | "UNKNOWN";
  assetTransfers: AssetTransfer[];
  swaps: AnySwap[];
}

export const b58 = getBase58Encoder();
