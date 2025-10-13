import type { Address, Lamports, TokenBalance } from "@solana/kit";
import { type TransactionForFullJson, AccountRole } from "@solana/kit";
import type { ConfirmedTransactionMeta, TransactionMessage } from "./utils";

export interface AggregatedAccountInfo {
  // The address of the account
  address: Address;
  // The position in the accountKeys array
  idx: number;
  // The computed role (READONLY, WRITABLE, READONLY_SIGNER, or WRITABLE_SIGNER)
  role: AccountRole;

  tokenAccountsOwned: Address[];
  preTokenBalances?: TokenBalance;
  postTokenBalances?: TokenBalance;

  preNativeBalance?: Lamports;
  postNativeBalance?: Lamports;
}

/**
 * Computes the AccountRole based on the account's index and the transaction header.
 *
 * Solana account layout in the accountKeys array:
 * [0..numWritableSigners) - WRITABLE_SIGNER
 * [numWritableSigners..numRequiredSignatures) - READONLY_SIGNER
 * [numRequiredSignatures..numRequiredSignatures+numWritableNonSigners) - WRITABLE
 * [numRequiredSignatures+numWritableNonSigners..end) - READONLY
 */
function computeAccountRole(
  accountIndex: number,
  header: TransactionMessage["header"],
  totalAccounts: number,
): AccountRole {
  const {
    numRequiredSignatures,
    numReadonlySignedAccounts,
    numReadonlyUnsignedAccounts,
  } = header;

  const isSigner = accountIndex < numRequiredSignatures;
  const isWritable =
    accountIndex < numRequiredSignatures - numReadonlySignedAccounts ||
    (accountIndex >= numRequiredSignatures &&
      accountIndex < totalAccounts - numReadonlyUnsignedAccounts);

  if (isSigner && isWritable) return AccountRole.WRITABLE_SIGNER;
  if (isSigner && !isWritable) return AccountRole.READONLY_SIGNER;
  if (!isSigner && isWritable) return AccountRole.WRITABLE;
  return AccountRole.READONLY;
}

export const getAccountList = (
  accountKeys: Address[],
  // I hate the solana foundation and their stupid compiler generated type
  // no one took the time to use this right?
  meta: Pick<
    ConfirmedTransactionMeta,
    "preTokenBalances" | "postTokenBalances" | "preBalances" | "postBalances"
  > | null,
  messageHeader: TransactionMessage["header"],
): Map<number, AggregatedAccountInfo> => {
  const accounts = new Map<number, AggregatedAccountInfo>();
  if (!meta || !meta.preTokenBalances || !meta.postTokenBalances) {
    throw new Error("Missing token balances; cannot process transaction");
  }

  // Narrow the types by assigning to const variables
  // Because Typescript is dumb and I am so tired of this js bullshit
  const preTokenBalances = meta.preTokenBalances;
  const postTokenBalances = meta.postTokenBalances;

  const ownerSet = new Set<Address>();
  for (const b of preTokenBalances) {
    if (!b.owner) {
      continue;
    }
    ownerSet.add(b.owner);
  }

  for (const b of postTokenBalances) {
    if (!b.owner) {
      continue;
    }
    ownerSet.add(b.owner);
  }

  const uniqueOwners = Array.from(ownerSet);
  // This is a combination from accounts inside meta.accountKeys and inside the balance changes
  // It allows me to include wallet account owning the token accounts involved inside the instructions
  const combined: Address[] = [
    ...accountKeys,
    ...uniqueOwners.filter((o) => !accountKeys.includes(o)), // skip duplicates
  ];

  combined.forEach((address) => {
    const tokenAccountsOwned = [
      ...preTokenBalances.filter((b) => b.owner === address),
      ...postTokenBalances.filter((b) => b.owner === address),
    ]
      .map((balance) => combined[balance.accountIndex])
      .filter((index) => index !== undefined);

    const tokenAccountsOwnedArray = Array.from(new Set(tokenAccountsOwned));
    const accountKeyIdx = accountKeys.indexOf(address);

    // Only compute role for accounts that are in the accountKeys array
    const role =
      accountKeyIdx >= 0
        ? computeAccountRole(accountKeyIdx, messageHeader, accountKeys.length)
        : AccountRole.READONLY; // Default for accounts not in accountKeys (e.g., token account owners)

    const account: AggregatedAccountInfo = {
      address,
      idx: accountKeyIdx,
      role,
      tokenAccountsOwned: tokenAccountsOwnedArray,
      preTokenBalances: preTokenBalances.find((b) => b.owner === address),
      postTokenBalances: postTokenBalances.find((b) => b.owner === address),
      preNativeBalance: meta.preBalances[accountKeyIdx],
      postNativeBalance: meta.postBalances[accountKeyIdx],
    };

    accounts.set(accountKeyIdx, account);
  });

  return accounts;
};
