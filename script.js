// =========================================================
// MARCX DRESSING — Script Principal
// Fonctionnalités : Menu mobile, FAQ, Panier WhatsApp,
// Recherche en temps réel, Modale Quick View, Widget WhatsApp
// =========================================================

// ===== Utilitaires =====
function formatPrice(num) {
  return Number(num).toLocaleString('fr-FR') + ' FCFA';
}

function parsePrice(str) {
  if (typeof str === 'number') return str;
  const cleaned = (str || '').replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

function showToast(message, icon = 'fa-check-circle') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = 'toast-msg';
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity .3s ease, transform .3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

// ===== Menu mobile =====
const burger = document.querySelector('.burger');
const navlinks = document.querySelector('.navlinks');
if (burger && navlinks) {
  burger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = navlinks.classList.toggle('show');
    burger.classList.toggle('open', isOpen);
    burger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  navlinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navlinks.classList.remove('show');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (navlinks.classList.contains('show') && !navlinks.contains(e.target) && !burger.contains(e.target)) {
      navlinks.classList.remove('show');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navlinks.classList.contains('show')) {
      navlinks.classList.remove('show');
      burger.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
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
        const otherAnswer = other.querySelector('.faq-answer');
        if (otherAnswer) otherAnswer.style.maxHeight = null;
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

// =========================================================
// GESTION DU PANIER D'ACHAT & COMMANDE WHATSAPP
// =========================================================
let cart = [];
try {
  const savedCart = localStorage.getItem('marcx_cart');
  if (savedCart) cart = JSON.parse(savedCart);
} catch (e) {
  cart = [];
}

function saveCart() {
  try {
    localStorage.setItem('marcx_cart', JSON.stringify(cart));
  } catch (e) {}
  updateCartUI();
}

function getDeliveryCost(city) {
  switch (city) {
    case 'Cotonou': return 1000;
    case 'Abomey-Calavi': return 1500;
    case 'Porto-Novo': return 2000;
    case 'Parakou': return 3000;
    case 'Bohicon': return 2500;
    case 'Autre': return 2500;
    case 'Boutique': return 0;
    default: return 1000;
  }
}

function calculateCartSubtotal() {
  let subtotal = 0;
  let tshirtCount = 0;
  let tshirtTotal = 0;

  cart.forEach(item => {
    const itemTotal = item.price * item.quantity;
    if (item.cat === 'tshirt') {
      tshirtCount += item.quantity;
      tshirtTotal += itemTotal;
    } else {
      subtotal += itemTotal;
    }
  });

  // Pack 3 t-shirts à 12 000 FCFA (prix unitaire 4 000 FCFA)
  if (tshirtCount >= 3) {
    const promoPacks = Math.floor(tshirtCount / 3);
    const remainder = tshirtCount % 3;
    subtotal += (promoPacks * 12000) + (remainder * 4000);
  } else {
    subtotal += tshirtTotal;
  }

  return subtotal;
}

function addToCart(product) {
  const existingIdx = cart.findIndex(i => i.title === product.title && i.size === product.size);
  if (existingIdx > -1) {
    cart[existingIdx].quantity += product.quantity || 1;
  } else {
    cart.push({
      id: Date.now() + Math.random().toString(36).substr(2, 4),
      title: product.title,
      price: product.price,
      image: product.image,
      size: product.size || (product.cat === 'claquette' ? '42' : 'L'),
      cat: product.cat || 'jean',
      quantity: product.quantity || 1
    });
  }
  saveCart();
  showToast(`« ${product.title} » ajouté au panier !`, 'fa-cart-plus');
}

function updateCartItemQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.quantity += delta;
  if (item.quantity <= 0) {
    cart = cart.filter(i => i.id !== id);
  }
  saveCart();
}

function updateCartItemSize(id, newSize) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.size = newSize;
  saveCart();
}

function removeCartItem(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
}

function initCartDOM() {
  // Injecter le bouton de panier dans la barre de navigation si non présent
  const mainnav = document.querySelector('.mainnav');
  if (mainnav && !document.querySelector('.cart-trigger-btn')) {
    let actionsWrap = mainnav.querySelector('.nav-actions');
    if (!actionsWrap) {
      actionsWrap = document.createElement('div');
      actionsWrap.className = 'nav-actions';
      const burgerEl = mainnav.querySelector('.burger');
      if (burgerEl) {
        mainnav.insertBefore(actionsWrap, burgerEl);
        actionsWrap.appendChild(burgerEl);
      } else {
        mainnav.appendChild(actionsWrap);
      }
    }
    const cartBtn = document.createElement('button');
    cartBtn.className = 'cart-trigger-btn';
    cartBtn.setAttribute('aria-label', 'Voir mon panier');
    cartBtn.innerHTML = `<i class="fas fa-shopping-bag"></i><span class="cart-badge">0</span>`;
    actionsWrap.insertBefore(cartBtn, actionsWrap.firstChild);

    cartBtn.addEventListener('click', toggleCartDrawer);
  }

  // Injecter le tiroir panier
  if (!document.getElementById('cartDrawer')) {
    const backdrop = document.createElement('div');
    backdrop.className = 'cart-backdrop';
    backdrop.id = 'cartBackdrop';

    const drawer = document.createElement('div');
    drawer.className = 'cart-drawer';
    drawer.id = 'cartDrawer';
    drawer.innerHTML = `
      <div class="cart-header">
        <h3><i class="fas fa-shopping-bag" style="color:var(--green);"></i> Mon Panier</h3>
        <button class="cart-close-btn" id="cartCloseBtn" aria-label="Fermer le panier"><i class="fas fa-times"></i></button>
      </div>
      <div class="cart-items-body" id="cartItemsBody"></div>
      <div class="cart-footer" id="cartFooter">
        <div id="cartPromoMsg"></div>
        <div class="cart-city-group">
          <label for="cartDeliveryCity"><i class="fas fa-truck"></i> Ville de livraison</label>
          <select id="cartDeliveryCity" class="cart-city-select">
            <option value="Cotonou">Cotonou (+1 000 FCFA - Livraison 24h)</option>
            <option value="Abomey-Calavi">Abomey-Calavi (+1 500 FCFA - 24h)</option>
            <option value="Porto-Novo">Porto-Novo (+2 000 FCFA - 24-48h)</option>
            <option value="Parakou">Parakou (+3 000 FCFA - 48h)</option>
            <option value="Bohicon">Bohicon (+2 500 FCFA - 48h)</option>
            <option value="Autre">Autre ville (+2 500 FCFA)</option>
            <option value="Boutique">Retrait gratuit en boutique</option>
          </select>
        </div>
        <div class="cart-payment-group">
          <label for="cartPaymentMethod"><i class="fas fa-credit-card"></i> Mode de règlement</label>
          <select id="cartPaymentMethod" class="cart-payment-select">
            <option value="Paiement à la livraison (Cash)">💵 Espèces à la livraison</option>
            <option value="MTN Mobile Money">📱 MTN Mobile Money (+229 01 41 90 85 82)</option>
            <option value="Moov Money">📱 Moov Money (+229 01 41 90 85 82)</option>
          </select>
        </div>
        <div class="cart-trust-note">
          <i class="fas fa-shield-alt"></i> <span>Échange de taille garanti sous 48h à Cotonou.</span>
        </div>
        <div class="cart-total-row">
          <span class="cart-total-label">Total :</span>
          <span class="cart-total-price" id="cartTotalPrice">0 FCFA</span>
        </div>
        <button class="btn btn-whatsapp btn-cart-whatsapp" id="cartCheckoutBtn">
          <i class="fab fa-whatsapp"></i> Commander sur WhatsApp
        </button>
      </div>
    `;
    document.body.appendChild(backdrop);
    document.body.appendChild(drawer);

    backdrop.addEventListener('click', closeCartDrawer);
    drawer.querySelector('#cartCloseBtn').addEventListener('click', closeCartDrawer);
    drawer.querySelector('#cartDeliveryCity').addEventListener('change', updateCartUI);
    drawer.querySelector('#cartCheckoutBtn').addEventListener('click', checkoutCartWhatsApp);
  }

  updateCartUI();
}

function toggleCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    const isOpen = drawer.classList.toggle('open');
    backdrop.classList.toggle('open', isOpen);
  }
}

