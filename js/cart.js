// ============================================
// Laseul — Cart page logic
// ============================================

function renderCartPage() {
  const el = document.getElementById('cartPageContent');

  if (cart.length === 0) {
    el.innerHTML = `
      <div class="cart-page-empty">
        <div style="font-size:44px; margin-bottom:16px;">🤍</div>
        <p style="color:var(--ink-soft); margin-bottom:24px;">السلة فاضية — يلا نختارلك حاجة حلوة</p>
        <a href="products.html" class="btn btn-primary">تسوقي التشكيلة</a>
      </div>
    `;
    return;
  }

  const items = cart.map((i, idx) => `
    <div class="cart-page-item">
      <a href="product.html?id=${i.id}" class="cart-page-item-media">
        <img src="${i.image}" alt="${i.name}">
      </a>
      <div class="cart-page-item-info">
        <a href="product.html?id=${i.id}" class="cart-page-item-name">${i.name}</a>
        <div class="cart-item-opts">${i.color} · ${i.size}</div>
        <div class="cart-page-item-row">
          <div class="cart-item-qty">
            <button data-dec="${idx}">−</button>
            <span>${i.qty}</span>
            <button data-inc="${idx}">+</button>
          </div>
          <div style="font-weight:700;">${money(i.price * i.qty)}</div>
        </div>
        <button class="cart-remove" data-remove="${idx}">إزالة</button>
      </div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="cart-page-grid">
      <div class="cart-page-list">${items}</div>
      <div class="cart-page-summary">
        <div class="cart-head-title" style="margin-bottom:18px;">ملخص الطلب</div>
        <div class="cart-line"><span>الإجمالي الفرعي</span><span>${money(cartTotal())}</span></div>
        <div class="cart-line"><span>الشحن</span><span>${money(CONFIG.shippingFee)}</span></div>
        <div class="cart-total"><span>الإجمالي</span><span>${money(cartTotal() + CONFIG.shippingFee)}</span></div>
        <a href="checkout.html" class="btn btn-primary btn-block">إتمام الطلب الآن</a>
        <a href="products.html" class="btn btn-outline btn-block" style="margin-top:10px;">متابعة التسوق</a>
      </div>
    </div>
  `;

  document.querySelectorAll('[data-inc]').forEach(b => b.addEventListener('click', () => {
    cart[b.dataset.inc].qty += 1; saveCart(); renderCartPage();
  }));
  document.querySelectorAll('[data-dec]').forEach(b => b.addEventListener('click', () => {
    const i = b.dataset.dec;
    cart[i].qty = Math.max(1, cart[i].qty - 1); saveCart(); renderCartPage();
  }));
  document.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
    cart.splice(b.dataset.remove, 1); saveCart(); renderCartPage();
  }));
}

document.addEventListener('DOMContentLoaded', () => {
  initShared();
  renderCartPage();
});
