// =====================
// Dados (mock)
// =====================
const PRODUCTS = [
  { id: 1,  name: "Tênis Urban Flex",        category: "Tênis",      price: 239, oldPrice: 299, rating: 4.7, sizes: [34,35,36,37,38,39,40], promo: true,  isNew: true,  color: "preto" },
  { id: 2,  name: "Salto Elegance 7cm",      category: "Saltos",     price: 189, oldPrice: 229, rating: 4.4, sizes: [33,34,35,36,37,38],      promo: true,  isNew: false, color: "nude" },
  { id: 3,  name: "Tamanco Comfort",         category: "Tamancos",   price: 129, oldPrice: null, rating: 4.1, sizes: [34,35,36,37,38,39],     promo: false, isNew: false, color: "caramelo" },
  { id: 4,  name: "Esportivo RunPro",        category: "Esportivo",  price: 279, oldPrice: 349, rating: 4.8, sizes: [36,37,38,39,40,41,42],    promo: true,  isNew: true,  color: "azul" },
  { id: 5,  name: "Tênis Branco Minimal",    category: "Tênis",      price: 219, oldPrice: null, rating: 4.3, sizes: [34,35,36,37,38],         promo: false, isNew: true,  color: "branco" },
  { id: 6,  name: "Salto Festa Glow",        category: "Saltos",     price: 299, oldPrice: 359, rating: 4.6, sizes: [34,35,36,37],            promo: true,  isNew: true,  color: "prata" },
  { id: 7,  name: "Infantil Joy Kids",       category: "Infantil",   price: 119, oldPrice: 149, rating: 4.5, sizes: [20,21,22,23,24,25,26],    promo: true,  isNew: false, color: "rosa" },
  { id: 8,  name: "Infantil Street Mini",    category: "Infantil",   price: 139, oldPrice: null, rating: 4.2, sizes: [27,28,29,30,31,32,33,34], promo: false, isNew: true,  color: "preto" },
  { id: 9,  name: "Tamanco Trança",          category: "Tamancos",   price: 159, oldPrice: 199, rating: 4.0, sizes: [34,35,36,37,38],         promo: true,  isNew: false, color: "off-white" },
  { id: 10, name: "Esportivo Trail Grip",    category: "Esportivo",  price: 319, oldPrice: null, rating: 4.7, sizes: [38,39,40,41,42,43],      promo: false, isNew: true,  color: "verde" },
  { id: 11, name: "Tênis Canvas Casual",     category: "Tênis",      price: 179, oldPrice: 219, rating: 4.1, sizes: [35,36,37,38,39,40],       promo: true,  isNew: false, color: "bege" },
  { id: 12, name: "Salto Office Confort",    category: "Saltos",     price: 209, oldPrice: null, rating: 4.3, sizes: [33,34,35,36,37,38],      promo: false, isNew: false, color: "preto" },
];

// =====================
// Estado
// =====================
const state = {
  q: "",
  category: "Todos",
  size: null,
  priceMax: 699,
  sort: "relevance",
  onlyPromo: false,
  cart: loadCart(),
};

// =====================
// Elementos
// =====================
const grid = document.getElementById("grid");
const resultCount = document.getElementById("resultCount");
const title = document.getElementById("title");
const subtitle = document.getElementById("subtitle");

const q = document.getElementById("q");
const qTop = document.getElementById("qTop");
const btnClearQ = document.getElementById("btnClearQ");

const categorySel = document.getElementById("category");
const sizesWrap = document.getElementById("sizes");
const priceMax = document.getElementById("priceMax");
const priceMaxLabel = document.getElementById("priceMaxLabel");
const sortSel = document.getElementById("sort");
const onlyPromo = document.getElementById("onlyPromo");
const btnReset = document.getElementById("btnReset");
const btnApply = document.getElementById("btnApply");

const chips = [...document.querySelectorAll(".chip")];

const overlay = document.getElementById("overlay");
const cartEl = document.getElementById("cart");
const btnCart = document.getElementById("btnCart");
const btnCloseCart = document.getElementById("btnCloseCart");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const cartCount = document.getElementById("cartCount");
const btnCheckout = document.getElementById("btnCheckout");
const btnClearCart = document.getElementById("btnClearCart");

const filters = document.getElementById("filters");
const btnFiltersMobile = document.getElementById("btnFiltersMobile");
const btnCloseFilters = document.getElementById("btnCloseFilters");

