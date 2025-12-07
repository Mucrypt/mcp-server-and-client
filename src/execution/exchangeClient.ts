import crypto from "crypto";
import axios from "axios";

export type Venue = "bybit" | "binance-futures";

export type OrderSide = "buy" | "sell";

export type OrderRequest = {
  venue: Venue;
  symbol: string;
  side: OrderSide;
  quantity: number;
  leverage?: number;
};

export type OrderResponse = {
  success: boolean;
  txId?: string;
  raw?: any;
  error?: string;
};

/**
 * High-level entry: route to Bybit or Binance.
 */
export async function placeOrder(req: OrderRequest): Promise<OrderResponse> {
  if (req.venue === "bybit") {
    return placeBybitOrder(req);
  }
  if (req.venue === "binance-futures") {
    return placeBinanceFuturesOrder(req);
  }

  return { success: false, error: `Unsupported venue: ${req.venue}` };
}

/* ----------------------- BYBIT (v5, testnet) ----------------------- */

const BYBIT_TESTNET_BASE = "https://api-testnet.bybit.com"; // v5 base for testnet :contentReference[oaicite:0]{index=0}

async function placeBybitOrder(req: OrderRequest): Promise<OrderResponse> {
  const apiKey = process.env.BYBIT_API_KEY;
  const apiSecret = process.env.BYBIT_API_SECRET;

  if (!apiKey || !apiSecret) {
    return {
      success: false,
      error: "Missing BYBIT_API_KEY or BYBIT_API_SECRET in env",
    };
  }

  const endpoint = "/v5/order/create"; // create order :contentReference[oaicite:1]{index=1}
  const url = BYBIT_TESTNET_BASE + endpoint;

  const timestamp = Date.now().toString();
  const recvWindow = "5000";

  // Example: USDT perp category. Adjust category/symbol to your account type.
  const body = {
    category: "linear",
    symbol: req.symbol, // e.g. "BTCUSDT"
    side: req.side.toUpperCase(), // "BUY" | "SELL"
    orderType: "Market",
    qty: req.quantity.toString(),
    timeInForce: "IOC",
  };

  const bodyStr = JSON.stringify(body);
  const preSign = timestamp + apiKey + recvWindow + bodyStr;

  const sign = crypto
    .createHmac("sha256", apiSecret)
    .update(preSign)
    .digest("hex");

  try {
    const { data } = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        "X-BAPI-API-KEY": apiKey,
        "X-BAPI-SIGN": sign,
        "X-BAPI-TIMESTAMP": timestamp,
        "X-BAPI-RECV-WINDOW": recvWindow,
      },
    }) as { data: any };

    if (data.retCode !== 0) {
      return {
        success: false,
        error: `Bybit error: ${data.retMsg ?? data.retCode}`,
        raw: data,
      };
    }

    return {
      success: true,
      txId: data.result?.orderId,
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Bybit request failed: ${err?.message ?? String(err)}`,
    };
  }
}

/* ---------------- BINANCE FUTURES TESTNET ----------------- */

const BINANCE_FUTURES_TESTNET_BASE = "https://testnet.binancefuture.com"; // :contentReference[oaicite:2]{index=2}

async function placeBinanceFuturesOrder(
  req: OrderRequest
): Promise<OrderResponse> {
  const apiKey = process.env.BINANCE_API_KEY;
  const apiSecret = process.env.BINANCE_API_SECRET;

  if (!apiKey || !apiSecret) {
    return {
      success: false,
      error: "Missing BINANCE_API_KEY or BINANCE_API_SECRET in env",
    };
  }

  const endpoint = "/fapi/v1/order"; // futures order endpoint :contentReference[oaicite:3]{index=3}
  const url = BINANCE_FUTURES_TESTNET_BASE + endpoint;

  const timestamp = Date.now();
  const params = new URLSearchParams({
    symbol: req.symbol, // e.g. "BTCUSDT"
    side: req.side.toUpperCase(), // "BUY" | "SELL"
    type: "MARKET",
    quantity: req.quantity.toString(),
    timestamp: timestamp.toString(),
  });

  const queryString = params.toString();
  const signature = crypto
    .createHmac("sha256", apiSecret)
    .update(queryString)
    .digest("hex");

  const finalQuery = queryString + "&signature=" + signature;

  try {
    const response = await axios.post(url + "?" + finalQuery, null, {
      headers: {
        "X-MBX-APIKEY": apiKey,
      },
    });
    const data = response.data as { orderId?: string; clientOrderId?: string; [key: string]: any };

    return {
      success: true,
      txId: String(data.orderId ?? data.clientOrderId ?? ""),
      raw: data,
    };
  } catch (err: any) {
    return {
      success: false,
      error: `Binance request failed: ${err?.message ?? String(err)}`,
    };
  }
}
