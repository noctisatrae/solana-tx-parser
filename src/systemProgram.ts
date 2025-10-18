import { getStructDecoder, getU32Decoder, getU64Decoder } from "@solana/kit";
import { b58, type SimpleDecoderArgs, type TxInstruction } from "./utils";

export interface Transfer {
  lamport: bigint;
}

export const TRANSFER_DISCRIMINATOR = 0x02;

export const Transfer = {
  rawDecoder: getStructDecoder([
    ["discriminator", getU32Decoder()],
    ["amount", getU64Decoder()],
  ]).decode,
  decode: ({ data, accounts }: SimpleDecoderArgs) => {
    const { amount } = Transfer.rawDecoder(data);
    const [source, destination] = accounts;

    if (!source || !destination) {
      throw new Error("Cannot find source or destination in accounts");
    }

    return {
      source: source.address,
      destination: destination.address,
      lamport: amount,
    };
  },
};
