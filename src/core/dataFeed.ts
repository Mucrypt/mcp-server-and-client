import axios from "axios";

const BINANCE_URL = "https://api.binance.com/api/v3/klines";

export type Candle = {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export async function getOHLC(
  symbol: string,
  interval: string,
  limit = 200
): Promise<Candle[]> {
  const url = `${BINANCE_URL}?symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const { data } = await axios.get(url);

  const candles = data as any[];
  return candles.map((candle: any) => ({
    time: candle[0],
    open: parseFloat(candle[1]),
    high: parseFloat(candle[2]),
    low: parseFloat(candle[3]),
    close: parseFloat(candle[4]),
    volume: parseFloat(candle[5]),
  }));
}
export async function getLatestPrice(symbol: string): Promise<number> {
    const url = `https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`;
    const { data } = await axios.get(url);
    const priceData = data as { price: string };
    return parseFloat(priceData.price);
}

export async function get24hChange(symbol: string): Promise<{ priceChange: number; priceChangePercent: number }> {
    const url = `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`;
    const { data } = await axios.get(url);
    const tickerData = data as { priceChange: string; priceChangePercent: string };
    return {
        priceChange: parseFloat(tickerData.priceChange),
        priceChangePercent: parseFloat(tickerData.priceChangePercent),
    };
}


