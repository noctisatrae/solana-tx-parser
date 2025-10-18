import type { Address, Signature } from "@solana/kit";
import { analyzeTransaction } from "../src";
import { rpc } from "./utils/getRpc";
import { describe, expect, it } from "bun:test";
import { WRAPPED_SOL } from "../src/constants";

describe("jupiter_v6 parser", () => {
  // simple route parse
  it("should parse $TROLLHOUSE to $WSOL", async () => {
    const { type, swaps } = await analyzeTransaction(
      rpc,
      "5Epf8Hy5bews1mnnwMG3TKtBfB98nSRzCrfKWjWkzm6UaEamvb4t6K1pPoFMsouzYLjkhn5HDnSy4Qymh4ruhp7m" as Signature,
    );

    expect(type).toStrictEqual("SWAP");
    expect(swaps.length).toStrictEqual(1);
    expect(swaps[0]).toStrictEqual({
      amm: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA" as Address,
      inputMint: "492JGSNiNd3DvWtnej1raJwNQ6Qui1W2UaGtVUCPpump" as Address,
      inputAmount: 1000000n,
      outputMint: WRAPPED_SOL,
      outputAmount: 4260n,
      userSourceTokenAccount:
        "EdKGTEV8KyUqPXh8VXGqWtwbT9FAyrhfa6pkcNLsv16p" as Address,
      userDestinationTokenAccount:
        "Czg2XvuD82Qm2hiAycBXYx4Li1ZB2g5BJ6QfNj9TfVoS" as Address,
      userTransferAuthority:
        "9PNFVMXzdJQHxttXAojK6QZ7doqYzttfP5aM5L2YpZ1z" as Address,
    });
  });

  // more complex shared_accounts_route
  it("should parse $USDC to $PMX", async () => {
    const { type, swaps } = await analyzeTransaction(
      rpc,
      "5Do3Yg7Rc752GvKwWwoBXZHb2s7VyTYJmSSvUHZvuasQofXX4TQY6odj65sgEmUTmXDbfXfZNooehCqQDKeRFmeg" as Signature,
    );

    expect(type).toStrictEqual("SWAP");
    expect(swaps.length).toStrictEqual(1);
    expect(swaps[0]).toStrictEqual({
      amm: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo" as Address,
      inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address,
      inputAmount: 498950000n,
      outputMint: "J27UYHX5oeaG1YbUGQc8BmJySXDjNWChdGB2Pi2TMDAq" as Address,
      outputAmount: 36004551498539n,
      userTransferAuthority:
        "71mbBqEq5XbrQTeg3K5qEV61uFmHe5Du5z1MtFDswGt" as Address,
      userSourceTokenAccount:
        "CFQLXdEqnKdbR2c4MtXwAjsTHNFKVK3qna26bfBFQyhH" as Address,
      userDestinationTokenAccount:
        "GobPXLzbZVEgxGFSJ3FK6CiHCncAMt3mkDCTDVzsYnP7" as Address,
    });
  });
});
