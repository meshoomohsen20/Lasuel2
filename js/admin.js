// ============================================
// Laseul — Admin panel logic
// ============================================

let editingProductId = null;
let existingCoverUrl = '';
let existingExtraUrls = [];
let allAdminProducts = [];
let adminCurrentPage = 1;
const ADMIN_PAGE_SIZE = 20;

// ============ Auth ============
async function checkSession() {
  const { data } = await supabaseClient.auth.getSession();
  if (data.session) {
    showDashboard(data.session.user.email);
  } else {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('dashboardScreen').style.display = 'none';
}

function showDashboard(email) {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'block';
  document.getElementById('adminEmail').textContent = email;
  loadProductsTable();
  loadPixelsTable();
}

async function handleLogin(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const errorEl = document.getElementById('loginError');
  errorEl.style.display = 'none';

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email: fd.get('email'),
    password: fd.get('password')
  });

  if (error) {
    errorEl.textContent = 'بيانات الدخول غير صحيحة';
    errorEl.style.display = 'block';
    return;
  }

  showDashboard(data.user.email);
}

async function handleLogout(e) {
  e.preventDefault();
  await supabaseClient.auth.signOut();
  showLogin();
}

// ============ Products table ============
async function loadProductsTable() {
  const list = document.getElementById('adminProductsList');
  list.innerHTML = `<div class="admin-empty">جاري التحميل...</div>`;

  allAdminProducts = await fetchAllProducts();
  adminCurrentPage = 1;
  renderAdminProductsPage();
}

function renderAdminProductsPage() {
  const list = document.getElementById('adminProductsList');

  if (allAdminProducts.length === 0) {
    list.innerHTML = `<div class="admin-empty">لسه مفيش منتجات — دوسي "إضافة منتج"</div>`;
    renderAdminPagination(0);
    return;
  }

  const totalPages = Math.max(1, Math.ceil(allAdminProducts.length / ADMIN_PAGE_SIZE));
  if (adminCurrentPage > totalPages) adminCurrentPage = totalPages;

  const start = (adminCurrentPage - 1) * ADMIN_PAGE_SIZE;
  const pageItems = allAdminProducts.slice(start, start + ADMIN_PAGE_SIZE);

  list.innerHTML = pageItems.map(p => `
    <div class="admin-row">
      <img src="${p.image}" alt="${p.name}">
      <span>${p.name}</span>
      <span>${p.category}</span>
      <span>${money(p.price)}</span>
      <div class="admin-row-actions">
        <button class="edit-btn" data-edit="${p.id}">تعديل</button>
        <button class="delete-btn" data-delete="${p.id}">حذف</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openProductForm(btn.dataset.edit)));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteProduct(btn.dataset.delete)));

  renderAdminPagination(totalPages);
}

function renderAdminPagination(totalPages) {
  const el = document.getElementById('adminPagination');
  if (!el) return;

  if (totalPages <= 1) {
    el.innerHTML = '';
    return;
  }

  let buttons = `<button class="page-btn page-nav" data-page="${adminCurrentPage - 1}" ${adminCurrentPage === 1 ? 'disabled' : ''}>‹</button>`;

  for (let i = 1; i <= totalPages; i++) {
    const isEdge = i === 1 || i === totalPages;
    const isNear = Math.abs(i - adminCurrentPage) <= 1;
    if (isEdge || isNear) {
      buttons += `<button class="page-btn ${i === adminCurrentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (Math.abs(i - adminCurrentPage) === 2) {
      buttons += `<span class="page-dots">…</span>`;
    }
  }

  buttons += `<button class="page-btn page-nav" data-page="${adminCurrentPage + 1}" ${adminCurrentPage === totalPages ? 'disabled' : ''}>›</button>`;

  el.innerHTML = buttons;

  el.querySelectorAll('.page-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = Number(btn.dataset.page);
      if (page < 1 || page > totalPages || page === adminCurrentPage) return;
      adminCurrentPage = page;
      renderAdminProductsPage();
    });
  });
}

