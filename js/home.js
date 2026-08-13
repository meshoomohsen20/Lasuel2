// ============================================
// Laseul — Landing page logic (category carousel + new arrivals)
// ============================================

function buildCategoryCards(products) {
  const seen = new Map();
  products.forEach(p => {
    if (!seen.has(p.category)) {
      seen.set(p.category, { name: p.category, image: p.image, count: 1 });
    } else {
      seen.get(p.category).count += 1;
    }
  });
  return Array.from(seen.values());
}

function renderCategoryCarousel(products) {
  const wrap = document.getElementById('catCarousel');
  const cards = buildCategoryCards(products);

  if (cards.length === 0) {
    wrap.innerHTML = `<p style="padding:20px; color:var(--ink-soft);">لسه مفيش تصنيفات مضافة</p>`;
    return;
  }

  wrap.innerHTML = cards.map(c => `
    <a class="cat-card" href="products.html?category=${encodeURIComponent(c.name)}">
      <div class="cat-card-media">
        <img src="${c.image}" alt="${c.name}" loading="lazy">
      </div>
      <div class="cat-card-overlay">
        <span class="cat-card-eyebrow">تشكيلة (${c.count})</span>
        <div class="cat-card-name">${c.name}</div>
        <div class="cat-card-cta">تسوقي الآن ›</div>
      </div>
    </a>
  `).join('');
}

function initCarouselArrows() {
  const wrap = document.getElementById('catCarousel');
  const prev = document.getElementById('catCarouselPrev');
  const next = document.getElementById('catCarouselNext');
  if (!wrap || !prev || !next) return;

  const scrollAmount = () => Math.min(wrap.clientWidth * 0.8, 600);
  prev.addEventListener('click', () => wrap.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));
  next.addEventListener('click', () => wrap.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));
}

function renderNewArrivals(products) {
  const grid = document.getElementById('newArrivalsGrid');
  const latest = products.slice(0, 8); // المنتجات مرتّبة الأحدث أولًا من fetchAllProducts

  if (latest.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--ink-soft); padding:40px 0;">لسه مفيش منتجات مضافة</p>`;
    return;
  }

  grid.innerHTML = latest.map(p => `
    <a class="product-card" href="product.html?id=${p.id}">
      <div class="product-media">
        <img src="${p.image}" alt="${p.name}" loading="lazy">
        ${p.oldPrice ? `<span class="product-badge">خصم</span>` : ''}
        <div class="quick-add">عرض المنتج</div>
      </div>
      <div class="product-cat">${p.category}</div>
      <div class="product-name">${p.name}</div>
      <div class="product-price">
        ${money(p.price)}
        ${p.oldPrice ? `<span class="price-old">${money(p.oldPrice)}</span>` : ''}
      </div>
    </a>
  `).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  initShared();
  const products = await fetchAllProducts();
  renderCategoryCarousel(products);
  initCarouselArrows();
  renderNewArrivals(products);
});
