import { createSolanaRpc } from "@solana/kit";

const getRPC = () => {
	return createSolanaRpc(
		process.env.TESTRUNNER_RPC || "https://api.mainnet-beta.solana.com",
	);
};

export const rpc = getRPC();