function closeCartDrawer() {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (drawer && backdrop) {
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
  }
}

function updateCartUI() {
  const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll('.cart-badge').forEach(badge => {
    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? 'flex' : 'none';
  });

  const body = document.getElementById('cartItemsBody');
  const footer = document.getElementById('cartFooter');
  if (!body) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="cart-empty-state">
        <i class="fas fa-bag-shopping"></i>
        <h4 style="margin-bottom:6px; color:var(--near-black);">Votre panier est vide</h4>
        <p style="font-size:0.88rem;">Explorez notre catalogue et ajoutez vos articles préférés.</p>
        <a href="catalogue.html" class="btn btn-primary" style="margin-top:14px; padding:10px 22px; font-size:0.84rem;">Voir le catalogue</a>
      </div>
    `;
    if (footer) footer.style.display = 'none';
    return;
  }

  if (footer) footer.style.display = 'block';

  let html = '';
  cart.forEach(item => {
    const sizes = item.cat === 'claquette'
      ? ['39', '40', '41', '42', '43', '44', '45']
      : ['S', 'M', 'L', 'XL', 'XXL'];

    const sizeOptions = sizes.map(s => `<option value="${s}" ${s === item.size ? 'selected' : ''}>Taille ${s}</option>`).join('');

    html += `
      <div class="cart-item-row" data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}" class="cart-item-img" />
        <div class="cart-item-info">
          <div class="cart-item-title" title="${item.title}">${item.title}</div>
          <div class="cart-item-details">
            <select class="cart-item-size-select" onchange="updateCartItemSize('${item.id}', this.value)">
              ${sizeOptions}
            </select>
            <span class="cart-item-price">${formatPrice(item.price * item.quantity)}</span>
          </div>
          <div class="cart-qty-ctrl">
            <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', -1)">-</button>
            <span class="cart-qty-num">${item.quantity}</span>
            <button class="cart-qty-btn" onclick="updateCartItemQty('${item.id}', 1)">+</button>
          </div>
        </div>
        <button class="cart-item-del" onclick="removeCartItem('${item.id}')" aria-label="Supprimer cet article"><i class="fas fa-trash-alt"></i></button>
      </div>
    `;
  });
  body.innerHTML = html;

  // Calculs promo et livraison
  const tshirtCount = cart.filter(i => i.cat === 'tshirt').reduce((sum, i) => sum + i.quantity, 0);
  const promoMsgEl = document.getElementById('cartPromoMsg');
  if (promoMsgEl) {
    if (tshirtCount >= 3) {
      promoMsgEl.innerHTML = `<div class="cart-promo-badge"><i class="fas fa-fire"></i> Offre 3 t-shirts à 12 000 FCFA appliquée !</div>`;
    } else if (tshirtCount > 0) {
      promoMsgEl.innerHTML = `<div class="cart-promo-badge" style="background:#fff3e0; border-color:#ff9800; color:#e65100;"><i class="fas fa-tags"></i> Plus que ${3 - tshirtCount} t-shirt(s) pour profiter du pack à 12 000 FCFA !</div>`;
    } else {
      promoMsgEl.innerHTML = '';
    }
  }

  const citySelect = document.getElementById('cartDeliveryCity');
  const city = citySelect ? citySelect.value : 'Cotonou';
  const deliveryCost = getDeliveryCost(city);
  const subtotal = calculateCartSubtotal();
  const total = subtotal + deliveryCost;

  const totalEl = document.getElementById('cartTotalPrice');
  if (totalEl) totalEl.textContent = formatPrice(total);
}

function checkoutCartWhatsApp() {
  if (cart.length === 0) return;

  const citySelect = document.getElementById('cartDeliveryCity');
  const city = citySelect ? citySelect.value : 'Cotonou';
  const deliveryCost = getDeliveryCost(city);
  const subtotal = calculateCartSubtotal();
  const total = subtotal + deliveryCost;

  let msg = `Bonjour Marcx Dressing ! 🛍️\nJe souhaite valider ma commande avec les articles suivants :\n\n`;

  cart.forEach((item, idx) => {
    msg += `${idx + 1}. *${item.title}*\n   - Taille : ${item.size}\n   - Quantité : ${item.quantity}\n   - Prix : ${formatPrice(item.price * item.quantity)}\n\n`;
  });

  const tshirtCount = cart.filter(i => i.cat === 'tshirt').reduce((sum, i) => sum + i.quantity, 0);
  if (tshirtCount >= 3) {
    msg += `🔥 *Offre spéciale :* Pack T-shirts appliqué\n`;
  }

  const paymentSelect = document.getElementById('cartPaymentMethod');
  const paymentMethod = paymentSelect ? paymentSelect.value : 'Paiement à la livraison (Cash)';

  msg += `📍 *Ville de livraison :* ${city} (${deliveryCost > 0 ? formatPrice(deliveryCost) : 'Retrait gratuit'})\n`;
  msg += `💳 *Mode de règlement :* ${paymentMethod}\n`;
  msg += `💰 *TOTAL À PAYER : ${formatPrice(total)}*\n\n`;
  msg += `Pouvez-vous me confirmer la commande et le délai de réception ? Merci !`;

  const waUrl = `https://wa.me/2290141908582?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');
}

