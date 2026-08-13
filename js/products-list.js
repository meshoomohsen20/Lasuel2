// ============================================
// Laseul — Home page logic (grid + categories + pagination)
// ============================================

let activeCategory = 'الكل';
let currentPage = 1;
const PAGE_SIZE = 20;

function renderCategories() {
  const cats = ['الكل', ...new Set(PRODUCTS.map(p => p.category))];
  const strip = document.getElementById('catStrip');
  strip.innerHTML = cats.map(c =>
    `<button class="cat-chip ${c === activeCategory ? 'active' : ''}" data-cat="${c}">${c}</button>`
  ).join('');
  strip.querySelectorAll('.cat-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.dataset.cat;
      currentPage = 1;
      renderCategories();
      renderProducts();
    });
  });
}

function getFilteredProducts() {
  return activeCategory === 'الكل' ? PRODUCTS : PRODUCTS.filter(p => p.category === activeCategory);
}

function renderProducts() {
  const grid = document.getElementById('productGrid');

  if (PRODUCTS.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--ink-soft); padding:40px 0;">لسه مفيش منتجات مضافة</p>`;
    renderPagination(0);
    return;
  }

  const filtered = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  if (pageItems.length === 0) {
    grid.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--ink-soft); padding:40px 0;">لا يوجد منتجات في هذا التصنيف</p>`;
    renderPagination(0);
    return;
  }

  grid.innerHTML = pageItems.map(p => `
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

  renderPagination(totalPages);

  // ارجع لأول الصفحة بصريًا لما تتغير الصفحة
  const shopSection = document.getElementById('shop');
  if (shopSection) shopSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderPagination(totalPages) {
  const el = document.getElementById('pagination');
  if (!el) return;

  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  let buttons = '';

  buttons += `<button class="page-btn page-nav" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    // إظهار أول صفحة وآخر صفحة والصفحات القريبة من الحالية، وباقي علامة "..."
    const isEdge = i === 1 || i === totalPages;
    const isNear = Math.abs(i - currentPage) <= 1;
    if (isEdge || isNear) {
      buttons += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - currentPage) === 2) {
      buttons += `<span class="page-dots">…</span>`;
    }
  }

  buttons += `<button class="page-btn page-nav" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>`;

  el.innerHTML = buttons;

  el.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = Number(btn.dataset.page);
      if (page < 1 || page > totalPages || page === currentPage) return;
      currentPage = page;
      renderProducts();
    });
  });
}

function renderGridLoading() {
  document.getElementById('productGrid').innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--ink-soft); padding:40px 0;">جاري تحميل المنتجات...</p>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  initShared();
  renderGridLoading();
  PRODUCTS = await fetchAllProducts();

  const params = new URLSearchParams(window.location.search);
  const catFromUrl = params.get('category');
  if (catFromUrl && PRODUCTS.some(p => p.category === catFromUrl)) {
    activeCategory = catFromUrl;
  }

  renderCategories();
  renderProducts();
});
