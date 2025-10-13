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
    return {
      source: accounts[0]!.address,
      destination: accounts[1]!.address,
      lamport: amount,
    };
  },
};