// ============ Image upload helpers ============
async function uploadImageFile(file, productIdHint) {
  const ext = file.name.split('.').pop();
  const safeId = (productIdHint || 'product').replace(/[^a-zA-Z0-9-]/g, '');
  const path = `${safeId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabaseClient.storage.from('product-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) throw error;

  const { data } = supabaseClient.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

function resetImagePreviews() {
  document.getElementById('coverImagePreviewWrap').style.display = 'none';
  document.getElementById('extraImagesPreviewWrap').innerHTML = '';
  document.getElementById('fieldImageUrl').value = '';
  document.getElementById('fieldImagesUrls').value = '';
  existingCoverUrl = '';
  existingExtraUrls = [];
}

function showCoverPreview(url) {
  document.getElementById('coverImagePreviewWrap').style.display = 'block';
  document.getElementById('coverImagePreview').src = url;
}

function showExtraPreviews(urls) {
  document.getElementById('extraImagesPreviewWrap').innerHTML = urls.map(u =>
    `<img src="${u}" style="width:56px; height:70px; object-fit:cover; border-radius:4px;">`
  ).join('');
}

// ============ Add / Edit form ============
async function openProductForm(id) {
  const form = document.getElementById('productForm');
  form.reset();
  document.getElementById('formError').style.display = 'none';
  resetImagePreviews();
  resetAdminReviewForm();

  const reviewsWrap = document.getElementById('reviewsManagerWrap');

  if (id) {
    editingProductId = id;
    document.getElementById('productModalTitle').textContent = 'تعديل المنتج';
    document.getElementById('fieldId').disabled = true;
    reviewsWrap.style.display = 'block';

    const p = await fetchProductById(id);
    if (p) {
      form.id.value = p.id;
      form.name.value = p.name;
      form.category.value = p.category;
      form.price.value = p.price;
      form.old_price.value = p.oldPrice || '';
      form.colors.value = p.colors.join(', ');
      form.sizes.value = p.sizes.join(', ');
      form.description.value = p.description || '';

      existingCoverUrl = p.image;
      existingExtraUrls = (p.images || []).filter(i => i !== p.image);
      showCoverPreview(existingCoverUrl);
      showExtraPreviews(existingExtraUrls);
    }

    loadAdminReviewsList(id);
  } else {
    editingProductId = null;
    document.getElementById('productModalTitle').textContent = 'إضافة منتج';
    document.getElementById('fieldId').disabled = false;
    reviewsWrap.style.display = 'none';
  }

  document.getElementById('productModalOverlay').style.display = 'flex';
}

function closeProductForm() {
  document.getElementById('productModalOverlay').style.display = 'none';
}

function splitList(str) {
  return str.split(',').map(s => s.trim()).filter(Boolean);
}

async function handleProductSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const errorEl = document.getElementById('formError');
  const uploadStatus = document.getElementById('uploadStatus');
  errorEl.style.display = 'none';

  const id = editingProductId || fd.get('id').trim();
  const coverFile = document.getElementById('coverImageInput').files[0];
  const extraFiles = Array.from(document.getElementById('extraImagesInput').files);

  if (!coverFile && !existingCoverUrl) {
    errorEl.textContent = 'اختاري صورة غلاف للمنتج';
    errorEl.style.display = 'block';
    return;
  }

  const saveBtn = document.getElementById('saveProductBtn');
  saveBtn.disabled = true;

  try {
    let coverUrl = existingCoverUrl;
    if (coverFile) {
      uploadStatus.style.display = 'block';
      uploadStatus.textContent = 'جاري رفع صورة الغلاف...';
      coverUrl = await uploadImageFile(coverFile, id);
    }

    let allExtraUrls = [...existingExtraUrls];
    if (extraFiles.length > 0) {
      uploadStatus.style.display = 'block';
      for (let i = 0; i < extraFiles.length; i++) {
        uploadStatus.textContent = `جاري رفع صورة ${i + 1} من ${extraFiles.length}...`;
        const url = await uploadImageFile(extraFiles[i], id);
        allExtraUrls.push(url);
      }
    }

    uploadStatus.textContent = 'جاري الحفظ...';

    const payload = {
      id,
      name: fd.get('name').trim(),
      category: fd.get('category').trim(),
      price: parseFloat(fd.get('price')),
      old_price: fd.get('old_price') ? parseFloat(fd.get('old_price')) : null,
      colors: splitList(fd.get('colors')),
      sizes: splitList(fd.get('sizes')),
      image: coverUrl,
      images: [coverUrl, ...allExtraUrls],
      description: fd.get('description').trim()
    };

    const { error } = editingProductId
      ? await supabaseClient.from('laseul_products').update(payload).eq('id', editingProductId)
      : await supabaseClient.from('laseul_products').insert(payload);

    if (error) throw error;

    showToast(editingProductId ? 'اتحدّث المنتج ✓' : 'اتضاف المنتج ✓');
    closeProductForm();
    loadProductsTable();
  } catch (err) {
    console.error(err);
    errorEl.textContent = (err.message || '').includes('duplicate') ? 'كود المنتج ده مستخدم قبل كده' : 'حصل خطأ، حاولي تاني';
    errorEl.style.display = 'block';
  } finally {
    saveBtn.disabled = false;
    uploadStatus.style.display = 'none';
  }
}

async function deleteProduct(id) {
  if (!confirm('متأكدة إنك عايزة تمسحي المنتج ده؟')) return;
  const { error } = await supabaseClient.from('laseul_products').delete().eq('id', id);
  if (error) {
    showToast('حصل خطأ في الحذف');
    return;
  }
  showToast('اتمسح المنتج');
  loadProductsTable();
}

// ============ Pixels management ============
const PLATFORM_LABELS = { meta: 'Meta', tiktok: 'TikTok' };

async function loadPixelsTable() {
  const list = document.getElementById('adminPixelsList');
  list.innerHTML = `<div class="admin-empty">جاري التحميل...</div>`;

  const { data, error } = await supabaseClient.from('laseul_pixels').select('*').order('created_at', { ascending: false });

  if (error || !data || data.length === 0) {
    list.innerHTML = `<div class="admin-empty">لسه مفيش بيكسلات مضافة</div>`;
    return;
  }

  list.innerHTML = data.map(p => `
    <div class="admin-row-pixel">
      <span class="pixel-platform-badge">${PLATFORM_LABELS[p.platform] || p.platform}</span>
      <span>${p.pixel_id}</span>
      <span>${p.label || '—'}</span>
      <button class="delete-btn" data-delete-pixel="${p.id}" style="justify-self:start; font-size:12px; font-weight:700; text-decoration:underline; color:#B23A2F;">حذف</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-delete-pixel]').forEach(btn =>
    btn.addEventListener('click', () => deletePixel(btn.dataset.deletePixel))
  );
}

