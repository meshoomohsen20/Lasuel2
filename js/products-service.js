// ============================================
// Laseul — Products data layer (Supabase)
// ============================================

let PRODUCTS = []; // بتتملى ديناميكيًا من Supabase في كل صفحة

function mapRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    oldPrice: row.old_price ? Number(row.old_price) : null,
    colors: row.colors || [],
    sizes: row.sizes || [],
    image: row.image,
    images: (row.images && row.images.length) ? row.images : [row.image],
    description: row.description || ''
  };
}

async function fetchAllProducts() {
  const { data, error } = await supabaseClient
    .from('laseul_products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchAllProducts error', error);
    showToast('في مشكلة في تحميل المنتجات');
    return [];
  }
  return data.map(mapRow);
}

async function fetchProductById(id) {
  const { data, error } = await supabaseClient
    .from('laseul_products')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error || !data) {
    console.error('fetchProductById error', error);
    return null;
  }
  return mapRow(data);
}

// ============ Reviews ============
async function fetchProductReviews(productId) {
  const { data, error } = await supabaseClient
    .from('laseul_reviews')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    console.error('fetchProductReviews error', error);
    return [];
  }
  return data;
}

function summarizeReviews(reviews) {
  if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
  const total = reviews.reduce((s, r) => s + r.rating, 0);
  return { avg: total / reviews.length, count: reviews.length };
}

async function addReview(productId, rating, reviewerName, comment) {
  const { error } = await supabaseClient.from('laseul_reviews').insert({
    product_id: productId,
    rating,
    reviewer_name: reviewerName && reviewerName.trim() ? reviewerName.trim() : 'عميلة',
    comment: comment && comment.trim() ? comment.trim() : null,
    is_seed: false
  });
  return !error;
}
