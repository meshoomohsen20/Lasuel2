// ============================================
// Laseul Store — Shared logic (cart data + pixels)
// يُستخدم في كل صفحات الموقع
// ============================================

let cart = JSON.parse(localStorage.getItem('laseul_cart') || '[]');
let ACTIVE_META_PIXELS = [];
let ACTIVE_TIKTOK_PIXELS = [];

const money = (n) => `${n.toLocaleString('ar-EG')} ${CONFIG.currency}`;

function saveCart() {
  localStorage.setItem('laseul_cart', JSON.stringify(cart));
  renderCartCount();
  renderFloatingCartBar();
}

function renderCartCount() {
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById('cartCount');
  if (!el) return;
  el.textContent = count;
  el.style.display = count > 0 ? 'flex' : 'none';
}

function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}

function findProduct(id) {
  return PRODUCTS.find(p => p.id === id);
}

function cartTotal() {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

// ============ Add to cart (يُستخدم من صفحة المنتج) ============
function addToCart(product, color, size, qty) {
  const existing = cart.find(i => i.id === product.id && i.color === color && i.size === size);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, color, size, qty });
  }
  saveCart();
  openMiniCartPopup();
  trackEvent('AddToCart', { content_name: product.name, value: product.price, currency: 'EGP' });
}

// ============ Mini cart popup (بيظهر بعد "أضيفي للسلة") ============
function closeMiniCartPopup() {
  const el = document.getElementById('miniCartOverlay');
  if (el) el.remove();
}

function openMiniCartPopup() {
  closeMiniCartPopup(); // احتياطي لو كان مفتوح قبل كده

  const itemsHtml = cart.map(i => `
    <div class="cart-page-item" style="padding:14px 0;">
      <div class="cart-page-item-media" style="width:64px; height:80px;">
        <img src="${i.image}" alt="${i.name}">
      </div>
      <div class="cart-page-item-info">
        <span class="cart-page-item-name" style="font-size:13px;">${i.name}</span>
        <div class="cart-item-opts">${i.color} · ${i.size} · × ${i.qty}</div>
        <div style="font-weight:700; font-size:13px; margin-top:4px;">${money(i.price * i.qty)}</div>
      </div>
    </div>
  `).join('');

  const wrap = document.createElement('div');
  wrap.className = 'mini-cart-overlay';
  wrap.id = 'miniCartOverlay';
  wrap.innerHTML = `
    <div class="mini-cart-popup">
      <div class="mini-cart-head">
        <div class="mini-cart-head-title"><span class="check">✓</span> اتضاف للسلة</div>
        <button class="mini-cart-close" id="miniCartCloseBtn">✕</button>
      </div>
      <div class="mini-cart-items">${itemsHtml}</div>
      <div class="mini-cart-footer">
        <div class="cart-line"><span>الإجمالي (${cart.reduce((s, i) => s + i.qty, 0)} قطعة)</span><span>${money(cartTotal())}</span></div>
        <button class="btn btn-primary" id="miniCartCheckoutBtn" style="margin-top:12px;">المتابعة للشيك أوت</button>
        <button class="btn btn-outline" id="miniCartContinueBtn">متابعة التسوق</button>
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  wrap.addEventListener('click', (e) => { if (e.target === wrap) closeMiniCartPopup(); });
  document.getElementById('miniCartCloseBtn').addEventListener('click', closeMiniCartPopup);
  document.getElementById('miniCartContinueBtn').addEventListener('click', closeMiniCartPopup);
  document.getElementById('miniCartCheckoutBtn').addEventListener('click', () => {
    window.location.href = 'checkout.html';
  });
}

// ============ Pixel tracking (يدعم أكتر من بيكسل لكل منصة) ============
function trackEvent(eventName, params) {
  try {
    if (window.fbq) window.fbq('track', eventName, params); // fbq بتبعت الحدث لكل البيكسلات المفعّلة تلقائيًا
    if (window.ttq) {
      const ttEvent = eventName === 'Purchase' ? 'CompletePayment' : eventName;
      ACTIVE_TIKTOK_PIXELS.forEach(id => {
        try { window.ttq.instance(id).track(ttEvent, params); } catch (e) { /* noop */ }
      });
    }
  } catch (e) { /* noop */ }
}

async function fetchActivePixels() {
  try {
    const { data, error } = await supabaseClient.from('laseul_pixels').select('*');
    if (error || !data) return { meta: [], tiktok: [] };
    return {
      meta: data.filter(p => p.platform === 'meta').map(p => p.pixel_id),
      tiktok: data.filter(p => p.platform === 'tiktok').map(p => p.pixel_id)
    };
  } catch (e) {
    return { meta: [], tiktok: [] };
  }
}

function injectMetaPixel(meta) {
  if (!meta || meta.length === 0 || window.fbq) return;
  const s = document.createElement('script');
  s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    ${meta.map(id => `fbq('init', '${id}');`).join('\n')}
    fbq('track', 'PageView');`;
  document.head.appendChild(s);
}

