// Keranjang berbasis localStorage
const CART_KEY = "dinar_cart";

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  document.dispatchEvent(new CustomEvent("cart:updated", { detail: cart }));
}
function addToCart(item) {
  const cart = getCart();
  const found = cart.find(i => i.id === item.id);
  if (found) found.qty += item.qty;
  else cart.push(item);
  saveCart(cart);
}
function updateQty(id, qty) {
  let cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty = Math.max(1, qty);
  saveCart(cart);
}
function removeItem(id) {
  saveCart(getCart().filter(i => i.id !== id));
}
function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}
function rupiah(n) {
  return new Intl.NumberFormat("id-ID").format(n);
}
function renderCartCount() {
  const el = document.querySelector("[data-cart-count]");
  if (el) el.textContent = getCart().reduce((s, i) => s + i.qty, 0);
}

// Tombol "Tambah ke Keranjang" di halaman detail produk
document.addEventListener("click", e => {
  const btn = e.target.closest("[data-add-to-cart]");
  if (!btn) return;
  const qty = parseInt(document.querySelector("[data-qty]").value, 10) || 1;
  addToCart({
    id: btn.dataset.id,
    name: btn.dataset.name,
    price: parseInt(btn.dataset.price, 10),
    image: btn.dataset.image,
    qty
  });
  const msg = btn.parentElement.querySelector(".added-msg");
  if (msg) { msg.hidden = false; setTimeout(() => msg.hidden = true, 2000); }
});

// Render tabel keranjang di halaman /cart/
function renderCartTable() {
  const tbody = document.querySelector("[data-cart-items]");
  if (!tbody) return;
  const cart = getCart();
  document.querySelector(".cart-empty").hidden = cart.length > 0;
  tbody.innerHTML = cart.map(i => `
    <tr>
      <td>${i.name}</td>
      <td>Rp ${rupiah(i.price)}</td>
      <td><input type="number" value="${i.qty}" min="1" data-row-qty="${i.id}" style="width:60px"></td>
      <td>Rp ${rupiah(i.price * i.qty)}</td>
      <td><button data-remove="${i.id}" class="btn-link">✕ Hapus</button></td>
    </tr>`).join("");
  const totalEl = document.querySelector("[data-cart-total]");
  if (totalEl) totalEl.textContent = rupiah(cartTotal());
}

document.addEventListener("cart:updated", renderCartCount);
document.addEventListener("cart:updated", renderCartTable);
document.addEventListener("input", e => {
  const row = e.target.closest("[data-row-qty]");
  if (row) updateQty(row.dataset.rowQty, parseInt(row.value, 10) || 1);
});
document.addEventListener("click", e => {
  const rm = e.target.closest("[data-remove]");
  if (rm) removeItem(rm.dataset.remove);
});
renderCartCount();
renderCartTable();