// =====================
// Util
// =====================
const brl = (n) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function normalize(s) {
  return (s ?? "").toString().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function saveCart(cart) {
  localStorage.setItem("vitta_cart", JSON.stringify(cart));
}
function loadCart() {
  try { return JSON.parse(localStorage.getItem("vitta_cart")) ?? []; }
  catch { return []; }
}

function cartSummary() {
  let count = 0;
  let total = 0;
  for (const it of state.cart) {
    count += it.qty;
    total += it.qty * it.price;
  }
  cartCount.textContent = String(count);
  cartTotal.textContent = brl(total);
}

// =====================
// Render: tamanhos (unique)
// =====================
function renderSizes() {
  const set = new Set();
  PRODUCTS.forEach(p => p.sizes.forEach(s => set.add(s)));
  const sizes = [...set].sort((a,b)=>a-b);

  sizesWrap.innerHTML = "";
  for (const s of sizes) {
    const btn = document.createElement("button");
    btn.className = "sizeBtn" + (state.size === s ? " is-active" : "");
    btn.textContent = s;
    btn.type = "button";
    btn.addEventListener("click", () => {
      state.size = (state.size === s) ? null : s;
      renderSizes();
      applyFilters();
    });
    sizesWrap.appendChild(btn);
  }
}

// =====================
// Filtragem + Ordenação
// =====================
function filteredProducts() {
  const qn = normalize(state.q);
  return PRODUCTS
    .filter(p => {
      if (state.category !== "Todos" && p.category !== state.category) return false;
      if (state.onlyPromo && !p.promo) return false;
      if (state.size != null && !p.sizes.includes(state.size)) return false;
      if (p.price > state.priceMax) return false;

      if (qn) {
        const hay = normalize(`${p.name} ${p.category} ${p.color}`);
        if (!hay.includes(qn)) return false;
      }
      return true;
    })
    .sort((a,b) => {
      switch (state.sort) {
        case "priceAsc": return a.price - b.price;
        case "priceDesc": return b.price - a.price;
        case "ratingDesc": return b.rating - a.rating;
        case "newest": return (b.isNew === a.isNew) ? 0 : (b.isNew ? 1 : -1);
        default: return 0; // relevance (mock)
      }
    });
}

function productCard(p) {
  const promoPct = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : null;

  const el = document.createElement("article");
  el.className = "card";

  el.innerHTML = `
    <div class="card__img">
      <div class="badges">
        ${p.promo ? `<span class="badge badge--promo">Promo</span>` : ""}
        ${p.isNew ? `<span class="badge badge--new">Novo</span>` : ""}
        ${promoPct ? `<span class="badge">-${promoPct}%</span>` : ""}
      </div>
    </div>

    <div class="card__body">
      <h3 class="card__title">${p.name}</h3>
      <div class="card__meta">${p.category} • Cor: ${p.color} • Tam: ${p.sizes.slice(0,4).join(", ")}${p.sizes.length>4 ? "..." : ""}</div>

      <div class="card__row">
        <div class="price">
          ${brl(p.price)}
          ${p.oldPrice ? `<small><s>${brl(p.oldPrice)}</s></small>` : `<small>&nbsp;</small>`}
        </div>
        <div class="rating">⭐ ${p.rating.toFixed(1)}</div>
      </div>

      <div class="card__actions">
        <button class="btn btn--ghost btnTiny" data-action="details" data-id="${p.id}">Detalhes</button>
        <button class="btn btn--primary btnTiny" data-action="add" data-id="${p.id}">Adicionar</button>
      </div>
    </div>
  `;

  return el;
}

function renderGrid(list) {
  grid.innerHTML = "";
  for (const p of list) grid.appendChild(productCard(p));

  resultCount.textContent = `${list.length} produto(s)`;

  const cat = state.category === "Todos" ? "Calçados" : state.category;
  title.textContent = cat;

  const qtxt = state.q ? `Buscando por “${state.q}”` : "Encontre o par perfeito para você.";
  subtitle.textContent = qtxt;
}

// =====================
// Aplicar filtros (estado -> UI -> grid)
// =====================
function syncUIFromState() {
  q.value = state.q;
  qTop.value = state.q;
  categorySel.value = state.category;
  priceMax.value = state.priceMax;
  priceMaxLabel.textContent = brl(state.priceMax);
  sortSel.value = state.sort;
  onlyPromo.checked = state.onlyPromo;

  chips.forEach(ch => {
    const c = ch.dataset.cat;
    ch.classList.toggle("is-active", c === state.category);
  });

  renderSizes();
}

function applyFilters() {
  // garante label do range
  priceMaxLabel.textContent = brl(Number(priceMax.value));

  const list = filteredProducts();
  renderGrid(list);
}

// =====================
// Interações
// =====================
function setCategory(cat) {
  state.category = cat;
  syncUIFromState();
  applyFilters();
}

chips.forEach(ch => {
  ch.addEventListener("click", () => setCategory(ch.dataset.cat));
});

q.addEventListener("input", (e) => {
  state.q = e.target.value;
  qTop.value = state.q;
  applyFilters();
});
qTop.addEventListener("input", (e) => {
  state.q = e.target.value;
  q.value = state.q;
  applyFilters();
});
btnClearQ.addEventListener("click", () => {
  state.q = "";
  syncUIFromState();
  applyFilters();
});

categorySel.addEventListener("change", (e) => {
  setCategory(e.target.value);
});
priceMax.addEventListener("input", (e) => {
  state.priceMax = Number(e.target.value);
  applyFilters();
});
sortSel.addEventListener("change", (e) => {
  state.sort = e.target.value;
  applyFilters();
});
onlyPromo.addEventListener("change", (e) => {
  state.onlyPromo = e.target.checked;
  applyFilters();
});

btnReset.addEventListener("click", () => {
  state.q = "";
  state.category = "Todos";
  state.size = null;
  state.priceMax = 699;
  state.sort = "relevance";
  state.onlyPromo = false;
  syncUIFromState();
  applyFilters();
});

btnApply.addEventListener("click", () => {
  // aqui já aplica em tempo real, mas mantém por clareza
  applyFilters();
  closeFilters();
});

// =====================
// Grid actions
// =====================
grid.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;
  const product = PRODUCTS.find(p => p.id === id);
  if (!product) return;

  if (action === "add") {
    addToCart(product);
    openCart();
  }
  if (action === "details") {
    alert(
      `${product.name}\n\nCategoria: ${product.category}\nPreço: ${brl(product.price)}\nAvaliação: ${product.rating}\nTamanhos: ${product.sizes.join(", ")}\nCor: ${product.color}`
    );
  }
});