// =========================================================
// MODALE QUICK VIEW (APERÇU RAPIDE) & GUIDE DES TAILLES
// =========================================================
function initQuickViewDOM() {
  if (document.getElementById('quickViewModal')) return;

  const modalBackdrop = document.createElement('div');
  modalBackdrop.className = 'modal-backdrop';
  modalBackdrop.id = 'quickViewModal';
  modalBackdrop.innerHTML = `
    <div class="modal-box">
      <button class="modal-close-btn" id="modalCloseBtn" aria-label="Fermer"><i class="fas fa-times"></i></button>
      <div class="quickview-grid">
        <div class="quickview-media">
          <img id="qvImg" src="" alt="Aperçu produit" />
        </div>
        <div class="quickview-body">
          <span class="quickview-cat" id="qvCat">Catégorie</span>
          <h2 class="quickview-title" id="qvTitle">Titre du produit</h2>
          <div class="quickview-price" id="qvPrice">0 FCFA</div>
          <p class="quickview-desc" id="qvDesc">Pièce streetwear haut de gamme sélectionnée par Marcx Dressing. Tissu durable, coupe moderne et finitions impeccables.</p>
          
          <div class="size-selector-wrap">
            <div class="size-selector-title">
              <span>Choisir une taille :</span>
              <span class="size-guide-link" id="sizeGuideBtn"><i class="fas fa-ruler-horizontal"></i> Guide des tailles</span>
            </div>
            <div class="size-pills" id="qvSizePills"></div>
          </div>

          <div class="quickview-actions">
            <button class="btn btn-primary" id="qvAddToCartBtn" style="flex:1;"><i class="fas fa-cart-plus"></i> Ajouter au panier</button>
            <a class="btn btn-whatsapp" id="qvDirectOrderBtn" target="_blank" style="flex:1; justify-content:center;"><i class="fab fa-whatsapp"></i> Commander direct</a>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalBackdrop);

  // Modale Guide des Tailles
  const sizeGuideModal = document.createElement('div');
  sizeGuideModal.className = 'modal-backdrop';
  sizeGuideModal.id = 'sizeGuideModal';
  sizeGuideModal.innerHTML = `
    <div class="modal-box" style="max-width:550px; padding:28px;">
      <button class="modal-close-btn" id="sizeGuideCloseBtn" aria-label="Fermer"><i class="fas fa-times"></i></button>
      <h3 style="font-size:1.3rem; margin-bottom:8px;"><i class="fas fa-ruler-combined" style="color:var(--green);"></i> Guide des Tailles</h3>
      <p style="font-size:0.88rem; color:var(--text-muted); margin-bottom:14px;">Correspondance indicative pour les vêtements et claquettes Marcx Dressing.</p>
      
      <table class="size-table">
        <thead>
          <tr><th>Taille</th><th>Morphologie / Tour</th><th>Chaussure</th></tr>
        </thead>
        <tbody>
          <tr><td><strong>S</strong></td><td>48 - 60 kg (Coupe ajustée)</td><td>-</td></tr>
          <tr><td><strong>M</strong></td><td>60 - 72 kg (Coupe standard)</td><td>-</td></tr>
          <tr><td><strong>L</strong></td><td>72 - 84 kg (Coupe confort / oversize)</td><td>-</td></tr>
          <tr><td><strong>XL</strong></td><td>84 - 95 kg (Coupe large)</td><td>-</td></tr>
          <tr><td><strong>XXL</strong></td><td>95 kg+ (Grande taille)</td><td>-</td></tr>
          <tr><td><strong>Pointures</strong></td><td>Pied fin à standard</td><td>39 à 45</td></tr>
        </tbody>
      </table>
      <p style="font-size:0.8rem; color:var(--text-muted); margin-top:14px;">
        💡 <em>Un doute sur votre taille ? Contactez-nous sur WhatsApp, notre équipe vous conseille en fonction de votre morphologie.</em>
      </p>
    </div>
  `;
  document.body.appendChild(sizeGuideModal);

  // Événements modales
  modalBackdrop.addEventListener('click', (e) => {
    if (e.target === modalBackdrop) modalBackdrop.classList.remove('open');
  });
  modalBackdrop.querySelector('#modalCloseBtn').addEventListener('click', () => modalBackdrop.classList.remove('open'));

  sizeGuideModal.addEventListener('click', (e) => {
    if (e.target === sizeGuideModal) sizeGuideModal.classList.remove('open');
  });
  sizeGuideModal.querySelector('#sizeGuideCloseBtn').addEventListener('click', () => sizeGuideModal.classList.remove('open'));

  document.getElementById('sizeGuideBtn').addEventListener('click', () => {
    sizeGuideModal.classList.add('open');
  });
}

function openQuickView(productData) {
  initQuickViewDOM();
  const modal = document.getElementById('quickViewModal');
  if (!modal) return;

  document.getElementById('qvImg').src = productData.image;
  document.getElementById('qvImg').alt = productData.title;
  document.getElementById('qvCat').textContent = productData.cat.toUpperCase();
  document.getElementById('qvTitle').textContent = productData.title;
  document.getElementById('qvPrice').textContent = formatPrice(productData.price);

  const pillsWrap = document.getElementById('qvSizePills');
  const sizes = productData.cat === 'claquette'
    ? ['39', '40', '41', '42', '43', '44', '45']
    : ['S', 'M', 'L', 'XL', 'XXL'];

  let selectedSize = productData.cat === 'claquette' ? '42' : 'L';

  pillsWrap.innerHTML = sizes.map(s => `
    <button class="size-pill ${s === selectedSize ? 'active' : ''}" data-size="${s}">${s}</button>
  `).join('');

  pillsWrap.querySelectorAll('.size-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      pillsWrap.querySelectorAll('.size-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedSize = btn.dataset.size;
      updateDirectOrderLink();
    });
  });

  function updateDirectOrderLink() {
    const directBtn = document.getElementById('qvDirectOrderBtn');
    const msg = `Bonjour Marcx Dressing ! 🛍️\nJe souhaite commander :\n- *${productData.title}*\n- Taille : ${selectedSize}\n- Prix : ${formatPrice(productData.price)}`;
    directBtn.href = `https://wa.me/2290141908582?text=${encodeURIComponent(msg)}`;
  }
  updateDirectOrderLink();

  const addBtn = document.getElementById('qvAddToCartBtn');
  addBtn.onclick = () => {
    addToCart({
      title: productData.title,
      price: productData.price,
      image: productData.image,
      cat: productData.cat,
      size: selectedSize,
      quantity: 1
    });
    modal.classList.remove('open');
  };

  modal.classList.add('open');
}

