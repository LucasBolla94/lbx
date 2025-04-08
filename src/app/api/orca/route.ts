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

    const solBalance = nativeBalanceLamports ? nativeBalanceLamports / 1e9 : 0;

    const orcaLPs = items.filter((item: any) =>
      item.content?.metadata?.name?.toLowerCase().includes("orca")
    );

    let totalOrcaNFTValue = 0;

    for (const nft of orcaLPs) {
      const nftValue = await fetchOrcaNFTValue(nft.id);
      totalOrcaNFTValue += nftValue;
    }

    return NextResponse.json({
      solBalance,
      totalOrcaNFTValue,
      totalBalance: solBalance + totalOrcaNFTValue,
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

async function fetchOrcaNFTValue(nftId: string): Promise<number> {
  try {
    const response = await fetch(`https://api.orca.so/v1/whirlpool/position/${nftId}`);
    if (!response.ok) {
      console.error(`Erro na Orca API para ${nftId}:`, response.statusText);
      return 0;
    }
    const data = await response.json();

    const tokenA = data.position.tokenAmounts.tokenA;
    const tokenB = data.position.tokenAmounts.tokenB;

    const priceA = await fetchTokenPrice(tokenA.mint);
    const priceB = await fetchTokenPrice(tokenB.mint);

    const valueA = (Number(tokenA.amount) / Math.pow(10, tokenA.decimals)) * priceA;
    const valueB = (Number(tokenB.amount) / Math.pow(10, tokenB.decimals)) * priceB;

    return valueA + valueB;
  } catch (error) {
    console.error("Erro ao buscar valor do NFT da Orca:", error);
    return 0;
  }
}

async function fetchTokenPrice(mint: string): Promise<number> {
  try {
    const response = await fetch(`https://price.jup.ag/v4/price?ids=${mint}`);
    const data = await response.json();
    return data.data?.[mint]?.price || 0;
  } catch (error) {
    console.error("Erro ao buscar preço do token:", error);
    return 0;
  }
}