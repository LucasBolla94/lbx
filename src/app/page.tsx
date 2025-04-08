/* app/page.tsx */
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import {
  AreaChart,
  Area,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [solData, setSolData] = useState<{ date: string; time: string; price: number }[]>([]);
  const [lbxData, setLbxData] = useState<{ date: string; time: string; price: number }[]>([]);
  const [walletUSD, setWalletUSD] = useState<number | null>(null);

  const notifications = [
    { content: "New feature released!", date: "2025-04-08" },
    { content: "LBX Token listed!", date: "2025-04-06" },
    { content: "Security update", date: "2025-04-03" },
  ];

  useEffect(() => {
    const fetchSolData = () => {
      fetch("https://api.coingecko.com/api/v3/coins/solana/market_chart?vs_currency=usd&days=1")
        .then((res) => res.json())
        .then((data) => {
          const formatted = data.prices.map((item: [number, number]) => {
            const dateObj = new Date(item[0]);
            return {
              date: `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear().toString().slice(-2)}`,
              time: `${dateObj.getHours().toString().padStart(2, '0')}:${dateObj.getMinutes().toString().padStart(2, '0')}`,
              price: parseFloat(item[1].toFixed(6)),
            };
          });
          setSolData(formatted);
        })
        .catch((err) => console.error("Error fetching SOL chart data:", err));
    };

    const mockLbxData = () => {
      const now = new Date();
      const min = 0.0159;
      const max = 0.023056;
      const mock = Array.from({ length: 24 }, (_, i) => {
        const date = new Date(now);
        date.setHours(now.getHours() - (23 - i));
        const price = parseFloat((Math.random() * (max - min) + min).toFixed(6));
        return {
          date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`,
          time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
          price,
        };
      });
      setLbxData(mock);
    };

    const fetchWalletBalance = () => {
      fetch("/api/wallet-balance")
        .then(res => res.json())
        .then(data => {
          let total = 0;
          if (data?.allAssets?.length) {
            data.allAssets.forEach((asset: any) => {
              const price = asset.token_info?.price_info?.price_per_token || 0;
              const balance = asset.token_info?.balance || 0;
              const decimals = asset.token_info?.decimals || 0;
              total += (balance / Math.pow(10, decimals)) * price;
            });
          }
          setWalletUSD(total);
        })
        .catch(err => console.error("Error fetching wallet balance:", err));
    };

    const updateData = () => {
      fetchSolData();
      mockLbxData();
      fetchWalletBalance();
      fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd")
        .then((res) => res.json())
        .then((data) => setSolPrice(data.solana.usd))
        .catch((err) => console.error("Error fetching SOL price:", err));
    };

    updateData();
    const interval = setInterval(updateData, 60000);
    return () => clearInterval(interval);
  }, []);

  const getColorByTrend = (data: { price: number }[]) => {
    if (data.length < 2) return "#9333ea";
    return data[data.length - 1].price >= data[0].price ? "#22c55e" : "#ef4444";
  };

  const getYAxisDomain = (data: { price: number }[]) => {
    const prices = data.map(p => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min;
    return [min - range * 0.5, max + range * 0.5];
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center text-white relative z-0"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      {/* NOTIFICATIONS OVERLAY */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 right-6 w-72 bg-black text-white border border-purple-500 rounded-xl shadow-2xl p-4 text-sm z-[99999]"
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-semibold text-purple-400">Notifications</h4>
              <button onClick={() => setShowNotifications(false)} className="text-white hover:text-purple-400">
                <X size={18} />
              </button>
            </div>
            <ul className="space-y-2">
              {notifications.map((n, i) => (
                <li key={i} className="border-b border-white/10 pb-1">
                  <p className="text-white">{n.content}</p>
                  <span className="text-xs text-purple-300">{n.date}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVBAR */}
      <header className="w-full flex justify-between items-center px-6 py-4 backdrop-blur-md bg-black/30 shadow-md z-50 relative">
        <Image src="/logo.png" alt="LBX Logo" width={140} height={40} />

        <div className="flex items-center gap-4">
          <button className="bg-gradient-to-br from-purple-600 to-black text-white font-semibold px-5 py-2 rounded-full shadow-lg hover:brightness-110 transition">
            Connect Wallet
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-full hover:bg-white/10 transition relative"
            >
              <Bell size={24} />
            </button>
          </div>
        </div>
      </header>

      {/* WALLET BALANCE PANEL */}
      <section className="px-6 pt-8 pb-4">
        <div className="bg-gradient-to-br from-purple-700/50 to-black/70 border border-purple-500 rounded-2xl shadow-xl p-6 text-center">
          <h3 className="text-xl font-semibold text-purple-300 mb-2">Total Wallet Balance (USD)</h3>
          <p className="text-4xl font-bold text-white">
            {walletUSD !== null ? `$${walletUSD.toFixed(2)}` : "Loading..."}
          </p>
        </div>
      </section>

      {/* MAIN CHARTS SIDE BY SIDE */}
      <main className="px-6 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-6 z-10 relative">
        {[{ title: "Solana", data: solData, image: "/solana.png", price: solPrice }, { title: "LBX Token", data: lbxData }].map((chart, index) => {
          const color = getColorByTrend(chart.data);
          const latestPrice = chart.data.length > 0 ? chart.data[chart.data.length - 1].price : 0;

          return (
            <div key={index} className="bg-[#0e0e15] rounded-xl shadow-xl p-6 relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  {chart.image && <Image src={chart.image} alt={chart.title} width={32} height={32} />}
                  <h2 className="text-white text-xl font-semibold">{chart.title}</h2>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">${latestPrice.toFixed(6)}</p>
                </div>
              </div>
              <div className="h-80 w-full flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chart.data} margin={{ top: 40, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`color${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#444" fontSize={11} padding={{ left: 0, right: 0 }} tickLine={false} axisLine={false} />
                    <YAxis domain={getYAxisDomain(chart.data)} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f0f1a", borderColor: color, borderRadius: 8 }}
                      labelStyle={{ color: "#aaa" }}
                      formatter={(value: number) => [`$${value.toFixed(6)}`, "Price"]}
                      labelFormatter={(label, payload) => {
                        const time = payload?.[0]?.payload?.time || "";
                        const date = payload?.[0]?.payload?.date || "";
                        return `${time} | ${date}`;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={color}
                      fill={`url(#color${index})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </main>

      {/* NEWS PANEL */}
      <section className="px-6 pb-12 z-10 relative">
        <div className="bg-black/50 backdrop-blur-lg rounded-xl p-6 shadow-2xl">
          <h2 className="text-xl font-semibold mb-4">Latest News</h2>
          <div className="text-gray-400">
            [Will connect to Firebase to fetch live news soon...]
          </div>
        </div>
      </section>
    </div>
  );
}