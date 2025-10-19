import {
  getAddressDecoder,
  getArrayDecoder,
  getStructDecoder,
  getU64Decoder,
  getU8Decoder,
  type ReadonlyUint8Array,
} from "@solana/kit";
import {
  b58,
  type AnySwap,
  type ConfirmedTransactionMeta,
  type RawSwap,
  type SimpleDecoderArgs,
} from "../../../utils";
import type { AggregatedAccountInfo } from "../../../accountMap";
import { JUPITER_V6 } from "../../../constants";

/* ---- IX DISCRIMINATORS ---- */
// const routeDiscriminator = "e517cb977ae3ad2a"
const sharedAccountRouteDiscriminator = "c1209b3341d69c81";
const sharedAccountRouteV2Discriminator = "d19853937cfed8e9";

/* ---- EVENTS DISCRIMINATORS ---- */
// event:SwapEvent -> Individual swap (legacy)
const swapEventDiscriminator = "40c6cde8260871e2";
// event:SwapsEvent -> Array of swaps (struct SwapEventV2)
const swapsEventDiscriminator = "982f4eebc0606e6a";

// I'm forcing myself to use @solana/kit's shitty decoder syntax but for my production system
// I use web3.js alongside borsher :)
// ------------------------------------------------------
// export const SwapEventCpiSchema = BorshSchema.Struct({
//   eventIxTag: BorshSchema.Array(BorshSchema.u8, 8),
//   eventDiscriminator: BorshSchema.Array(BorshSchema.u8, 8),
//   amm: BorshSchema.Array(BorshSchema.u8, 32),
//   inputMint: BorshSchema.Array(BorshSchema.u8, 32),
//   inputAmount: BorshSchema.u64,
//   outputMint: BorshSchema.Array(BorshSchema.u8, 32),
//   outputAmount: BorshSchema.u64,
// })
// ------------------------------------------------------
const SwapEventCpi = getStructDecoder([
  // again, why is it that called "decoder" while the 32-byte sized hexadecimal representation is the purest?
  // it's an encoder so it becomes human readable thanks to base-58. Still, I gotta give them props for this utility.
  // It will make my life easier; much better than parsing manually like with Borsher.
  ["amm", getAddressDecoder()],
  ["inputMint", getAddressDecoder()],
  ["inputAmount", getU64Decoder()],
  ["outputMint", getAddressDecoder()],
  ["outputAmount", getU64Decoder()],
]);

const SwapsEventCpi = getStructDecoder([
  [
    "swapsEvent",
    getArrayDecoder(
      getStructDecoder([
        ["inputMint", getAddressDecoder()],
        ["inputAmount", getU64Decoder()],
        ["outputMint", getAddressDecoder()],
        ["outputAmount", getU64Decoder()],
      ]),
    ),
  ],
]);

interface JupiterSwapDecoderArgs extends SimpleDecoderArgs {
  accountMap: Map<number, AggregatedAccountInfo>;
  innerIxs?: ConfirmedTransactionMeta["innerInstructions"] | null;
  // instruction index
  ixIdx: number;
}

const findJupInnerIxs = (
  swapIxIdx: number,
  innerIxs?: JupiterSwapDecoderArgs["innerIxs"],
) => {
  if (!innerIxs) return undefined;
  return innerIxs.find((ix) => ix.index === swapIxIdx)?.instructions;
};

type TransactionInstruction = NonNullable<
  ReturnType<typeof findJupInnerIxs>
>[number];

interface JupiterCpiIx extends Omit<TransactionInstruction, "data"> {
  data: ReadonlyUint8Array;
  discriminator: string;
}

