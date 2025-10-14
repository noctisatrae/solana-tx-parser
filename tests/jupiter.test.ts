import type { Signature } from "@solana/kit";
import { analyzeTransaction } from "../src";
import { rpc } from "./utils/getRpc";
import { describe, expect, it } from "bun:test";

describe("jupiter_v6 parser", () => {
  it("Parses $TROLLHOUSE to $WSOL", async () => {
    const { type, swaps } = await analyzeTransaction(
      rpc,
      "5Epf8Hy5bews1mnnwMG3TKtBfB98nSRzCrfKWjWkzm6UaEamvb4t6K1pPoFMsouzYLjkhn5HDnSy4Qymh4ruhp7m" as Signature,
    );

    console.debug(swaps);

    expect(type).toStrictEqual("SWAP");
    expect(swaps);
  });
});
