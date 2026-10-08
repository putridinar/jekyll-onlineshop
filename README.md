# 🛒 Dinar Shop — Jekyll Online Shop + Midtrans + Telegram Bot (Vercel)

Toko online statis berbasis **Jekyll**, dengan:
- Halaman detail produk dari collection `_products/`
- Sistem keranjang berbasis `localStorage` (tanpa database)
- Pembayaran **Midtrans Snap** via Vercel Serverless Functions
- **Notifikasi bot Telegram**: saat order masuk & saat pembayaran sukses
- Deploy ke **Vercel**

## Struktur
- `_config.yml` — konfigurasi Jekyll (collection products)
- `_products/` — data produk (markdown + front matter)
- `_layouts/default.html` — layout utama (header + counter keranjang)
- `_layouts/product.html` — layout detail produk
- `index.html` — katalog/grid produk
- `cart.html` — halaman keranjang
- `checkout.html` — form checkout + Snap.js
- `assets/js/cart.js` — logika keranjang (localStorage)
- `assets/js/checkout.js` — logika checkout & pembayaran
- `assets/css/style.css` — styling
- `api/create-snap.js` — buat transaksi Snap + notif Telegram "order masuk"
- `api/midtrans-webhook.js` — webhook notifikasi pembayaran Midtrans
- `vercel.json` — build & output Vercel

## Setup

### 1. Midtrans
1. Daftar di midtrans.com, buat akun (mulai dengan **Sandbox**).
2. Ambil **Server Key** dan **Client Key** (Settings → Access Keys).
3. Di `checkout.html`, ganti `REPLACE_WITH_CLIENT_KEY` dengan Client Key Anda; untuk produksi ganti URL snap.js ke `https://app.midtrans.com/snap/snap.js`.

### 2. Telegram Bot
1. Chat @BotFather → `/newbot` → dapatkan **Bot Token**.
2. Chat bot Anda (klik Start) supaya bot bisa mengirim pesan.
3. Dapatkan **chat_id** Anda: chat @userinfobot atau buka `https://api.telegram.org/bot<TOKEN>/getUpdates` setelah mengirim pesan ke bot.

### 3. Deploy ke Vercel
1. Push repo ke GitHub.
2. Vercel → New Project → import repo (build & output diatur `vercel.json`).
3. Tambahkan **Environment Variables** (Production & Preview):
   - `MIDTRANS_SERVER_KEY`
   - `MIDTRANS_IS_PRODUCTION` — `false` untuk sandbox, `true` untuk produksi
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
4. Deploy.

### 4. Set Webhook Midtrans
Di Dashboard Midtrans → Settings → Configuration → **Payment Notification URL** isi:
`https://DOMAIN-ANDA.vercel.app/api/midtrans-webhook`

## Alur Kerja
1. Pelanggan tambah produk ke keranjang (disimpan di `localStorage`).
2. Checkout → `POST /api/create-snap` membuat transaksi Snap → token dikembalikan.
3. Server langsung kirim notifikasi Telegram **"🛒 ORDER BARU MASUK"**.
4. Popup Snap.js muncul, pelanggan bayar.
5. Midtrans kirim notifikasi ke `/api/midtrans-webhook` → server verifikasi signature (SHA-512) → kirim notifikasi Telegram **"✅ PAYMENT SUCCESS"**.

## Menambah Produk
Tambah file di `_products/` dengan front matter: `name`, `price`, `image`, `stock`, `category`, `description` + isi deskripsi. Halaman detail otomatis tersedia di `/produk/<nama-file>/`.
