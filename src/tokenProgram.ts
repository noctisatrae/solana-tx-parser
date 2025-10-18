import {
  getStructDecoder,
  getU32Decoder,
  getU64Decoder,
  getU8Decoder,
} from "@solana/kit";
import type { SimpleDecoderArgs } from "./utils";

export const TRANSFER_DISCRIMINATOR = 3;
export const TRANSFER_CHECKED_DISCRIMINATOR = 12;

export const Transfer = {
  rawDecoder: getStructDecoder([
    ["discriminator", getU32Decoder()],
    ["amount", getU64Decoder()],
  ]).decode,
  decode: ({ data, accounts }: SimpleDecoderArgs) => {
    const { amount } = Transfer.rawDecoder(data);
    const [source, destination, transferAuthority] = accounts;

    if (!source || !destination || !transferAuthority) {
      throw new Error(
        "Cannot find source, destination or transferAuthority in accounts",
      );
    }

    return {
      source: source.address,
      destination: destination.address,
      transferAuthority: transferAuthority.address,
      lamport: amount,
    };
  },
};

export const TransferChecked = {
  rawDecoder: getStructDecoder([
    ["discriminator", getU8Decoder()],
    ["amount", getU64Decoder()],
    ["decimals", getU8Decoder()],
  ]).decode,
  decode: ({ data, accounts }: SimpleDecoderArgs) => {
    const { amount, decimals } = TransferChecked.rawDecoder(data);
    const [source, mint, destination, transferAuthority] = accounts;

    if (!source || !mint || !destination || !transferAuthority) {
      throw new Error(
        "Cannot find source, destination, mint or transferAuthority in accounts",
      );
    }

    return {
      source: source.address,
      destination: destination.address,
      transferAuthority: transferAuthority.address,
      mint: mint.address,
      amount,
      decimals,
    };
  },
};