// =====================
// Carrinho
// =====================
function addToCart(p) {
  const idx = state.cart.findIndex(it => it.id === p.id);
  if (idx >= 0) {
    state.cart[idx].qty += 1;
  } else {
    state.cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, category: p.category });
  }
  saveCart(state.cart);
  renderCart();
}

function changeQty(id, delta) {
  const it = state.cart.find(x => x.id === id);
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) state.cart = state.cart.filter(x => x.id !== id);
  saveCart(state.cart);
  renderCart();
}

function renderCart() {
  cartItems.innerHTML = "";
  if (state.cart.length === 0) {
    cartItems.innerHTML = `<div class="muted">Seu carrinho está vazio.</div>`;
  } else {
    for (const it of state.cart) {
      const row = document.createElement("div");
      row.className = "cartItem";
      row.innerHTML = `
        <div class="cartItem__img"></div>
        <div class="cartItem__info">
          <p class="cartItem__title">${it.name}</p>
          <div class="cartItem__meta">${it.category} • ${brl(it.price)}</div>
          <div class="cartItem__row">
            <div class="qty">
              <button type="button" data-q="-1" data-id="${it.id}" aria-label="Diminuir">−</button>
              <strong>${it.qty}</strong>
              <button type="button" data-q="1" data-id="${it.id}" aria-label="Aumentar">+</button>
            </div>
            <strong>${brl(it.price * it.qty)}</strong>
          </div>
        </div>
      `;
      cartItems.appendChild(row);
    }
  }
  cartSummary();
}

cartItems.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  const id = Number(b.dataset.id);
  const delta = Number(b.dataset.q);
  changeQty(id, delta);
});

btnClearCart.addEventListener("click", () => {
  state.cart = [];
  saveCart(state.cart);
  renderCart();
});

btnCheckout.addEventListener("click", () => {
  if (state.cart.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }
  alert("Eu mereço um aumento?");
});

// Drawer open/close
function openCart() {
  document.body.classList.add("isOpen");
}
function closeCart() {
  document.body.classList.remove("isOpen");
}
btnCart.addEventListener("click", openCart);
btnCloseCart.addEventListener("click", closeCart);
overlay.addEventListener("click", () => {
  closeCart();
  closeFilters();
});

// =====================
// Filtros mobile
// =====================
function openFilters() {
  filters.classList.add("is-open");
}
function closeFilters() {
  filters.classList.remove("is-open");
}
btnFiltersMobile?.addEventListener("click", openFilters);
btnCloseFilters?.addEventListener("click", closeFilters);

// =====================
// Hero slider
// =====================
const heroTrack = document.getElementById("heroTrack");
const heroDots = document.getElementById("heroDots");
const heroPrev = document.getElementById("heroPrev");
const heroNext = document.getElementById("heroNext");

let heroIndex = 0;
let heroTimer = null;

function heroCount() {
  return heroTrack?.children?.length ?? 0;
}
function renderHeroDots() {
  if (!heroDots) return;
  heroDots.innerHTML = "";
  for (let i = 0; i < heroCount(); i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = i === heroIndex ? "is-active" : "";
    b.addEventListener("click", () => goHero(i, true));
    heroDots.appendChild(b);
  }
}
function goHero(i, user = false) {
  const n = heroCount();
  if (n === 0) return;
  heroIndex = (i + n) % n;
  heroTrack.style.transform = `translateX(${-heroIndex * 100}%)`;
  [...heroDots.children].forEach((d, idx) => d.classList.toggle("is-active", idx === heroIndex));
  if (user) restartHeroTimer();
}
function nextHero() { goHero(heroIndex + 1, true); }
function prevHero() { goHero(heroIndex - 1, true); }

function restartHeroTimer() {
  if (heroTimer) clearInterval(heroTimer);
  heroTimer = setInterval(() => goHero(heroIndex + 1, false), 4500);
}

heroNext?.addEventListener("click", nextHero);
heroPrev?.addEventListener("click", prevHero);

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-quick-category]");
  if (!b) return;
  setCategory(b.dataset.quickCategory);
  window.scrollTo({ top: 260, behavior: "smooth" });
});

// =====================
// Start
// =====================
syncUIFromState();
renderHeroDots();
goHero(0);
restartHeroTimer();
renderCart();
applyFilters();