// =========================================================
// WIDGET FLOTTANT WHATSAPP (SPEED DIAL)
// =========================================================
function initFloatingWhatsApp() {
  if (document.querySelector('.floating-whatsapp')) return;

  const widget = document.createElement('div');
  widget.className = 'floating-whatsapp';
  widget.innerHTML = `
    <div class="floating-whatsapp-popover" id="waPopover">
      <div class="popover-head">Marcx Dressing • Support</div>
      <a href="https://wa.me/2290141908582?text=Bonjour%20Marcx%20Dressing%2C%20je%20souhaite%20des%20informations%20sur%20vos%20articles" target="_blank" class="popover-link">
        <i class="fab fa-whatsapp"></i> Discuter sur WhatsApp
      </a>
      <a href="catalogue.html" class="popover-link">
        <i class="fas fa-shirt"></i> Voir tout le catalogue
      </a>
      <a href="https://www.google.com/maps?q=6.372057027073176,2.463993449963338" target="_blank" class="popover-link">
        <i class="fas fa-location-dot"></i> Localisation & Boutique
      </a>
      <a href="tel:+2290141908582" class="popover-link">
        <i class="fas fa-phone"></i> Appeler directement
      </a>
    </div>
    <button class="floating-whatsapp-btn" id="waFloatBtn" aria-label="Support et commande WhatsApp">
      <div class="floating-whatsapp-pulse"></div>
      <i class="fab fa-whatsapp"></i>
    </button>
  `;
  document.body.appendChild(widget);

  const floatBtn = widget.querySelector('#waFloatBtn');
  const popover = widget.querySelector('#waPopover');

  floatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    popover.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!widget.contains(e.target)) {
      popover.classList.remove('open');
    }
  });
}

