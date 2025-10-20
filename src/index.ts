import type { Address, Rpc, Signature, SolanaRpcApiMainnet } from "@solana/kit";

import { getAccountList } from "./accountMap";
import {
	JUPITER_V6,
	SYSTEM_PROGRAM,
	TOKEN_PROGRAM,
	TOKEN_PROGRAM_2022,
	WRAPPED_SOL,
	WRAPPED_SOL_DECIMALS,
} from "./constants";
import * as JupiterV6 from "./protocols/jupiter/v6";

import * as System from "./systemProgram";
import * as TokenProgram from "./tokenProgram";
import { type AnySwap, type AssetTransfer, b58, type SimpleTx } from "./utils";

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

export const analyzeTransaction = async (
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
	if (!tx.signatures[0]) {
		throw new Error("Could not get transaction signature from RPC");
	}

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
		// biome-ignore lint/style/noNonNullAssertion: programIdIndex is never gonna overflow accountMap
		const { address: programAddress } = accountMap.get(ix.programIdIndex)!;
		// biome-ignore lint/style/noNonNullAssertion: again, idx from solana blocks are not gonna overflow the account list
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
			case TOKEN_PROGRAM:
			case TOKEN_PROGRAM_2022: {
				if (ixData[0] === TokenProgram.TRANSFER_DISCRIMINATOR) {
					const transfer = TokenProgram.Transfer.decode({
						accounts,
						data: ixData,
					});

					assetTransfers.push({
						from: transfer.source,
						to: transfer.destination,
						amount: transfer.lamport.toString(),
						asset: WRAPPED_SOL,
						decimals: WRAPPED_SOL_DECIMALS,
					});

					counters.transferCount++;
				} else if (ixData[0] === TokenProgram.TRANSFER_CHECKED_DISCRIMINATOR) {
					const transfer = TokenProgram.TransferChecked.decode({
						accounts,
						data: ixData,
					});

					assetTransfers.push({
						from: transfer.source,
						to: transfer.destination,
						amount: transfer.amount.toString(),
						asset: transfer.mint,
						decimals: transfer.decimals,
					});

					counters.transferCount++;
				}

				counters.systemIxCount++;
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
		txHash: tx.signatures[0],
		status: res.meta.err ? "REVERTED" : "CONFIRMED",
		blockNumber: res.slot.toString(),
		type: determineTransactionType(counters),
		assetTransfers,
		swaps,
	};
};
