// ============================================
// Laseul — Order success page: review prompts
// ============================================

function renderReviewPrompts() {
  const wrap = document.getElementById('reviewPromptsWrap');
  const raw = sessionStorage.getItem('laseul_last_order_items');
  if (!raw) return;

  let items = [];
  try { items = JSON.parse(raw); } catch (e) { return; }
  if (!items.length) return;

  const heading = document.createElement('div');
  heading.style.cssText = 'text-align:center; margin:34px 0 18px;';
  heading.innerHTML = `<div style="font-family:var(--font-display); font-style:italic; font-size:20px;">قيّمي اللي اشتريتيه</div>`;
  wrap.appendChild(heading);

  items.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'review-prompt-card';
    card.innerHTML = `
      <div class="review-prompt-head">
        <img class="review-prompt-img" src="${item.image}" alt="${item.name}">
        <div class="review-prompt-name">${item.name}</div>
      </div>
      <div id="reviewFormBody-${idx}">
        <div class="star-picker" id="starPicker-${idx}" data-rating="0">
          <button type="button" data-star="5">★</button>
          <button type="button" data-star="4">★</button>
          <button type="button" data-star="3">★</button>
          <button type="button" data-star="2">★</button>
          <button type="button" data-star="1">★</button>
        </div>
        <div class="form-group" style="margin-top:12px;">
          <input class="form-input" id="reviewName-${idx}" placeholder="اسمك (اختياري)">
        </div>
        <div class="form-group">
          <textarea class="form-textarea" id="reviewComment-${idx}" rows="2" placeholder="رأيك في المنتج (اختياري)"></textarea>
        </div>
        <button class="btn btn-outline btn-block" id="reviewSubmit-${idx}">إرسال التقييم</button>
      </div>
    `;
    wrap.appendChild(card);

    const starButtons = card.querySelectorAll(`#starPicker-${idx} button`);
    starButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const val = Number(btn.dataset.star);
        card.querySelector(`#starPicker-${idx}`).dataset.rating = val;
        starButtons.forEach(b => {
          b.classList.toggle('filled', Number(b.dataset.star) <= val);
        });
      });
    });

    card.querySelector(`#reviewSubmit-${idx}`).addEventListener('click', async () => {
      const rating = Number(card.querySelector(`#starPicker-${idx}`).dataset.rating);
      if (!rating) {
        showToast('اختاري عدد النجوم الأول');
        return;
      }
      const name = card.querySelector(`#reviewName-${idx}`).value;
      const comment = card.querySelector(`#reviewComment-${idx}`).value;

      const btn = card.querySelector(`#reviewSubmit-${idx}`);
      btn.disabled = true;
      btn.textContent = 'جاري الإرسال...';

      const ok = await addReview(item.id, rating, name, comment);

      if (ok) {
        card.querySelector(`#reviewFormBody-${idx}`).innerHTML = `<div class="review-submitted-note">✓ شكرًا على تقييمك</div>`;
      } else {
        btn.disabled = false;
        btn.textContent = 'إرسال التقييم';
        showToast('حصل خطأ، حاولي تاني');
      }
    });
  });

  sessionStorage.removeItem('laseul_last_order_items');
}

document.addEventListener('DOMContentLoaded', async () => {
  await initShared();
  renderReviewPrompts();
});