function openPixelForm() {
  document.getElementById('pixelForm').reset();
  document.getElementById('pixelFormError').style.display = 'none';
  document.getElementById('pixelModalOverlay').style.display = 'flex';
}

function closePixelForm() {
  document.getElementById('pixelModalOverlay').style.display = 'none';
}

async function handlePixelSubmit(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const errorEl = document.getElementById('pixelFormError');
  errorEl.style.display = 'none';

  const saveBtn = document.getElementById('savePixelBtn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'جاري الحفظ...';

  const { error } = await supabaseClient.from('laseul_pixels').insert({
    platform: fd.get('platform'),
    pixel_id: fd.get('pixel_id').trim(),
    label: fd.get('label').trim() || null
  });

  saveBtn.disabled = false;
  saveBtn.textContent = 'حفظ';

  if (error) {
    errorEl.textContent = 'حصل خطأ، حاولي تاني';
    errorEl.style.display = 'block';
    return;
  }

  showToast('اتضاف البيكسل ✓ — هيشتغل في الموقع فورًا');
  closePixelForm();
  loadPixelsTable();
}

async function deletePixel(id) {
  if (!confirm('متأكدة إنك عايزة تمسحي البيكسل ده؟')) return;
  const { error } = await supabaseClient.from('laseul_pixels').delete().eq('id', id);
  if (error) {
    showToast('حصل خطأ في الحذف');
    return;
  }
  showToast('اتمسح البيكسل');
  loadPixelsTable();
}

// ============ Product reviews management ============
function adminStarsHtml(rating) {
  let html = '<span class="stars-display" style="font-size:13px;">';
  for (let i = 1; i <= 5; i++) html += i <= rating ? '★' : '<span class="star-empty">★</span>';
  html += '</span>';
  return html;
}

function resetAdminReviewForm() {
  const picker = document.getElementById('adminStarPicker');
  if (!picker) return;
  picker.dataset.rating = '0';
  picker.querySelectorAll('button').forEach(b => b.classList.remove('filled'));
  document.getElementById('adminReviewName').value = '';
  document.getElementById('adminReviewComment').value = '';
}

async function loadAdminReviewsList(productId) {
  const list = document.getElementById('adminReviewsList');
  list.innerHTML = `<div class="admin-hint">جاري التحميل...</div>`;

  const reviews = await fetchProductReviews(productId);

  if (reviews.length === 0) {
    list.innerHTML = `<div class="admin-hint">لسه مفيش تقييمات على المنتج ده</div>`;
    return;
  }

  list.innerHTML = reviews.map(r => `
    <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:10px; padding:10px 0; border-bottom:1px solid var(--line);">
      <div>
        <div style="font-weight:700; font-size:13px;">${r.reviewer_name} ${r.is_seed ? '<span style="color:var(--ink-soft); font-weight:400;">(مضافة يدويًا)</span>' : ''}</div>
        ${adminStarsHtml(r.rating)}
        ${r.comment ? `<div style="font-size:12px; color:var(--ink-soft); margin-top:4px;">${r.comment}</div>` : ''}
      </div>
      <button data-delete-review="${r.id}" style="font-size:12px; color:#B23A2F; text-decoration:underline; flex:none;">حذف</button>
    </div>
  `).join('');

  list.querySelectorAll('[data-delete-review]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('متأكدة إنك عايزة تمسحي التقييم ده؟')) return;
      await supabaseClient.from('laseul_reviews').delete().eq('id', btn.dataset.deleteReview);
      loadAdminReviewsList(productId);
    });
  });
}