// =========================================================
// ATTACHEMENT DES ACTIONS SUR LES CARTES PRODUITS
// =========================================================
function enhanceProductCards() {
  const cards = document.querySelectorAll('.produit, .card');
  cards.forEach(card => {
    const isCatalogue = card.classList.contains('produit');
    const titleEl = card.querySelector('h4, h3');
    const priceEl = card.querySelector('.prix, p[style*="font-weight:700"]');
    const imgEl = card.querySelector('img');
    const cat = card.dataset.cat || (titleEl && titleEl.textContent.toLowerCase().includes('jean') ? 'jean' : (titleEl && titleEl.textContent.toLowerCase().includes('claquette') ? 'claquette' : 'tshirt'));

    if (!titleEl || !priceEl || !imgEl) return;

    const title = titleEl.textContent.trim();
    const price = parsePrice(priceEl.textContent);
    const image = imgEl.src;

    const productData = { title, price, image, cat };

    // Bouton Aperçu Rapide sur les images
    const mediaWrap = card.querySelector('.produit-media') || card;
    if (mediaWrap && !card.querySelector('.btn-quickview-trigger')) {
      const qvBtn = document.createElement('button');
      qvBtn.className = 'btn-quickview-trigger';
      qvBtn.innerHTML = '<i class="fas fa-eye"></i> Aperçu';
      qvBtn.setAttribute('aria-label', `Aperçu rapide de ${title}`);
      qvBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openQuickView(productData);
      });
      mediaWrap.appendChild(qvBtn);
    }

    // Ajouter les boutons "Ajouter au panier" dans le catalogue
    if (isCatalogue && !card.querySelector('.produit-card-actions')) {
      const oldBtn = card.querySelector('.btn-commande');
      if (oldBtn) {
        const actionsWrap = document.createElement('div');
        actionsWrap.className = 'produit-card-actions';

        const addCartBtn = document.createElement('button');
        addCartBtn.className = 'btn-add-cart';
        addCartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Panier';
        addCartBtn.setAttribute('aria-label', `Ajouter ${title} au panier`);
        addCartBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openSizePickerModal(productData, (size) => {
            addToCart({ ...productData, size: size, quantity: 1 });
          });
        });

        oldBtn.innerHTML = '<i class="fab fa-whatsapp"></i> Commander';
        oldBtn.style.width = 'auto';
        oldBtn.addEventListener('click', (e) => {
          e.preventDefault();
          openSizePickerModal(productData, (size) => {
            const msg = `Bonjour Marcx Dressing ! 🛍️\nJe souhaite commander :\n- *${productData.title}*\n- Taille : ${size}\n- Prix : ${formatPrice(productData.price)}`;
            window.open(`https://wa.me/2290141908582?text=${encodeURIComponent(msg)}`, '_blank');
          });
        });

        oldBtn.parentNode.insertBefore(actionsWrap, oldBtn);
        actionsWrap.appendChild(addCartBtn);
        actionsWrap.appendChild(oldBtn);
      }
    }
  });
}

// =========================================================
// CATALOGUE : RECHERCHE EN DIRECT + FILTRES + PAGINATION
// =========================================================
const filterButtons = document.querySelectorAll('.filtres button');
const products = document.querySelectorAll('.produit');
const paginationEl = document.getElementById('pagination');
const productGrid = document.getElementById('productGrid');
const PAGE_SIZE = 8;
let currentCat = 'all';
let searchQuery = '';
let currentPage = 1;

function scrollToCatalogue() {
  const target = productGrid || paginationEl;
  if (target) {
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: 'smooth' });
  }
}