export const handleJupiterSwap = ({
  data,
  accountMap,
  innerIxs,
  accounts,
  ixIdx,
}: JupiterSwapDecoderArgs): AnySwap | undefined => {
  if (accounts.length < 4) {
    console.error("Not enough accounts involved to be a Jupiter Swap");
    return undefined;
  }

  // I. Extract CPIs
  const jupInnerIx = findJupInnerIxs(ixIdx, innerIxs);
  if (!jupInnerIx) {
    console.error("Failed to find CPI inner instruction");
    return undefined;
  }

  const jupiterCpis = jupInnerIx
    .filter((ix) => accountMap.get(ix.programIdIndex)!.address === JUPITER_V6)
    .map((cpiIx) => {
      // i just realized that even they are aware that data is Base58EncodedBytes
      // but we still have to use encode lmao
      const data = b58.encode(cpiIx.data);

      return {
        ...cpiIx,
        data,
        discriminator: data.subarray(8, 16).toHex(),
      };
    })
    .filter((ix) => {
      // We skip the first 8 bytes which indicate the binary payload is an event.
      // The next 8 bytes are a sha256 hash made from the event name as so:
      // sha256("event:<event_name>")
      return (
        ix.discriminator == swapEventDiscriminator ||
        ix.discriminator == swapsEventDiscriminator
      );
    });

  if (jupiterCpis.length === 0) {
    // This is changed to a warn because Jupiter instructions don't all have relevant swap CPIs logs
    console.warn(
      "Failed to find Jupiter CPI instruction for instruction index:",
      ixIdx,
    );
    return undefined;
  }

  // we need some accounts from the calldata so we need to know how arguments are mapped to the account list
  const isSharedAccountRoute =
    data.subarray(0, 8).toHex() === sharedAccountRouteDiscriminator;
  const isSharedAccountRouteV2 =
    data.subarray(0, 8).toHex() === sharedAccountRouteV2Discriminator;

  const transferAuthorityIdx = isSharedAccountRoute ? 2 : 1;
  const destinationTokenAccIdx = isSharedAccountRoute
    ? 6
    : isSharedAccountRouteV2
      ? 5
      : 3;

  const swap = parseSwapCi(jupiterCpis);

  return {
    ...swap,
    userTransferAuthority: accounts[transferAuthorityIdx]!.address,
    userSourceTokenAccount: accounts[transferAuthorityIdx + 1]!.address,
    userDestinationTokenAccount: accounts[destinationTokenAccIdx]!.address,
  };
};

const parseSwapCi = (cpiIxs: JupiterCpiIx[]): RawSwap => {
  // todo filter decoder to use depending on the discriminator
  const parsedCpis: RawSwap[] = cpiIxs.flatMap((cpiIx) => {
    switch (cpiIx.discriminator) {
      case swapEventDiscriminator:
        return SwapEventCpi.decode(cpiIx.data, 16);
      case swapsEventDiscriminator:
        return SwapsEventCpi.decode(cpiIx.data, 16).swapsEvent;
      default:
        throw new Error(
          `Unknown Jupiter CPI instruction discriminator: ${cpiIx.discriminator}`,
        );
    }
  });

  const firstEvent = parsedCpis[0]!;
  const lastEvent = parsedCpis[parsedCpis.length - 1]!;

  let totalInputAmount = BigInt(0);
  for (const cpi of parsedCpis) {
    // Sum all inputs that match the first input mint
    // Compare as strings since they're byte arrays
    if (cpi.inputMint.toString() === firstEvent.inputMint.toString()) {
      totalInputAmount += cpi.inputAmount;
    }
  }

  // For multi-hop swaps, sum all output amounts that match the final output mint
  let totalOutputAmount = BigInt(0);
  for (const cpi of parsedCpis) {
    // Sum all outputs that match the final output mint
    // Compare as strings since they're byte arrays
    if (cpi.outputMint.toString() === lastEvent.outputMint.toString()) {
      totalOutputAmount += cpi.outputAmount;
    }
  }

  return {
    amm: lastEvent.amm,
    inputMint: firstEvent.inputMint,
    inputAmount: totalInputAmount,
    outputMint: lastEvent.outputMint,
    outputAmount: totalOutputAmount,
  };
};
