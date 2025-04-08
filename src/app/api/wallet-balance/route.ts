import { NextResponse } from "next/server";

const HELIUS_API_KEY = "44a7b170-0809-4848-b621-0f854499407a";
const RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
const WALLET_ADDRESS = "BZB6XuKenzjF5mcmkqtbMg9922wT5RMwXjAXDREDk1YM";

export async function GET() {
  try {
    const response = await fetch(RPC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "wallet-assets",
        method: "searchAssets",
        params: {
          ownerAddress: WALLET_ADDRESS,
          tokenType: "all",
          displayOptions: {
            showNativeBalance: true,
          },
        },
      }),
    });

    const json = await response.json();

    if (!json.result) {
      return NextResponse.json({ error: "No data returned" }, { status: 400 });
    }

    const { nativeBalanceLamports, items } = json.result;

    const solBalance = nativeBalanceLamports
      ? nativeBalanceLamports / 1e9
      : 0;

    const orcaLPs = items.filter((item: any) =>
      item.content?.metadata?.name?.toLowerCase().includes("orca")
    );

    return NextResponse.json({
      solBalance,
      allAssets: items,
      orcaLPs,
    });
  } catch (error) {
    console.error("Erro ao buscar dados da carteira:", error);
    return NextResponse.json(
      { error: "Erro ao buscar dados da carteira" },
      { status: 500 }
    );
  }
}