function injectTiktokPixel(tiktok) {
  if (!tiktok || tiktok.length === 0 || window.ttq) return;
  const s = document.createElement('script');
  s.innerHTML = `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
    ${tiktok.map(id => `ttq.load('${id}');`).join('\n')}
    }(window,document,'ttq');
    ${tiktok.map(id => `ttq.instance('${id}').page();`).join('\n')}`;
  document.head.appendChild(s);
}

// البيكسل بيتحفظ محليًا (cache) عشان يشتغل فورًا من أول لحظة في الزيارات الجاية،
// من غير ما يستنى رحلة الاتصال بالداتابيز كل مرة
async function injectPixels() {
  let usedCache = false;

  try {
    const cached = localStorage.getItem('laseul_pixel_cache');
    if (cached) {
      const parsed = JSON.parse(cached);
      if ((parsed.meta && parsed.meta.length) || (parsed.tiktok && parsed.tiktok.length)) {
        ACTIVE_META_PIXELS = parsed.meta || [];
        ACTIVE_TIKTOK_PIXELS = parsed.tiktok || [];
        injectMetaPixel(ACTIVE_META_PIXELS);
        injectTiktokPixel(ACTIVE_TIKTOK_PIXELS);
        usedCache = true;
      }
    }
  } catch (e) { /* noop */ }

  const fresh = await fetchActivePixels();
  try { localStorage.setItem('laseul_pixel_cache', JSON.stringify(fresh)); } catch (e) { /* noop */ }

  if (!usedCache) {
    ACTIVE_META_PIXELS = fresh.meta;
    ACTIVE_TIKTOK_PIXELS = fresh.tiktok;
    injectMetaPixel(fresh.meta);
    injectTiktokPixel(fresh.tiktok);
  }
}

// ============ Floating checkout bar (يظهر بس في صفحات التصفح) ============
function renderFloatingCartBar() {
  if (document.body.getAttribute('data-floating-cart') !== 'true') return;

  const existing = document.getElementById('floatingCartBar');

  if (cart.length === 0) {
    if (existing) existing.remove();
    document.body.classList.remove('has-floating-cart');
    return;
  }

  const count = cart.reduce((s, i) => s + i.qty, 0);
  const barHtml = `
    <div class="floating-cart-info">
      <strong>${count} ${count === 1 ? 'قطعة' : 'قطع'} في السلة</strong>
      <span>${money(cartTotal())}</span>
    </div>
    <a href="checkout.html" class="floating-cart-btn">إتمام الطلب ←</a>
  `;

  if (existing) {
    existing.innerHTML = barHtml;
  } else {
    const bar = document.createElement('div');
    bar.className = 'floating-cart-bar';
    bar.id = 'floatingCartBar';
    bar.innerHTML = barHtml;
    document.body.appendChild(bar);
  }
  document.body.classList.add('has-floating-cart');
}

// ============ Shared header wiring — call on every page ============
async function initShared() {
  document.title = document.title || `${CONFIG.storeName} | متجر ملابس حريمي`;
  const wa = document.getElementById('footerWhatsapp');
  if (wa) wa.textContent = `واتساب: ${CONFIG.whatsappNumber}`;
  renderCartCount();
  renderFloatingCartBar();
  await injectPixels();
}

function openWhatsapp() {
  window.open(`https://wa.me/${CONFIG.whatsappNumber}`, '_blank');
}