async function handleAdminAddReview() {
  if (!editingProductId) return;
  const picker = document.getElementById('adminStarPicker');
  const rating = Number(picker.dataset.rating);
  if (!rating) {
    showToast('اختاري عدد النجوم الأول');
    return;
  }
  const name = document.getElementById('adminReviewName').value.trim() || 'عميلة';
  const comment = document.getElementById('adminReviewComment').value.trim();

  const btn = document.getElementById('adminAddReviewBtn');
  btn.disabled = true;

  const { error } = await supabaseClient.from('laseul_reviews').insert({
    product_id: editingProductId,
    rating,
    reviewer_name: name,
    comment: comment || null,
    is_seed: true
  });

  btn.disabled = false;

  if (error) {
    showToast('حصل خطأ، حاولي تاني');
    return;
  }

  showToast('اتضاف التقييم ✓');
  resetAdminReviewForm();
  loadAdminReviewsList(editingProductId);
}

// ============ Init ============
document.addEventListener('DOMContentLoaded', () => {
  checkSession();
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('addProductBtn').addEventListener('click', () => openProductForm(null));
  document.getElementById('cancelFormBtn').addEventListener('click', closeProductForm);
  document.getElementById('productForm').addEventListener('submit', handleProductSubmit);

  document.getElementById('addPixelBtn').addEventListener('click', openPixelForm);
  document.getElementById('cancelPixelFormBtn').addEventListener('click', closePixelForm);
  document.getElementById('pixelForm').addEventListener('submit', handlePixelSubmit);

  document.getElementById('coverImageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) showCoverPreview(URL.createObjectURL(file));
  });
  document.getElementById('extraImagesInput').addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length) showExtraPreviews([...existingExtraUrls, ...files.map(f => URL.createObjectURL(f))]);
  });

  const adminStarPicker = document.getElementById('adminStarPicker');
  const adminStarButtons = adminStarPicker.querySelectorAll('button');
  adminStarButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.star);
      adminStarPicker.dataset.rating = val;
      adminStarButtons.forEach(b => b.classList.toggle('filled', Number(b.dataset.star) <= val));
    });
  });
  document.getElementById('adminAddReviewBtn').addEventListener('click', handleAdminAddReview);
});