function getFilteredProducts() {
  return Array.from(products).filter(p => {
    // Filtrage catégorie
    let matchesCat = false;
    if (currentCat === 'all') matchesCat = true;
    else if (currentCat === 'promo') matchesCat = p.querySelector('.produit-badge.promo') !== null;
    else if (currentCat === 'nouveau') {
      const badge = p.querySelector('.produit-badge');
      matchesCat = badge !== null && !badge.classList.contains('promo');
    } else {
      matchesCat = p.dataset.cat === currentCat;
    }

    if (!matchesCat) return false;

    // Filtrage recherche texte
    if (searchQuery.trim() !== '') {
      const text = p.textContent.toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      return text.includes(query);
    }

    return true;
  });
}

function renderCatalogue(shouldScroll = false) {
  if (!products.length) return;
  const filtered = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;

  // Affichage du compteur de résultats
  const counterEl = document.getElementById('resultsCounter');
  if (counterEl) {
    counterEl.textContent = `${filtered.length} article${filtered.length > 1 ? 's' : ''} disponible${filtered.length > 1 ? 's' : ''}`;
  }

  // Masquer tous les produits
  products.forEach(p => { p.style.display = 'none'; });

  // Supprimer l'état vide s'il existe
  const emptyEl = document.getElementById('catalogueEmpty');
  if (emptyEl) emptyEl.remove();

  if (filtered.length === 0) {
    if (productGrid) {
      const emptyBox = document.createElement('div');
      emptyBox.className = 'catalogue-empty';
      emptyBox.id = 'catalogueEmpty';
      emptyBox.innerHTML = `
        <i class="fas fa-search"></i>
        <h3 style="margin-bottom:6px; color:var(--near-black);">Aucun article trouvé</h3>
        <p style="font-size:0.92rem; color:var(--text-muted);">Essayez de modifier votre recherche ou sélectionnez une autre catégorie.</p>
        <button class="btn btn-outline" style="margin-top:12px;" onclick="resetSearchAndFilter()">Réinitialiser les filtres</button>
      `;
      productGrid.appendChild(emptyBox);
    }
    if (paginationEl) paginationEl.innerHTML = '';
    return;
  }

  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);
  pageItems.forEach(p => { p.style.display = ''; });

  if (shouldScroll) {
    scrollToCatalogue();
  }

  // Construction de la pagination
  if (!paginationEl) return;
  paginationEl.innerHTML = '';
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'nav-arrow';
  prevBtn.setAttribute('aria-label', 'Page précédente');
  prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderCatalogue(true);
    }
  });
  paginationEl.appendChild(prevBtn);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.setAttribute('aria-label', `Page ${i}`);
    if (i === currentPage) btn.classList.add('active');
    btn.addEventListener('click', () => {
      if (currentPage !== i) {
        currentPage = i;
        renderCatalogue(true);
      }
    });
    paginationEl.appendChild(btn);
  }

  const nextBtn = document.createElement('button');
  nextBtn.className = 'nav-arrow';
  nextBtn.setAttribute('aria-label', 'Page suivante');
  nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCatalogue(true);
    }
  });
  paginationEl.appendChild(nextBtn);
}

function resetSearchAndFilter() {
  searchQuery = '';
  currentCat = 'all';
  const input = document.getElementById('catalogueSearchInput');
  if (input) input.value = '';
  const clearBtn = document.getElementById('searchClearBtn');
  if (clearBtn) clearBtn.classList.remove('visible');

  filterButtons.forEach(b => {
    b.classList.toggle('active', b.dataset.cat === 'all');
  });
  currentPage = 1;
  renderCatalogue(false);
}

// Initialisation de la barre de recherche dans le catalogue
function initCatalogueSearch() {
  const filtresNav = document.querySelector('.filtres');
  if (filtresNav && !document.getElementById('catalogueSearchInput')) {
    const toolbar = document.createElement('div');
    toolbar.className = 'catalogue-toolbar';
    toolbar.innerHTML = `
      <div class="search-container">
        <div class="search-input-wrap">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="catalogueSearchInput" placeholder="Rechercher un modèle, couleur (noir, blanc...), style..." autocomplete="off" />
          <button id="searchClearBtn" class="search-clear-btn" aria-label="Effacer"><i class="fas fa-times"></i></button>
        </div>
      </div>
      <div class="results-counter" id="resultsCounter"></div>
    `;
    filtresNav.parentNode.insertBefore(toolbar, filtresNav.nextSibling);

    const searchInput = document.getElementById('catalogueSearchInput');
    const clearBtn = document.getElementById('searchClearBtn');

    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      clearBtn.classList.toggle('visible', searchQuery.length > 0);
      currentPage = 1;
      renderCatalogue(false);
    });

    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearBtn.classList.remove('visible');
      currentPage = 1;
      renderCatalogue(false);
      searchInput.focus();
    });
  }
}

