import {
  createSolanaRpc,
  type Rpc,
  type SolanaRpcApiMainnet,
} from "@solana/rpc";
import { type Address, type Signature } from "@solana/kit";

import { getAccountList } from "./accountMap";
import { JUPITER_V6, SYSTEM_PROGRAM } from "./constants";
import { b58, type AnySwap, type AssetTransfer, type SimpleTx } from "./utils";

import * as System from "./systemProgram";
import * as JupiterV6 from "./protocols/jupiter/v6";

const rpc = createSolanaRpc("https://api.mainnet-beta.solana.com");

const swapTxSig =
  "5Epf8Hy5bews1mnnwMG3TKtBfB98nSRzCrfKWjWkzm6UaEamvb4t6K1pPoFMsouzYLjkhn5HDnSy4Qymh4ruhp7m" as Signature;

interface TransactionCounters {
  transferCount: number;
  systemIxCount: number;
  swapCount: number;
  unknownCount: number;
}

const determineTransactionType = (
  counters: TransactionCounters,
): SimpleTx["type"] => {
  const { transferCount, swapCount, unknownCount } = counters;

  if (swapCount === 1) {
    return "SWAP";
  }

  if (transferCount === 1 && unknownCount === 0) {
    return "TRANSFER";
  }

  if (swapCount > 1 || transferCount > 1 || unknownCount > 0) {
    return "UNKNOWN";
  }

  return "UNKNOWN";
};

const analyzeTransaction = async (
  rpc: Rpc<SolanaRpcApiMainnet>,
  txHash: Signature,
): Promise<SimpleTx> => {
  const res = await rpc
    .getTransaction(txHash, {
      commitment: "finalized",
      maxSupportedTransactionVersion: 0,
      // We do not want the node to parse the transaction for us because it is famously unreliable.
      // Instead, we're gonna make our own deserializers.
      encoding: "json",
    })
    .send();

  if (!res) {
    throw new Error("Could not get response from RPC");
  }

  if (!res.meta) {
    throw new Error("Could not get transaction metadata from RPC");
  }

  if (!res.transaction) {
    // mmmh... interesting; an endpoint dedicated to getting transactiong might not necessarily return... a transaction
    throw new Error("Could not get transaction within the response");
  }

  const { transaction: tx } = res;
  const staticKeys = tx.message.accountKeys;
  const loadedAddresses = res.meta.loadedAddresses;
  const lookupKeys: Address[] = [];

  if (loadedAddresses) {
    // Combine writable and readonly lookup addresses
    lookupKeys.push(...loadedAddresses.writable, ...loadedAddresses.readonly);
  }

  const allKeys = [...staticKeys, ...lookupKeys];
  const accountMap = getAccountList(allKeys, res.meta, tx.message.header);

  const counters: TransactionCounters = {
    transferCount: 0,
    systemIxCount: 0,
    swapCount: 0,
    unknownCount: 0,
  };

  const assetTransfers: AssetTransfer[] = [];
  const swaps: AnySwap[] = [];

  tx.message.instructions.forEach((ix, idx) => {
    const { address: programAddress } = accountMap.get(ix.programIdIndex)!;
    const accounts = ix.accounts.map((idx) => accountMap.get(idx)!);
    const ixData = b58.encode(ix.data);

    switch (programAddress) {
      case SYSTEM_PROGRAM: {
        if (ixData[0] !== System.TRANSFER_DISCRIMINATOR) {
          counters.systemIxCount++;
          break;
        }

        const transfer = System.Transfer.decode({ accounts, data: ixData });
        assetTransfers.push({
          from: transfer.source,
          to: transfer.destination,
          amount: transfer.lamport.toString(),
          asset: SYSTEM_PROGRAM,
        });

        counters.transferCount++;
        break;
      }
      case JUPITER_V6: {
        const result = JupiterV6.handleJupiterSwap({
          accountMap,
          accounts,
          data: ixData,
          ixIdx: idx,
          innerIxs: res.meta?.innerInstructions,
        });

        if (!result) {
          counters.unknownCount++;
          break;
        }

        counters.swapCount++;
        swaps.push(result);
      }
    }
  });

  return {
    txHash: tx.signatures[0]!,
    status: res.meta.err ? "REVERTED" : "CONFIRMED",
    blockNumber: res.slot.toString(),
    type: determineTransactionType(counters),
    assetTransfers,
    swaps,
  };
};

console.debug(await analyzeTransaction(rpc, swapTxSig));
