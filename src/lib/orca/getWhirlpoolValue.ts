import { Connection, PublicKey } from "@solana/web3.js";
import { WhirlpoolContext, buildWhirlpoolClient, ORCA_WHIRLPOOL_PROGRAM_ID, PDAUtil } from "@orca-so/whirlpools-sdk";
import { DecimalUtil } from "@orca-so/common-sdk";

export async function getOrcaWhirlpoolPositionValue(positionMint: string) {
  const connection = new Connection("https://api.mainnet-beta.solana.com");
  const wallet = {
    publicKey: new PublicKey("11111111111111111111111111111111"), // Read-only
    signTransaction: async () => { throw new Error("not implemented"); },
    signAllTransactions: async () => { throw new Error("not implemented"); },
  };

  const ctx = WhirlpoolContext.withProvider(connection, wallet, ORCA_WHIRLPOOL_PROGRAM_ID);
  const client = buildWhirlpoolClient(ctx);

  const positionPda = PDAUtil.getPosition(ctx.program.programId, new PublicKey(positionMint));
  const position = await client.getPosition(positionPda.publicKey);

  if (!position) {
    throw new Error("Position not found.");
  }

  const pool = await position.getWhirlpool();
  const valueUSD = await pool.getTokenAmountsFromLiquidity(position.getData().liquidity);

  return {
    tokenA: valueUSD.tokenA,
    tokenB: valueUSD.tokenB,
    totalValue: valueUSD.tokenA.add(valueUSD.tokenB), // Isso é uma estimativa
  };
}
