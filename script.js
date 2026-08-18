// ===== Menu mobile =====
const burger = document.querySelector('.burger');
const navlinks = document.querySelector('.navlinks');
if (burger && navlinks) {
  burger.addEventListener('click', () => {
    navlinks.classList.toggle('show');
  });
  navlinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => navlinks.classList.remove('show'));
  });
}

// ===== FAQ accordion =====
document.querySelectorAll('.faq-item').forEach(item => {
  const btn = item.querySelector('.faq-question');
  const answer = item.querySelector('.faq-answer');
  if (!btn || !answer) return;
  btn.addEventListener('click', () => {
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item.open').forEach(other => {
      if (other !== item) {
        other.classList.remove('open');
        other.querySelector('.faq-answer').style.maxHeight = null;
      }
    });
    if (isOpen) {
      item.classList.remove('open');
      answer.style.maxHeight = null;
    } else {
      item.classList.add('open');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

// ===== Catalogue : filtres + pagination =====
const filterButtons = document.querySelectorAll('.filtres button');
const products = document.querySelectorAll('.produit');
const paginationEl = document.getElementById('pagination');
const PAGE_SIZE = 8;
let currentCat = 'all';
let currentPage = 1;

function getFilteredProducts() {
  return Array.from(products).filter(p => currentCat === 'all' || p.dataset.cat === currentCat);
}

function renderCatalogue() {
  if (!products.length) return;
  const filtered = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  // hide all, then show only current page's items among filtered
  products.forEach(p => { p.style.display = 'none'; });
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  pageItems.forEach(p => { p.style.display = ''; });

  // build pagination controls
  if (!paginationEl) return;
  paginationEl.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'nav-arrow';
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { currentPage--; renderCatalogue(); window.scrollTo({top: paginationEl.offsetTop - 300, behavior:'smooth'}); });
  paginationEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => { currentPage = i; renderCatalogue(); window.scrollTo({top: paginationEl.offsetTop - 300, behavior:'smooth'}); });
    paginationEl.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'nav-arrow';
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { currentPage++; renderCatalogue(); window.scrollTo({top: paginationEl.offsetTop - 300, behavior:'smooth'}); });
  paginationEl.appendChild(nextBtn);
}

if (filterButtons.length) {
  filterButtons.forEach(btn => {
    btn.addEventListener('click', function () {
      filterButtons.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentCat = this.dataset.cat;
      currentPage = 1;
      renderCatalogue();
    });
  });
  renderCatalogue();
}