// =========================================================
// HERO SLIDER DYNAMIQUE (ACCUEIL)
// =========================================================
function initHeroSlider() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;

  const slides = slider.querySelectorAll('.hero-slide');
  const indicators = document.querySelectorAll('.slider-indicators .indicator');
  const prevBtn = document.getElementById('sliderPrev');
  const nextBtn = document.getElementById('sliderNext');
  const totalSlides = slides.length;
  if (totalSlides <= 1) return;

  let currentSlide = 0;
  let autoplayTimer = null;

  function goToSlide(index) {
    slides[currentSlide].classList.remove('active');
    if (indicators[currentSlide]) indicators[currentSlide].classList.remove('active');

    currentSlide = (index + totalSlides) % totalSlides;

    slides[currentSlide].classList.add('active');
    if (indicators[currentSlide]) indicators[currentSlide].classList.add('active');
  }

  function nextSlide() {
    goToSlide(currentSlide + 1);
  }

  function prevSlide() {
    goToSlide(currentSlide - 1);
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(nextSlide, 5500);
  }

  function stopAutoplay() {
    if (autoplayTimer) clearInterval(autoplayTimer);
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      nextSlide();
      startAutoplay();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      prevSlide();
      startAutoplay();
    });
  }

  indicators.forEach((ind, idx) => {
    ind.addEventListener('click', () => {
      goToSlide(idx);
      startAutoplay();
    });
  });

  // Pause au survol sur PC
  const heroWrap = document.querySelector('.hero-slider-wrap');
  if (heroWrap) {
    heroWrap.addEventListener('mouseenter', stopAutoplay);
    heroWrap.addEventListener('mouseleave', startAutoplay);
  }

  // Support tactile Swipe sur smartphone
  let touchStartX = 0;
  let touchEndX = 0;

  slider.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    stopAutoplay();
  }, { passive: true });

  slider.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 45) {
      if (diff > 0) nextSlide();
      else prevSlide();
    }
    startAutoplay();
  }, { passive: true });

  startAutoplay();
}

// ===== Initialisation globale au chargement =====
document.addEventListener('DOMContentLoaded', () => {
  initHeroSlider();
  initCookieConsent();
  initCartDOM();
  initQuickViewDOM();
  initFloatingWhatsApp();
  enhanceProductCards();
  initCatalogueSearch();

  if (filterButtons.length) {
    const urlParams = new URLSearchParams(window.location.search);
    const catParam = urlParams.get('cat') || window.location.hash.replace('#', '');
    if (catParam) {
      const matchingBtn = document.querySelector(`.filtres button[data-cat="${catParam}"]`);
      if (matchingBtn) {
        filterButtons.forEach(b => b.classList.remove('active'));
        matchingBtn.classList.add('active');
        currentCat = catParam;
      }
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        filterButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentCat = this.dataset.cat;
        currentPage = 1;

        if (window.history && window.history.replaceState) {
          const newUrl = currentCat === 'all'
            ? window.location.pathname
            : `${window.location.pathname}?cat=${encodeURIComponent(currentCat)}`;
          window.history.replaceState(null, '', newUrl);
        }

        renderCatalogue(false);
      });
    });

    renderCatalogue(false);
  }
});




