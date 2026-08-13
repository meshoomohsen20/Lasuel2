// ============================================
// Laseul — Checkout page logic
// ============================================

function renderCheckoutPage() {
  const el = document.getElementById('checkoutPageContent');

  if (cart.length === 0) {
    el.innerHTML = `
      <div class="cart-page-empty">
        <div style="font-size:44px; margin-bottom:16px;">🤍</div>
        <p style="color:var(--ink-soft); margin-bottom:24px;">السلة فاضية، ارجعي اختاري منتجاتك الأول</p>
        <a href="products.html" class="btn btn-primary">تسوقي التشكيلة</a>
      </div>
    `;
    return;
  }

  const itemsSummary = cart.map(i => `
    <div class="checkout-mini-item">
      <img src="${i.image}" alt="${i.name}">
      <div>
        <div class="cart-page-item-name" style="font-size:13px;">${i.name}</div>
        <div class="cart-item-opts">${i.color} · ${i.size} · × ${i.qty}</div>
      </div>
      <div style="font-weight:700; font-size:13px;">${money(i.price * i.qty)}</div>
    </div>
  `).join('');

  el.innerHTML = `
    <div class="cart-page-grid">
      <div>
        <form id="checkoutForm">
          <div class="form-group">
            <label class="form-label">الاسم بالكامل</label>
            <input class="form-input" name="name" required placeholder="مثال: سارة أحمد">
          </div>
          <div class="form-group">
            <label class="form-label">رقم الموبايل</label>
            <input class="form-input" name="phone" required type="tel" placeholder="01xxxxxxxxx">
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">المحافظة</label>
              <input class="form-input" name="city" required placeholder="القاهرة">
            </div>
            <div class="form-group">
              <label class="form-label">المنطقة</label>
              <input class="form-input" name="area" required placeholder="مدينة نصر">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">العنوان بالتفصيل</label>
            <textarea class="form-textarea" name="address" rows="2" required placeholder="اسم الشارع، رقم العمارة، الدور..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">ملاحظات (اختياري)</label>
            <textarea class="form-textarea" name="notes" rows="2" placeholder="أي تفاصيل إضافية"></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-block">تأكيد الطلب — الدفع عند الاستلام</button>
        </form>
      </div>

      <div class="cart-page-summary">
        <div class="cart-head-title" style="margin-bottom:16px;">ملخص الطلب</div>
        <div class="checkout-mini-items">${itemsSummary}</div>
        <div class="cart-line"><span>الإجمالي الفرعي</span><span>${money(cartTotal())}</span></div>
        <div class="cart-line"><span>الشحن</span><span>${money(CONFIG.shippingFee)}</span></div>
        <div class="cart-total"><span>الإجمالي</span><span>${money(cartTotal() + CONFIG.shippingFee)}</span></div>
        <a href="cart.html" class="back-link" style="display:inline-flex;">→ تعديل السلة</a>
      </div>
    </div>
  `;

  document.getElementById('checkoutForm').addEventListener('submit', handleCheckoutSubmit);
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const order = {
    name: fd.get('name'),
    phone: fd.get('phone'),
    city: fd.get('city'),
    area: fd.get('area'),
    address: fd.get('address'),
    notes: fd.get('notes') || '',
    items: cart.map(i => `${i.name} (${i.color}/${i.size}) x${i.qty}`).join(' | '),
    subtotal: cartTotal(),
    shipping: CONFIG.shippingFee,
    total: cartTotal() + CONFIG.shippingFee,
    date: new Date().toISOString()
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = 'جاري إرسال الطلب...';

  // 1) يحاول يبعت للـ Google Sheet لو الرابط متظبط
  try {
    if (CONFIG.googleScriptUrl && CONFIG.googleScriptUrl !== 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      await fetch(CONFIG.googleScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order)
      });
    }
  } catch (err) {
    console.error('Google Sheet submit failed', err);
  }

  trackEvent('Purchase', { value: order.total, currency: 'EGP' });

  // 2) يحفظ تفاصيل آخر أوردر عشان صفحة النجاح تعرضها، ويفضّل رسالة واتساب كـ backup
  sessionStorage.setItem('laseul_last_order', JSON.stringify(order));
  sessionStorage.setItem('laseul_last_order_items', JSON.stringify(
    cart.map(i => ({ id: i.id, name: i.name, image: i.image }))
  ));

  const msg = `طلب جديد من Laseul%0A%0Aالاسم: ${order.name}%0Aالموبايل: ${order.phone}%0Aالمحافظة: ${order.city} - ${order.area}%0Aالعنوان: ${order.address}%0A%0Aالمنتجات:%0A${encodeURIComponent(order.items)}%0A%0Aالإجمالي: ${order.total} ${CONFIG.currency}%0Aملاحظات: ${order.notes || '-'}`;
  window.open(`https://wa.me/${CONFIG.whatsappNumber}?text=${msg}`, '_blank');

  cart = [];
  saveCart();
  window.location.href = 'order-success.html';
}

document.addEventListener('DOMContentLoaded', () => {
  initShared();
  renderCheckoutPage();
});
