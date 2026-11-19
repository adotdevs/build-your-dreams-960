import { createServerFn } from "@tanstack/react-start";

const COINS = [
  { id: "bitcoin", symbol: "btc", name: "Bitcoin", pair: "BTCUSDT", kraken: "XBTUSD", bitfinex: "tBTCUSD", cb: "BTC", image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
  { id: "ethereum", symbol: "eth", name: "Ethereum", pair: "ETHUSDT", kraken: "ETHUSD", bitfinex: "tETHUSD", cb: "ETH", image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  { id: "tether", symbol: "usdt", name: "Tether", pair: null, kraken: null, bitfinex: null, cb: null, image: "https://assets.coingecko.com/coins/images/325/large/Tether.png", fixed: 1 },
  { id: "binancecoin", symbol: "bnb", name: "BNB", pair: "BNBUSDT", kraken: null, bitfinex: null, cb: "BNB", image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png" },
  { id: "solana", symbol: "sol", name: "Solana", pair: "SOLUSDT", kraken: "SOLUSD", bitfinex: "tSOLUSD", cb: "SOL", image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
  { id: "ripple", symbol: "xrp", name: "XRP", pair: "XRPUSDT", kraken: "XRPUSD", bitfinex: "tXRPUSD", cb: "XRP", image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png" },
  { id: "usd-coin", symbol: "usdc", name: "USDC", pair: null, kraken: null, bitfinex: null, cb: null, image: "https://assets.coingecko.com/coins/images/6319/large/usdc.png", fixed: 1 },
  { id: "cardano", symbol: "ada", name: "Cardano", pair: "ADAUSDT", kraken: "ADAUSD", bitfinex: "tADAUSD", cb: "ADA", image: "https://assets.coingecko.com/coins/images/975/large/cardano.png" },
  { id: "dogecoin", symbol: "doge", name: "Dogecoin", pair: "DOGEUSDT", kraken: "XDGUSD", bitfinex: "tDOGE:USD", cb: "DOGE", image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png" },
  { id: "tron", symbol: "trx", name: "TRON", pair: "TRXUSDT", kraken: "TRXUSD", bitfinex: "tTRXUSD", cb: "TRX", image: "https://assets.coingecko.com/coins/images/1094/large/tron-logo.png" },
] as const;

type Quote = { price: number; change: number };

let cachedData: any[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 20_000;

const FALLBACK_USD_EUR = 0.92;

async function fetchJson(url: string, timeoutMs = 6000) {
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as any;
}

async function fetchUsdToEurRate() {
  const sources: Array<() => Promise<number>> = [
    async () => Number((await fetchJson("https://api.frankfurter.dev/v1/latest?from=USD&to=EUR"))?.rates?.EUR),
    async () => Number((await fetchJson("https://api.coinbase.com/v2/exchange-rates?currency=USD"))?.data?.rates?.EUR),
    async () => Number((await fetchJson("https://open.er-api.com/v6/latest/USD"))?.rates?.EUR),
  ];
  for (const src of sources) {
    try {
      const rate = await src();
      if (Number.isFinite(rate) && rate > 0) return rate;
    } catch {
      // try next source
    }
  }
  return FALLBACK_USD_EUR;
}

const need = (out: Map<string, Quote>) =>
  COINS.filter((c: any) => !c.fixed && !out.has(c.id));

async function fromBinance(host: string, out: Map<string, Quote>) {
  const missing = need(out).filter((c: any) => c.pair);
  if (missing.length === 0) return;
  const symbols = encodeURIComponent(JSON.stringify(missing.map((c: any) => c.pair)));
  const tickers: any[] = await fetchJson(`https://${host}/api/v3/ticker/24hr?symbols=${symbols}`);
  const map = new Map(tickers.map((t) => [t.symbol, t]));
  for (const c of missing as any[]) {
    const t = map.get(c.pair);
    const price = t ? parseFloat(t.lastPrice) : NaN;
    if (Number.isFinite(price) && price > 0) {
      out.set(c.id, { price, change: parseFloat(t.priceChangePercent) || 0 });
    }
  }
}

async function fromBitfinex(out: Map<string, Quote>) {
  const missing = need(out).filter((c: any) => c.bitfinex);
  if (missing.length === 0) return;
  const rows: any[] = await fetchJson(
    `https://api-pub.bitfinex.com/v2/tickers?symbols=${missing.map((c: any) => c.bitfinex).join(",")}`,
  );
  const map = new Map(rows.map((r) => [r[0], r]));
  for (const c of missing as any[]) {
    const r = map.get(c.bitfinex);
    const price = r ? Number(r[7]) : NaN;
    if (Number.isFinite(price) && price > 0) {
      out.set(c.id, { price, change: (Number(r[6]) || 0) * 100 });
    }
  }
}

async function fromKraken(out: Map<string, Quote>) {
  const missing = need(out).filter((c: any) => c.kraken);
  if (missing.length === 0) return;
  const data = await fetchJson(
    `https://api.kraken.com/0/public/Ticker?pair=${missing.map((c: any) => c.kraken).join(",")}`,
  );
  const result = data?.result ?? {};
  const entries = Object.values<any>(result);
  const keys = Object.keys(result);
  for (const c of missing as any[]) {
    const idx = keys.findIndex((k) =>
      k.replace(/^X|^Z/, "").includes(c.kraken.replace("USD", "").replace(/^X/, "")),
    );
    const t = idx >= 0 ? entries[idx] : undefined;
    const price = t ? parseFloat(t.c?.[0]) : NaN;
    const open = t ? parseFloat(t.o) : NaN;
    if (Number.isFinite(price) && price > 0) {
      const change = Number.isFinite(open) && open > 0 ? ((price - open) / open) * 100 : 0;
      out.set(c.id, { price, change });
    }
  }
}

async function fromCoinGecko(out: Map<string, Quote>) {
  const missing = need(out);
  if (missing.length === 0) return;
  const data = await fetchJson(
    `https://api.coingecko.com/api/v3/simple/price?ids=${missing.map((c) => c.id).join(",")}&vs_currencies=usd&include_24hr_change=true`,
  );
  for (const c of missing) {
    const price = Number(data?.[c.id]?.usd);
    if (Number.isFinite(price) && price > 0) {
      out.set(c.id, { price, change: Number(data?.[c.id]?.usd_24h_change) || 0 });
    }
  }
}

async function fromCoinbase(out: Map<string, Quote>) {
  const missing = need(out).filter((c: any) => c.cb);
  if (missing.length === 0) return;
  await Promise.all(
    missing.map(async (c: any) => {
      try {
        const data = await fetchJson(`https://api.coinbase.com/v2/prices/${c.cb}-USD/spot`);
        const price = Number(data?.data?.amount);
        if (Number.isFinite(price) && price > 0) out.set(c.id, { price, change: 0 });
      } catch {
        // ignore this coin
      }
    }),
  );
}

async function fetchQuotes() {
  const out = new Map<string, Quote>();
  const providers = [
    () => fromBinance("data-api.binance.vision", out),
    () => fromBinance("api.binance.com", out),
    () => fromBitfinex(out),
    () => fromKraken(out),
    () => fromCoinGecko(out),
    () => fromCoinbase(out),
    () => fromBinance("api.binance.us", out),
  ];
  for (const p of providers) {
    if (need(out).length === 0) break;
    try {
      await p();
    } catch {
      // try next provider
    }
  }
  return out;
}

async function fetchPrices() {
  const [usdToEur, byId] = await Promise.all([fetchUsdToEurRate(), fetchQuotes()]);

  const liveCount = COINS.filter((c: any) => !c.fixed && byId.has(c.id)).length;
  if (liveCount === 0) throw new Error("No live crypto prices available from any provider");

  return COINS.map((c: any) => {
    const entry = byId.get(c.id);
    const priceUsd = entry ? entry.price : (c.fixed ?? 0);
    const change = entry ? entry.change : 0;
    return {
      id: c.id,
      symbol: c.symbol,
      name: c.name,
      image: c.image,
      current_price_usd: priceUsd,
      current_price_eur: priceUsd * usdToEur,
      current_price: priceUsd,
      price_change_percentage_24h: change,
      market_cap: 0,
      usd_to_eur: usdToEur,
    };
  });
}

export const getCryptoPrices = createServerFn({ method: "GET" }).handler(async () => {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) return cachedData;

  try {
    const data = await fetchPrices();
    cachedData = data;
    cacheTimestamp = now;
    return data;
  } catch (error) {
    if (cachedData) return cachedData;
    throw error;
  }
});
