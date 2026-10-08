// Vercel Serverless Function: buat transaksi Midtrans Snap + notifikasi order masuk ke Telegram
// Env vars (set di Vercel Dashboard → Settings → Environment Variables):
//   MIDTRANS_SERVER_KEY, MIDTRANS_IS_PRODUCTION (true/false), TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID

const midtransServerKey = process.env.MIDTRANS_SERVER_KEY || "";
const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
const SNAP_HOST = isProduction ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";
const tgToken = process.env.TELEGRAM_BOT_TOKEN;
const tgChat = process.env.TELEGRAM_CHAT_ID;

async function notifyTelegram(text) {
  if (!tgToken || !tgChat) return console.warn("Telegram env tidak lengkap, notifikasi dilewati");
  await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: tgChat, text, parse_mode: "HTML" })
  });
}

const rupiah = n => new Intl.NumberFormat("id-ID").format(n);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { customer, items } = req.body || {};
    if (!customer?.name || !customer?.email || !Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: "Data pesanan tidak lengkap" });
    }

    const grossAmount = items.reduce((s, i) => s + i.price * i.qty, 0);
    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = {
      transaction_details: { order_id: orderId, gross_amount: grossAmount },
      item_details: items.map(i => ({
        id: i.id, price: i.price, quantity: i.qty, name: String(i.name).slice(0, 50)
      })),
      customer_details: {
        first_name: customer.name,
        email: customer.email,
        phone: customer.phone
      },
      custom_field1: customer.address || "-"
    };

    const snapRes = await fetch(`${SNAP_HOST}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Basic " + Buffer.from(midtransServerKey + ":").toString("base64")
      },
      body: JSON.stringify(payload)
    });
    const snap = await snapRes.json();
    if (!snapRes.ok) {
      console.error("Midtrans error:", snap);
      return res.status(500).json({ error: snap.error_messages?.[0] || "Gagal membuat transaksi" });
    }

    // Notifikasi bot Telegram: order masuk
    await notifyTelegram(
      `🛒 <b>ORDER BARU MASUK</b>\n\n` +
      `Order ID: <code>${orderId}</code>\n` +
      `Nama: ${customer.name}\n` +
      `WhatsApp: ${customer.phone}\n` +
      `Alamat: ${customer.address || "-"}\n\n` +
      items.map(i => `• ${i.name} × ${i.qty} — Rp ${rupiah(i.price * i.qty)}`).join("\n") +
      `\n\n<b>Total: Rp ${rupiah(grossAmount)}</b>\n` +
      `Status pembayaran: menunggu`
    );

    return res.status(200).json({ token: snap.token, order_id: orderId });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Terjadi kesalahan server" });
  }
}