// ===== Gestion du Consentement des Cookies =====
function initCookieConsent() {
  const CONSENT_KEY = 'marcx_cookie_consent';
  const savedConsent = localStorage.getItem(CONSENT_KEY);

  // HTML du bandeau et de la modal de préférences
  const cookieHTML = `
    <div id="marcxCookieBanner" class="cookie-banner-wrap" role="dialog" aria-label="Gestion des cookies">
      <div class="cookie-header">
        <span class="cookie-icon">🍪</span>
        <h3 class="cookie-title">Votre vie privée nous tient à cœur</h3>
      </div>
      <p class="cookie-text">
        Chez <strong>Marcx Dressing</strong>, nous utilisons des cookies pour assurer le bon fonctionnement de votre panier d'achat et analyser notre trafic afin de vous offrir le meilleur service.
      </p>
      <div class="cookie-actions">
        <button id="cookieAcceptAll" class="cookie-btn cookie-btn-accept">
          <i class="fas fa-check"></i> Accepter tout
        </button>
        <button id="cookieRefuse" class="cookie-btn cookie-btn-refuse">
          Essentiels uniquement
        </button>
      </div>
      <button id="cookieOpenSettings" class="cookie-btn-settings">
        Personnaliser mes choix
      </button>
    </div>

    <div id="marcxCookieModal" class="cookie-modal-overlay">
      <div class="cookie-modal-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <h3 style="margin:0;"><i class="fas fa-sliders-h" style="color:#d4a853; margin-right:8px;"></i> Préférences des cookies</h3>
          <button id="cookieModalClose" style="background:none; border:none; color:#8c9794; font-size:1.2rem; cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <p>Gérez vos préférences de confidentialité pour Marcx Dressing. Les cookies nécessaires au panier restent toujours actifs.</p>

        <div class="cookie-pref-item">
          <div class="cookie-pref-info">
            <h4>Cookies essentiels (Panier & Sécurité)</h4>
            <p>Indispensables pour mémoriser votre panier et naviguer sur le site.</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" checked disabled>
            <span class="cookie-slider"></span>
          </label>
        </div>

        <div class="cookie-pref-item">
          <div class="cookie-pref-info">
            <h4>Mesure d'audience & Statistiques</h4>
            <p>Nous aide à savoir quels vêtements ont le plus de succès.</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" id="cookiePrefAnalytics" checked>
            <span class="cookie-slider"></span>
          </label>
        </div>

        <div class="cookie-pref-item">
          <div class="cookie-pref-info">
            <h4>Réseaux sociaux & Marketing</h4>
            <p>Permet d'afficher nos promotions sur WhatsApp, TikTok et Instagram.</p>
          </div>
          <label class="cookie-switch">
            <input type="checkbox" id="cookiePrefMarketing" checked>
            <span class="cookie-slider"></span>
          </label>
        </div>

        <div class="cookie-modal-actions">
          <button id="cookieSavePreferences" class="cookie-btn cookie-btn-accept" style="width:100%;">
            Enregistrer mes préférences
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', cookieHTML);

  const banner = document.getElementById('marcxCookieBanner');
  const modal = document.getElementById('marcxCookieModal');
  const btnAcceptAll = document.getElementById('cookieAcceptAll');
  const btnRefuse = document.getElementById('cookieRefuse');
  const btnSettings = document.getElementById('cookieOpenSettings');
  const btnCloseModal = document.getElementById('cookieModalClose');
  const btnSavePreferences = document.getElementById('cookieSavePreferences');
  const chkAnalytics = document.getElementById('cookiePrefAnalytics');
  const chkMarketing = document.getElementById('cookiePrefMarketing');

  function saveConsent(level, preferences = {}) {
    const data = {
      level: level,
      preferences: preferences,
      date: new Date().toISOString()
    };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    banner.classList.remove('visible');
    modal.classList.remove('visible');
  }

  // Si pas encore de consentement, afficher avec un léger délai
  if (!savedConsent) {
    setTimeout(() => {
      banner.classList.add('visible');
    }, 900);
  }

  if (btnAcceptAll) {
    btnAcceptAll.addEventListener('click', () => {
      saveConsent('all', { essentials: true, analytics: true, marketing: true });
    });
  }

  if (btnRefuse) {
    btnRefuse.addEventListener('click', () => {
      saveConsent('essentials', { essentials: true, analytics: false, marketing: false });
    });
  }

  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      banner.classList.remove('visible');
      modal.classList.add('visible');
    });
  }

  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      modal.classList.remove('visible');
      if (!localStorage.getItem(CONSENT_KEY)) {
        banner.classList.add('visible');
      }
    });
  }

  if (btnSavePreferences) {
    btnSavePreferences.addEventListener('click', () => {
      saveConsent('custom', {
        essentials: true,
        analytics: chkAnalytics.checked,
        marketing: chkMarketing.checked
      });
    });
  }

  // Support pour ré-ouvrir les préférences depuis le footer
  document.querySelectorAll('.open-cookie-settings').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      modal.classList.add('visible');
    });
  });
}


// ===== Quick Size Selection Modal on Product Card Click =====
function openSizePickerModal(productData, callback) {
  let modal = document.getElementById('quickSizeModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'quick-size-backdrop';
    modal.id = 'quickSizeModal';
    modal.innerHTML = `
      <div class="quick-size-box">
        <div class="quick-size-header">
          <h3 id="qsTitle">Choisir votre taille</h3>
          <button class="quick-size-close" id="qsClose"><i class="fas fa-times"></i></button>
        </div>
        <div class="quick-size-img-row">
          <img id="qsImg" src="" alt="Produit" class="quick-size-img" />
          <div>
            <div id="qsName" style="font-weight:700; font-size:0.92rem; color:var(--near-black);"></div>
            <div id="qsPrice" style="color:var(--green); font-weight:800; font-size:0.9rem;"></div>
          </div>
        </div>
        <div style="font-size:0.82rem; color:var(--text-muted); margin-bottom:6px;">Sélectionnez votre taille :</div>
        <div class="quick-size-pills" id="qsPills"></div>
        <div class="quick-size-actions">
          <button class="btn btn-primary" id="qsConfirmBtn" style="width:100%; justify-content:center;">
            <i class="fas fa-check"></i> Valider et continuer
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('open');
    });
    modal.querySelector('#qsClose').addEventListener('click', () => modal.classList.remove('open'));
  }

  document.getElementById('qsImg').src = productData.image;
  document.getElementById('qsName').textContent = productData.title;
  document.getElementById('qsPrice').textContent = formatPrice(productData.price);

  const sizes = productData.cat === 'claquette'
    ? ['39', '40', '41', '42', '43', '44', '45']
    : ['S', 'M', 'L', 'XL', 'XXL'];

  let chosenSize = productData.cat === 'claquette' ? '42' : 'L';

  const pillsWrap = document.getElementById('qsPills');
  pillsWrap.innerHTML = sizes.map(s => `
    <button type="button" class="quick-size-btn ${s === chosenSize ? 'active' : ''}" data-size="${s}">${s}</button>
  `).join('');

  pillsWrap.querySelectorAll('.quick-size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      pillsWrap.querySelectorAll('.quick-size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chosenSize = btn.dataset.size;
    });
  });

  const confirmBtn = document.getElementById('qsConfirmBtn');
  confirmBtn.onclick = () => {
    modal.classList.remove('open');
    if (callback) callback(chosenSize);
  };

  modal.classList.add('open');
}
