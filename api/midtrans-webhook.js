// Vercel Serverless Function: Webhook Midtrans (Payment Notification)
// Saat pembayaran SUCCESS → kirim notifikasi ke bot Telegram
// Env vars: MIDTRANS_SERVER_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

import crypto from "crypto";

const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || "";
const tgToken = process.env.TELEGRAM_BOT_TOKEN;
const tgChat = process.env.TELEGRAM_CHAT_ID;

async function notifyTelegram(text) {
  if (!tgToken || !tgChat) return console.warn("Telegram env tidak lengkap");
  await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: tgChat, text, parse_mode: "HTML" })
  });
}

// Verifikasi signature Midtrans: sha512(order_id + status_code + gross_amount + serverKey)
function verifySignature(body) {
  const expected = crypto
    .createHash("sha512")
    .update(`${body.order_id}${body.status_code}${body.gross_amount}${midtransServerKey}`)
    .digest("hex");
  return expected === body.signature_key;
}

const PAYMENT_SUCCESS = ["settlement", "capture"];

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const body = req.body || {};
  if (!verifySignature(body)) {
    console.warn("Signature tidak valid untuk order", body.order_id);
    return res.status(403).json({ error: "Invalid signature" });
  }

  const isSuccess = PAYMENT_SUCCESS.includes(body.transaction_status);

  await notifyTelegram(
    (isSuccess ? "✅ <b>PAYMENT SUCCESS</b>\n\n" : "ℹ️ <b>Update Status Pembayaran</b>\n\n") +
    `Order ID: <code>${body.order_id}</code>\n` +
    `Jenis: ${body.payment_type}\n` +
    `Status: ${body.transaction_status}\n` +
    `Total: Rp ${new Intl.NumberFormat("id-ID").format(Number(body.gross_amount))}`
  );

  // Selalu balas 200 agar Midtrans tidak retry
  return res.status(200).json({ received: true });
}
