// ============================================
// Laseul — Product detail page logic
// ============================================

let pdpState = { product: null, activeImage: 0, color: null, size: null, qty: 1 };
let pdpReviews = [];

function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

function renderBreadcrumb(p) {
  document.getElementById('breadcrumb').innerHTML = `
    <a href="index.html">الرئيسية</a>
    <span class="sep">/</span>
    <a href="products.html?category=${encodeURIComponent(p.category)}">${p.category}</a>
    <span class="sep">/</span>
    <span class="current">${p.name}</span>
  `;
}

function renderStarsHtml(avg, size) {
  const rounded = Math.round(avg);
  let html = `<span class="stars-display" style="${size ? `font-size:${size}px` : ''}">`;
  for (let i = 1; i <= 5; i++) {
    html += i <= rounded ? '★' : '<span class="star-empty">★</span>';
  }
  html += '</span>';
  return html;
}

function renderRatingSummary(reviews) {
  const { avg, count } = summarizeReviews(reviews);
  if (count === 0) {
    return `<div class="rating-summary"><span class="stars-display">★★★★★</span> <span>لسه مفيش تقييمات</span></div>`;
  }
  return `
    <div class="rating-summary">
      ${renderStarsHtml(avg)}
      <span>${avg.toFixed(1)}</span>
      <span class="rating-count">(${count} تقييم)</span>
    </div>
  `;
}

function renderPdp() {
  const p = pdpState.product;
  document.title = `${p.name} | Laseul`;

  document.getElementById('pdpGrid').innerHTML = `
    <div class="pdp-gallery">
      <div class="pdp-gallery-main">
        <img src="${p.images[pdpState.activeImage]}" alt="${p.name}" id="pdpMainImg">
      </div>
      ${p.images.length > 1 ? `
        <div class="pdp-thumbs">
          ${p.images.map((img, idx) => `
            <div class="pdp-thumb ${idx === pdpState.activeImage ? 'active' : ''}" data-thumb="${idx}">
              <img src="${img}" alt="${p.name}">
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>

    <div class="pdp-info">
      <div class="pdp-cat">${p.category}</div>
      <h1 class="pdp-title">${p.name}</h1>
      <div id="pdpRatingSummary">${renderRatingSummary(pdpReviews)}</div>
      <div class="pdp-price">${money(p.price)} ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>` : ''}</div>
      <p class="pdp-desc">${p.description}</p>

      <div class="option-group">
        <label class="option-label">اللون</label>
        <div class="option-pills" id="pdpColors">
          ${p.colors.map(c => `<button class="option-pill ${c === pdpState.color ? 'selected' : ''}" data-color="${c}">${c}</button>`).join('')}
        </div>
      </div>

      <div class="option-group">
        <label class="option-label">المقاس</label>
        <div class="option-pills" id="pdpSizes">
          ${p.sizes.map(s => `<button class="option-pill ${s === pdpState.size ? 'selected' : ''}" data-size="${s}">${s}</button>`).join('')}
        </div>
      </div>

      <div class="qty-row">
        <button class="qty-btn" id="pdpQtyMinus">−</button>
        <span id="pdpQtyVal">${pdpState.qty}</span>
        <button class="qty-btn" id="pdpQtyPlus">+</button>
      </div>

      <div class="pdp-actions">
        <button class="btn btn-primary" id="pdpAddToCart">أضيفي للسلة — ${money(p.price)}</button>
      </div>

      <div class="pdp-note">
        <div class="pdp-note-item">✓ الدفع عند الاستلام</div>
        <div class="pdp-note-item">✓ توصيل 2-4 أيام</div>
        <div class="pdp-note-item">✓ استبدال خلال 14 يوم</div>
      </div>
    </div>
  `;

  document.querySelectorAll('[data-thumb]').forEach(el => el.addEventListener('click', () => {
    pdpState.activeImage = Number(el.dataset.thumb);
    renderPdp();
  }));
  document.querySelectorAll('[data-color]').forEach(el => el.addEventListener('click', () => {
    pdpState.color = el.dataset.color;
    renderPdp();
  }));
  document.querySelectorAll('[data-size]').forEach(el => el.addEventListener('click', () => {
    pdpState.size = el.dataset.size;
    renderPdp();
  }));
  document.getElementById('pdpQtyMinus').addEventListener('click', () => {
    pdpState.qty = Math.max(1, pdpState.qty - 1);
    renderPdp();
  });
  document.getElementById('pdpQtyPlus').addEventListener('click', () => {
    pdpState.qty += 1;
    renderPdp();
  });
  document.getElementById('pdpAddToCart').addEventListener('click', () => {
    addToCart(p, pdpState.color, pdpState.size, pdpState.qty);
  });
}

function renderReviewsSection() {
  const el = document.getElementById('reviewsSection');
  const { avg, count } = summarizeReviews(pdpReviews);

  const listHtml = pdpReviews.length === 0
    ? `<div class="reviews-empty">لسه مفيش تقييمات على المنتج ده — كوني أول وحدة تقيّمي!</div>`
    : pdpReviews.map(r => `
        <div class="review-item">
          <div class="review-item-head">
            <div>
              <div class="review-item-name">${escapeHtml(r.reviewer_name)}</div>
              ${renderStarsHtml(r.rating, 14)}
            </div>
            <span class="review-item-date">${new Date(r.created_at).toLocaleDateString('ar-EG')}</span>
          </div>
          ${r.comment ? `<div class="review-item-comment">${escapeHtml(r.comment)}</div>` : ''}
        </div>
      `).join('');

  el.innerHTML = `
    <div class="reviews-header">
      <h3>تقييمات العميلات</h3>
      <div class="reviews-overview">
        ${count > 0 ? `<span class="avg-number">${avg.toFixed(1)}</span>${renderStarsHtml(avg, 18)}<span style="color:var(--ink-soft); font-size:13px;">(${count})</span>` : ''}
      </div>
    </div>
    ${listHtml}
  `;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

async function renderRelated(p) {
  const all = await fetchAllProducts();
  const related = all.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4);
  const fallback = related.length > 0 ? related : all.filter(x => x.id !== p.id).slice(0, 4);

  document.getElementById('relatedGrid').innerHTML = fallback.map(rp => `
    <a class="product-card" href="product.html?id=${rp.id}">
      <div class="product-media">
        <img src="${rp.image}" alt="${rp.name}" loading="lazy">
        ${rp.oldPrice ? `<span class="product-badge">خصم</span>` : ''}
      </div>
      <div class="product-cat">${rp.category}</div>
      <div class="product-name">${rp.name}</div>
      <div class="product-price">
        ${money(rp.price)}
        ${rp.oldPrice ? `<span class="price-old">${money(rp.oldPrice)}</span>` : ''}
      </div>
    </a>
  `).join('');
}

async function initProductPage() {
  const id = getProductIdFromUrl();
  const p = await fetchProductById(id);

  if (!p) {
    document.getElementById('pdpGrid').innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 0;">
        <p style="margin-bottom:16px; color:var(--ink-soft);">المنتج غير موجود</p>
        <a href="index.html" class="btn btn-outline">رجوع للمتجر</a>
      </div>
    `;
    return;
  }

  pdpState = { product: p, activeImage: 0, color: p.colors[0], size: p.sizes[0], qty: 1 };
  renderBreadcrumb(p);
  renderPdp();

  pdpReviews = await fetchProductReviews(p.id);
  renderPdp(); // إعادة رسم عشان يظهر متوسط التقييم بعد ما يوصل
  renderReviewsSection();

  renderRelated(p);
}

document.addEventListener('DOMContentLoaded', () => {
  initShared();
  initProductPage();
});
