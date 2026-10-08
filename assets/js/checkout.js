// Checkout: buat transaksi Midtrans Snap via serverless function lalu bayar
const form = document.getElementById("checkout-form");
const statusEl = document.querySelector("[data-status]");

function renderSummary() {
  const cart = JSON.parse(localStorage.getItem("dinar_cart") || "[]");
  document.querySelector("[data-checkout-summary]").innerHTML = cart
    .map(i => `<li>${i.name} × ${i.qty} — Rp ${new Intl.NumberFormat("id-ID").format(i.price * i.qty)}</li>`)
    .join("");
  document.querySelector("[data-cart-total]").textContent =
    new Intl.NumberFormat("id-ID").format(cart.reduce((s, i) => s + i.price * i.qty, 0));
}
renderSummary();

form.addEventListener("submit", async e => {
  e.preventDefault();
  const cart = JSON.parse(localStorage.getItem("dinar_cart") || "[]");
  if (!cart.length) { statusEl.textContent = "Keranjang kosong."; return; }

  const data = Object.fromEntries(new FormData(form).entries());
  statusEl.textContent = "Memproses…";

  try {
    const res = await fetch("/api/create-snap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customer: data, items: cart })
    });
    const { token, order_id, error } = await res.json();
    if (!res.ok || error) throw new Error(error || "Gagal membuat transaksi");

    window.snap.pay(token, {
      onSuccess: result => {
        localStorage.removeItem("dinar_cart");
        statusEl.textContent = `✅ Pembayaran berhasil! Order: ${order_id}`;
      },
      onPending: () => statusEl.textContent = "⏳ Menunggu pembayaran Anda.",
      onError: () => statusEl.textContent = "❌ Pembayaran gagal, coba lagi."
    });
  } catch (err) {
    statusEl.textContent = "❌ " + err.message;
  }
});
