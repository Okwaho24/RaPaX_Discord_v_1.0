// ─────────────────────────────────────────────────────────────
//  RaPaX™ Discord Bot — API Client
//  Thin wrapper around the RaPaX™ REST API.
// ─────────────────────────────────────────────────────────────
import axios from 'axios';
import 'dotenv/config';

const BASE = process.env.RAPAX_API_URL || 'http://localhost:4000/api';

// ── Cached operator token ─────────────────────────────────────
let _token = null;
let _tokenExpiry = 0;

async function getToken() {
  if (_token && Date.now() < _tokenExpiry) return _token;

  const res = await axios.post(`${BASE}/operator/login`, {
    secret: process.env.RAPAX_OPERATOR_SECRET,
  });
  _token = res.data.token;
  // Refresh 5 minutes before expiry (token is 24h)
  _tokenExpiry = Date.now() + (23 * 60 + 55) * 60 * 1000;
  return _token;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` };
}

// ── Public endpoints ──────────────────────────────────────────

export async function listProducts() {
  const res = await axios.get(`${BASE}/products`);
  return res.data.products || [];
}

export async function getProduct(productId) {
  const res = await axios.get(`${BASE}/product/${productId}`);
  return res.data.product;
}

export async function initiatePurchase({ productId, currency, buyerWallet }) {
  const res = await axios.post(`${BASE}/purchase/initiate`, {
    product_id:   productId,
    currency:     currency.toUpperCase(),
    buyer_wallet: buyerWallet || null,
  });
  return res.data;
}

export async function getPurchaseStatus(transactionId) {
  const res = await axios.get(`${BASE}/purchase/status/${transactionId}`);
  return res.data;
}

// ── Operator endpoints ────────────────────────────────────────

export async function getTransactions(limit = 20) {
  const token = await getToken();
  const res = await axios.get(`${BASE}/operator/transactions?limit=${limit}`, {
    headers: authHeaders(token),
  });
  return res.data.transactions || [];
}

export async function getDeliveries(limit = 20) {
  const token = await getToken();
  const res = await axios.get(`${BASE}/operator/deliveries?limit=${limit}`, {
    headers: authHeaders(token),
  });
  return res.data.deliveries || [];
}

export async function getLogs(limit = 10, eventType = null) {
  const token = await getToken();
  const params = `limit=${limit}${eventType ? `&event_type=${eventType}` : ''}`;
  const res = await axios.get(`${BASE}/operator/logs?${params}`, {
    headers: authHeaders(token),
  });
  return res.data.logs || [];
}

export async function confirmPayment({ transactionId, txHash, amountReceived }) {
  const token = await getToken();
  const res = await axios.post(
    `${BASE}/internal/payment/confirm`,
    { transaction_id: transactionId, tx_hash: txHash, amount_received: amountReceived },
    { headers: authHeaders(token) }
  );
  return res.data;
}

export async function getAllProducts() {
  const token = await getToken();
  const res = await axios.get(`${BASE}/operator/products`, {
    headers: authHeaders(token),
  });
  return res.data.products || [];
}
