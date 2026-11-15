/* =========================================================
   Catalogo stile app — logica frontend
   I dati arrivano da /admin (Decap CMS) tramite il JSON #catalog.
   ========================================================= */
(function () {
  "use strict";

  const DATA = JSON.parse(document.getElementById("catalog").textContent);
  const S = DATA.settings || {};
  const PRODUCTS = DATA.products || [];
  const CATEGORIES = DATA.categories || [];
  const OFFERS = DATA.offers || [];
  const app = document.getElementById("app");

  // ---------- Utils ----------
  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money = (n) => `${nf.format(n || 0)} ${S.currency || "€"}`;
  const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const byId = (id) => PRODUCTS.find((p) => p.id === id);
  const catOf = (p) => CATEGORIES.find((c) => c.title === p.category);
  const catById = (id) => CATEGORIES.find((c) => c.id === id);
  const productsIn = (cat) => PRODUCTS.filter((p) => p.category === cat.title);

  const store = {
    get(key, fallback) {
      try { const v = localStorage.getItem("cat_" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem("cat_" + key, JSON.stringify(value)); } catch (e) { /* storage non disponibile */ }
    },
  };

  let cart = store.get("cart", []).filter((i) => byId(i.id));
  let favs = store.get("favs", []).filter((id) => byId(id));
  let promo = store.get("promo", "");
  let customer = Object.assign({ name: "", phone: "", address: "", notes: "", mode: "delivery" }, store.get("customer", {}));
  let lastOrder = null;

  const save = () => { store.set("cart", cart); store.set("favs", favs); store.set("promo", promo); store.set("customer", customer); };

  // ---------- Icons ----------
  const I = {
    back: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-8.8C1.6 7.9 3.8 4.5 7.2 4.5c2 0 3.4 1.1 4.8 2.8 1.4-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.4 4.2 6.7C19 15.6 12 20 12 20z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sliders: '<svg viewBox="0 0 24 24"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    bike: '<svg viewBox="0 0 24 24"><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M5.5 17 9 9h5l4.5 8M9 9 8 6H6M14 9l-2 5H8"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/></svg>',
    chat: '<svg viewBox="0 0 24 24"><path d="M4 20l1.3-3.9A8 8 0 1 1 8 19z"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M21 3 10 14M21 3l-7 18-4-7-7-4z"/></svg>',
    insta: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="0.6"/></svg>',
    mail: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a1 1 0 0 1 1-1h10"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h0"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>',
  };

  // ---------- Pricing ----------
  const unitPrice = (p, variant, extras) =>
    p.price + (p.variants[variant]?.price || 0) + (extras || []).reduce((s, i) => s + (p.extras[i]?.price || 0), 0);

  const optionsLabel = (p, variant, extras) => {
    const parts = [];
    if (p.variants.length && p.variants[variant]) parts.push(p.variants[variant].name);
    (extras || []).forEach((i) => p.extras[i] && parts.push(p.extras[i].name));
    return parts.join(", ");
  };

  const findOffer = (code) => OFFERS.find((o) => o.code && o.code === String(code || "").trim().toUpperCase());

  function totals() {
    const subtotal = cart.reduce((s, i) => { const p = byId(i.id); return s + unitPrice(p, i.variant, i.extras) * i.qty; }, 0);
    const pickup = customer.mode === "pickup";
    let delivery = pickup ? 0 : S.delivery_fee || 0;
    if (!pickup && S.free_delivery_over > 0 && subtotal >= S.free_delivery_over) delivery = 0;

    let discount = 0;
    let offer = null;
    let promoError = "";
    if (promo) {
      offer = findOffer(promo);
      if (!offer) promoError = "Codice non valido";
      else if (offer.min_order && subtotal < offer.min_order) promoError = `Valido per ordini da ${money(offer.min_order)}`;
      else if (offer.discount_type === "percent") {
        discount = (subtotal * offer.discount_value) / 100;
        if (offer.max_discount > 0) discount = Math.min(discount, offer.max_discount);
      }
      else if (offer.discount_type === "fixed") discount = Math.min(offer.discount_value, subtotal);
      else if (offer.discount_type === "free_delivery") { discount = 0; delivery = 0; }
      if (promoError) offer = null;
    }
    discount = Math.round(discount * 100) / 100;
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const total = Math.max(0, subtotal - discount + delivery);
    const belowMin = !pickup && S.min_order > 0 && subtotal < S.min_order;
    return { subtotal, delivery, discount, offer, promoError, total, count, pickup, belowMin };
  }

  function addToCart(id, variant = 0, extras = [], qty = 1) {
    extras = [...extras].sort((a, b) => a - b);
    const key = `${id}|${variant}|${extras.join(".")}`;
    const line = cart.find((i) => i.key === key);
    if (line) line.qty += qty;
    else cart.push({ key, id, variant, extras, qty });
    save();
    updateBadge();
    toast("Aggiunto al carrello");
  }

  function toggleFav(id) {
    const on = favs.includes(id);
    favs = on ? favs.filter((f) => f !== id) : [...favs, id];
    save();
    toast(on ? "Rimosso dai preferiti" : "Aggiunto ai preferiti");
    return !on;
  }

  // ---------- UI pieces ----------
  function thumb(p, cls = "") {
    const c = p && catOf(p);
    const badge = p && !p.available ? '<span class="badge off">Esaurito</span>' : p && p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "";
    if (p && p.image)
      return `<div class="thumb ${cls}">${badge}<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>`;
    return `<div class="thumb fallback ${cls}">${badge}<span class="emoji" aria-hidden="true">${esc((c && c.icon) || "🍽️")}</span></div>`;
  }

  const priceTag = (p) => `<span class="price">${money(p.price)}${p.old_price > p.price ? `<s>${money(p.old_price)}</s>` : ""}</span>`;

  const heartBtn = (p) =>
    `<button class="heart ${favs.includes(p.id) ? "active" : ""}" data-action="fav" data-id="${esc(p.id)}" aria-label="Preferito" aria-pressed="${favs.includes(p.id)}">${I.heart}</button>`;

  const card = (p) => `
    <article class="pcard">
      <a href="#/product/${encodeURIComponent(p.id)}" aria-label="${esc(p.title)}">${thumb(p)}</a>
      ${heartBtn(p)}
      <a class="body" href="#/product/${encodeURIComponent(p.id)}">
        <h4>${esc(p.title)}</h4>
        <span class="sub">${esc(p.subtitle || p.category)}</span>
        <div class="foot">
          ${priceTag(p)}
          <button class="add-btn" data-action="quick-add" data-id="${esc(p.id)}" aria-label="Aggiungi ${esc(p.title)}" ${p.available ? "" : "disabled"}>${I.plus}</button>
        </div>
      </a>
    </article>`;

  const row = (p, opts = {}) => `
    <article class="prow">
      <a href="#/product/${encodeURIComponent(p.id)}">${thumb(p)}</a>
      <a class="info" href="#/product/${encodeURIComponent(p.id)}">
        <h4>${esc(p.title)}</h4>
        <span class="sub">${esc(p.subtitle || p.category)}</span>
        ${p.badge && p.available ? `<span class="tag">${esc(p.badge)}</span>` : ""}
        <span style="margin-top:4px">${priceTag(p)}</span>
      </a>
      ${opts.fav ? `<button class="row-heart" data-action="fav" data-id="${esc(p.id)}" aria-label="Rimuovi dai preferiti">${I.heart}</button>` : ""}
      <button class="add-btn" data-action="quick-add" data-id="${esc(p.id)}" aria-label="Aggiungi ${esc(p.title)}" ${p.available ? "" : "disabled"}>${I.plus}</button>
    </article>`;

  const offerCard = (o) => `
    <div class="offer ${esc(o.color)} ${o.image ? "has-img" : ""}">
      ${o.image ? `<img class="offer-bg" src="${esc(o.image)}" alt="" loading="lazy">` : ""}
      <h3>${esc(o.title)}</h3>
      ${o.subtitle ? `<p>${esc(o.subtitle)}</p>` : ""}
      ${o.code ? `<button class="code" data-action="copy-code" data-code="${esc(o.code)}">${I.copy} ${esc(o.code)}</button>` : ""}
    </div>`;

  const catIcon = (c) => (c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : esc(c.icon || "🍽️"));

  const brandBadge = () =>
    S.logo ? `<span class="brand-badge"><img src="${esc(S.logo)}" alt="${esc(S.store_name)}"></span>` : `<span class="brand-badge">${esc((S.store_name || "?").trim().charAt(0).toUpperCase())}</span>`;

  const topbar = (title, right = "") => `
    <header class="topbar center">
      <button class="icon-btn" data-action="back" aria-label="Indietro">${I.back}</button>
      <div class="title">${esc(title)}</div>
      ${right || '<span class="icon-btn ghost"></span>'}
    </header>`;

  const empty = (emoji, title, text, cta = '<a class="btn" href="#/">Vai al menu</a>') => `
    <div class="empty"><div class="big">${emoji}</div><h2>${esc(title)}</h2><p>${esc(text)}</p>${cta}</div>`;

  // ---------- Views ----------
  function viewHome() {
    const featured = PRODUCTS.filter((p) => p.featured);
    return `
      <div class="screen">
        <header class="hello">
          <div>
            <small>${esc(S.greeting || "Ciao 👋")}</small>
            <h1>${esc(S.tagline || S.store_name)}</h1>
          </div>
          <a href="#/info" aria-label="Info negozio">${brandBadge()}</a>
        </header>

        <div class="searchbar">
          <a class="field" href="#/search">${I.search}<span>Cerca prodotti, categorie…</span></a>
          <a class="filter-btn" href="#/search" aria-label="Filtri">${I.sliders}</a>
        </div>

        ${S.announcement ? `<div class="announce">${I.bike}<span>${esc(S.announcement)}</span></div>` : ""}

        ${CATEGORIES.length ? `
        <section class="section">
          <div class="section-head"><h2 class="section-title">Categorie</h2><a class="link" href="#/search">Vedi tutte</a></div>
          <div class="cats">
            ${CATEGORIES.map((c) => `<a class="cat" href="#/category/${encodeURIComponent(c.id)}"><span class="cat-icon">${catIcon(c)}</span><span class="cat-label">${esc(c.title)}</span></a>`).join("")}
          </div>
        </section>` : ""}

        ${OFFERS.length ? `
        <section class="section">
          <div class="section-head"><h2 class="section-title">Offerte</h2><a class="link" href="#/offers">Vedi tutte</a></div>
          <div class="hscroll">${OFFERS.map(offerCard).join("")}</div>
        </section>` : ""}

        ${featured.length ? `
        <section class="section">
          <div class="section-head"><h2 class="section-title">In evidenza</h2></div>
          <div class="hscroll">${featured.map(card).join("")}</div>
        </section>` : ""}

        ${CATEGORIES.map((c) => {
          const items = productsIn(c);
          if (!items.length) return "";
          return `
          <section class="section" id="sec-${esc(c.id)}">
            <div class="section-head"><h2 class="section-title">${esc(c.icon)} ${esc(c.title)}</h2><a class="link" href="#/category/${encodeURIComponent(c.id)}">Vedi tutti</a></div>
            <div class="grid">${items.map(card).join("")}</div>
          </section>`;
        }).join("")}

        ${!PRODUCTS.length ? empty("🛍️", "Catalogo in allestimento", "I prodotti saranno disponibili a breve.", "") : ""}
        ${S.footer ? `<p class="footer-note">${esc(S.footer)}</p>` : ""}
      </div>`;
  }

  let searchState = { q: "", cat: "" };

  function searchResults() {
    const q = norm(searchState.q);
    const list = PRODUCTS.filter((p) => {
      if (searchState.cat && p.category !== searchState.cat) return false;
      if (!q) return true;
      return norm([p.title, p.subtitle, p.description, p.category, p.badge].join(" ")).includes(q);
    });
    if (!list.length) return empty("🔎", "Nessun risultato", "Prova con un'altra parola o categoria.", "");
    return `<p class="muted" style="margin:0 0 10px;font-size:13px">${list.length} ${list.length === 1 ? "prodotto" : "prodotti"}</p><div class="rows two">${list.map((p) => row(p)).join("")}</div>`;
  }

  function viewSearch(params) {
    searchState = { q: params.get("q") || searchState.q || "", cat: params.has("cat") ? params.get("cat") : searchState.cat };
    return `
      <div class="screen">
        ${topbar("Cerca")}
        <div class="searchbar">
          <label class="field">${I.search}<input id="searchInput" type="search" placeholder="Cerca prodotti, categorie…" value="${esc(searchState.q)}" autocomplete="off" enterkeyhint="search"></label>
        </div>
        <div class="chips" role="tablist">
          <button class="chip ${!searchState.cat ? "active" : ""}" data-action="filter-cat" data-cat="">Tutti</button>
          ${CATEGORIES.map((c) => `<button class="chip ${searchState.cat === c.title ? "active" : ""}" data-action="filter-cat" data-cat="${esc(c.title)}">${esc(c.icon)} ${esc(c.title)}</button>`).join("")}
        </div>
        <div id="results">${searchResults()}</div>
      </div>`;
  }

  function viewCategory(id) {
    const c = catById(id);
    if (!c) return viewNotFound();
    const items = productsIn(c);
    return `
      <div class="screen">
        ${topbar(`${c.icon || ""} ${c.title}`)}
        <div class="chips">
          ${CATEGORIES.map((x) => `<a class="chip ${x.id === c.id ? "active" : ""}" href="#/category/${encodeURIComponent(x.id)}">${esc(x.icon)} ${esc(x.title)}</a>`).join("")}
        </div>
        ${items.length ? `<div class="grid">${items.map(card).join("")}</div>` : empty(c.icon || "🍽️", "Nessun prodotto", "Questa categoria è ancora vuota.")}
      </div>`;
  }

  let detail = null;

  function viewProduct(id) {
    const p = byId(id);
    if (!p) return viewNotFound();
    detail = { id: p.id, qty: 1, variant: 0, extras: new Set() };
    const c = catOf(p);
    return `
      <div class="screen has-actionbar">
        <div class="detail-wrap">
          <div class="detail-hero">
            <div class="detail-top">
              <button class="icon-btn" data-action="back" aria-label="Indietro">${I.back}</button>
              <div class="group">
                <button class="icon-btn ${favs.includes(p.id) ? "active" : ""}" data-action="fav" data-id="${esc(p.id)}" aria-label="Preferito">${I.heart}</button>
                <button class="icon-btn" data-action="share" aria-label="Condividi">${I.share}</button>
              </div>
            </div>
            ${thumb(p)}
          </div>
          <div class="detail-body">
            <h1>${esc(p.title)}</h1>
            <div class="detail-meta">
              ${c ? `<a class="pill" href="#/category/${encodeURIComponent(c.id)}">${esc(c.icon)} ${esc(c.title)}</a>` : ""}
              ${p.available ? `<span class="pill ok">${I.check} Disponibile</span>` : `<span class="pill no">Esaurito</span>`}
              ${S.delivery_time ? `<span class="pill">${I.clock} ${esc(S.delivery_time)}</span>` : ""}
            </div>
            <div style="margin-bottom:12px;font-size:22px">${priceTag(p)}</div>
            ${p.description ? `<p class="desc">${esc(p.description)}</p>` : p.subtitle ? `<p class="desc">${esc(p.subtitle)}</p>` : ""}

            ${p.variants.length ? `
            <div class="opt-group">
              <h3>Scegli formato <small>Obbligatorio</small></h3>
              ${p.variants.map((v, i) => `
                <label class="opt">
                  <input type="radio" name="variant" value="${i}" ${i === 0 ? "checked" : ""} data-change="variant">
                  <span class="box">${I.check}</span>
                  <span class="name">${esc(v.name)}</span>
                  <span class="add">${v.price ? "+" + money(v.price) : ""}</span>
                </label>`).join("")}
            </div>` : ""}

            ${p.extras.length ? `
            <div class="opt-group">
              <h3>Aggiungi extra <small>Facoltativo</small></h3>
              ${p.extras.map((e, i) => `
                <label class="opt">
                  <input type="checkbox" value="${i}" data-change="extra">
                  <span class="box">${I.check}</span>
                  <span class="name">${esc(e.name)}</span>
                  <span class="add">${e.price ? "+" + money(e.price) : "Gratis"}</span>
                </label>`).join("")}
            </div>` : ""}
          </div>
        </div>

        <div class="actionbar"><div class="inner">
          <div class="qty">
            <button data-action="d-dec" aria-label="Diminuisci">${I.minus}</button>
            <span id="dQty">1</span>
            <button class="plus" data-action="d-inc" aria-label="Aumenta">${I.plus}</button>
          </div>
          <button class="btn" data-action="d-add" ${p.available ? "" : "disabled"}>
            ${p.available ? `Aggiungi <span class="sum" id="dSum">· ${money(p.price)}</span>` : "Non disponibile"}
          </button>
        </div></div>
      </div>`;
  }

  function updateDetailSum() {
    const p = byId(detail.id);
    const sum = unitPrice(p, detail.variant, [...detail.extras]) * detail.qty;
    const q = document.getElementById("dQty");
    const s = document.getElementById("dSum");
    if (q) q.textContent = detail.qty;
    if (s) s.textContent = "· " + money(sum);
  }

  function viewOffers() {
    return `
      <div class="screen">
        ${topbar("Offerte")}
        ${OFFERS.length ? `<div class="offers-list">${OFFERS.map(offerCard).join("")}</div>
          <p class="hint" style="text-align:center;margin-top:16px">Tocca un codice per copiarlo e inseriscilo nel carrello.</p>`
          : empty("🏷️", "Nessuna offerta attiva", "Torna a trovarci presto!")}
      </div>`;
  }

  function viewFavorites() {
    const list = favs.map(byId).filter(Boolean);
    return `
      <div class="screen">
        ${topbar("Preferiti")}
        ${list.length ? `<div class="rows two">${list.map((p) => row(p, { fav: true })).join("")}</div>`
          : empty("🤍", "Nessun preferito", "Tocca il cuore su un prodotto per salvarlo qui.")}
      </div>`;
  }

  function viewCart() {
    if (!cart.length)
      return `<div class="screen">${topbar("Il tuo ordine")}${empty("🛒", "Il carrello è vuoto", "Aggiungi qualcosa di buono dal menu.")}</div>`;
    const t = totals();
    const freeLeft = !t.pickup && S.free_delivery_over > 0 && t.subtotal < S.free_delivery_over ? S.free_delivery_over - t.subtotal : 0;
    return `
      <div class="screen has-actionbar narrow">
        ${topbar("Il tuo ordine", `<button class="icon-btn" data-action="clear-cart" aria-label="Svuota carrello">${I.trash}</button>`)}

        <div class="seg" style="margin-bottom:14px">
          <button class="${!t.pickup ? "active" : ""}" data-action="mode" data-mode="delivery">Consegna</button>
          <button class="${t.pickup ? "active" : ""}" data-action="mode" data-mode="pickup">Ritiro</button>
        </div>

        <div class="card">
          ${cart.map((i) => {
            const p = byId(i.id);
            const opts = optionsLabel(p, i.variant, i.extras);
            return `
            <div class="citem">
              ${thumb(p)}
              <div class="info">
                <h4>${esc(p.title)}</h4>
                ${opts ? `<div class="opts">${esc(opts)}</div>` : ""}
                <div class="price" style="font-size:14px">${money(unitPrice(p, i.variant, i.extras) * i.qty)}</div>
              </div>
              <div class="qty sm">
                <button data-action="c-dec" data-key="${esc(i.key)}" aria-label="Diminuisci">${i.qty > 1 ? I.minus : I.trash}</button>
                <span>${i.qty}</span>
                <button class="plus" data-action="c-inc" data-key="${esc(i.key)}" aria-label="Aumenta">${I.plus}</button>
              </div>
            </div>`;
          }).join("")}
          <a class="link" href="#/" style="display:inline-block;margin-top:12px">+ Aggiungi altri prodotti</a>
        </div>

        <div class="card">
          <p class="card-title">Codice promo</p>
          ${t.offer ? `<div class="applied"><span>${I.check} ${esc(t.offer.code)} applicato</span><button data-action="remove-promo">Rimuovi</button></div>`
            : `<div class="promo"><input class="input" id="promoInput" placeholder="Inserisci codice" value="${esc(promo)}" autocomplete="off"><button class="btn secondary" data-action="apply-promo">Applica</button></div>
               ${t.promoError ? `<p class="hint warn">${esc(t.promoError)}</p>` : ""}`}
        </div>

        <div class="card">
          <p class="card-title">${t.pickup ? "I tuoi dati" : "Dati per la consegna"}</p>
          <div class="form">
            <input class="input" data-field="name" placeholder="Nome e cognome *" value="${esc(customer.name)}" autocomplete="name">
            <input class="input" data-field="phone" type="tel" placeholder="Telefono" value="${esc(customer.phone)}" autocomplete="tel">
            ${!t.pickup ? `<input class="input" data-field="address" placeholder="Indirizzo di consegna *" value="${esc(customer.address)}" autocomplete="street-address">` : ""}
            <textarea class="input" data-field="notes" placeholder="Note (citofono, allergie, orario…)">${esc(customer.notes)}</textarea>
          </div>
          ${t.pickup && S.address ? `<p class="hint">Ritiro presso: ${esc(S.address)}</p>` : ""}
        </div>

        <div class="card totals" id="totals">${totalsHtml(t, freeLeft)}</div>

        <div class="actionbar"><div class="inner">
          <button class="btn" data-action="send-order" ${t.belowMin ? "disabled" : ""}>
            ${S.order_channel === "telegram" ? I.send : I.chat}
            <span>Invia ordine</span><span class="spacer"></span><span class="sum">${money(t.total)}</span>
          </button>
        </div></div>
      </div>`;
  }

  function totalsHtml(t, freeLeft) {
    return `
      <div class="line"><span>Subtotale</span><b>${money(t.subtotal)}</b></div>
      ${!t.pickup ? `<div class="line"><span>Consegna</span><b>${t.delivery ? money(t.delivery) : "Gratis"}</b></div>` : ""}
      ${t.discount ? `<div class="line discount"><span>Sconto</span><b>−${money(t.discount)}</b></div>` : ""}
      <div class="line total"><span>Totale</span><b>${money(t.total)}</b></div>
      ${freeLeft ? `<p class="hint">Aggiungi ancora ${money(freeLeft)} per la consegna gratuita</p>` : ""}
      ${t.belowMin ? `<p class="hint warn">Ordine minimo per la consegna: ${money(S.min_order)}</p>` : ""}`;
  }

  function viewDone() {
    if (!lastOrder) { location.hash = "#/"; return ""; }
    return `
      <div class="screen narrow">
        <div class="empty">
          <div class="done-check">${I.check}</div>
          <h2>Ordine pronto all'invio!</h2>
          <p>${S.order_channel === "telegram"
              ? "Il riepilogo è stato copiato: incollalo nella chat Telegram che si è aperta e invialo."
              : "Si è aperta la chat WhatsApp con il riepilogo: premi invia per confermare."}</p>
        </div>
        <div class="card totals">
          <div class="line"><span>Articoli</span><b>${lastOrder.count}</b></div>
          <div class="line"><span>Modalità</span><b>${lastOrder.pickup ? "Ritiro" : "Consegna"}</b></div>
          ${S.delivery_time && !lastOrder.pickup ? `<div class="line"><span>Tempo stimato</span><b>${esc(S.delivery_time)}</b></div>` : ""}
          <div class="line total"><span>Totale</span><b>${money(lastOrder.total)}</b></div>
        </div>
        <div style="display:grid;gap:10px">
          <a class="btn block" href="#/">Continua a ordinare</a>
          <button class="btn secondary block" data-action="resend">Riapri il messaggio</button>
        </div>
      </div>`;
  }

  function viewInfo() {
    const items = [];
    if (S.hours) items.push({ ic: I.clock, t: "Orari", s: S.hours });
    if (S.address) items.push({ ic: I.pin, t: "Indirizzo", s: S.address, href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(S.address) });
    if (S.delivery_time) items.push({ ic: I.bike, t: "Consegna", s: `${S.delivery_time} · ${S.delivery_fee ? money(S.delivery_fee) : "gratis"}${S.free_delivery_over ? ` · gratis da ${money(S.free_delivery_over)}` : ""}` });
    const contacts = [];
    if (S.phone) contacts.push({ ic: I.phone, t: "Telefono", s: S.phone, href: "tel:" + S.phone.replace(/\s+/g, "") });
    if (S.whatsapp) contacts.push({ ic: I.chat, t: "WhatsApp", s: "Scrivici", href: "https://wa.me/" + S.whatsapp.replace(/\D/g, "") });
    if (S.telegram) contacts.push({ ic: I.send, t: "Telegram", s: "@" + S.telegram.replace(/^@/, ""), href: "https://t.me/" + S.telegram.replace(/^@/, "") });
    if (S.instagram) contacts.push({ ic: I.insta, t: "Instagram", s: "@" + S.instagram.replace(/^@/, ""), href: "https://instagram.com/" + S.instagram.replace(/^@/, "") });
    if (S.email) contacts.push({ ic: I.mail, t: "Email", s: S.email, href: "mailto:" + S.email });

    const menuItem = (m) => {
      const inner = `<span class="ic">${m.ic}</span><span class="tx">${esc(m.t)}<small>${esc(m.s)}</small></span>${m.href ? I.chev : ""}`;
      const ext = m.href && /^https?:/.test(m.href) ? ' target="_blank" rel="noopener"' : "";
      return m.href ? `<a class="menu-item" href="${esc(m.href)}"${ext}>${inner}</a>` : `<div class="menu-item">${inner}</div>`;
    };

    return `
      <div class="screen narrow">
        ${topbar("Info")}
        <div class="profile">
          ${brandBadge()}
          <h2>${esc(S.store_name)}</h2>
          ${S.about ? `<p>${esc(S.about)}</p>` : ""}
        </div>
        <div class="stats">
          <div><b>${PRODUCTS.length}</b><span>Prodotti</span></div>
          <div><b>${CATEGORIES.length}</b><span>Categorie</span></div>
          <div><b>${favs.length}</b><span>Preferiti</span></div>
        </div>
        ${items.length ? `<div class="menu">${items.map(menuItem).join("")}</div>` : ""}
        ${contacts.length ? `<p class="card-title" style="margin:18px 4px 8px">Contatti</p><div class="menu">${contacts.map(menuItem).join("")}</div>` : ""}
        <div class="menu">
          ${menuItem({ ic: I.tag, t: "Offerte e codici promo", s: OFFERS.length ? `${OFFERS.length} attive` : "Nessuna al momento", href: "#/offers" })}
          ${menuItem({ ic: I.heart, t: "I miei preferiti", s: `${favs.length} salvati`, href: "#/favorites" })}
          ${menuItem({ ic: I.bag, t: "Carrello", s: `${totals().count} articoli`, href: "#/cart" })}
        </div>
        ${S.footer ? `<p class="footer-note">${esc(S.footer)}</p>` : ""}
      </div>`;
  }

  const viewNotFound = () => `<div class="screen">${topbar("")}${empty("🤷", "Pagina non trovata", "Il contenuto che cerchi non esiste più.")}</div>`;

  // ---------- Order ----------
  function buildMessage(t) {
    const lines = [`🛒 *Nuovo ordine — ${S.store_name}*`, ""];
    cart.forEach((i) => {
      const p = byId(i.id);
      const opts = optionsLabel(p, i.variant, i.extras);
      lines.push(`• ${i.qty}× ${p.title}${opts ? ` (${opts})` : ""} — ${money(unitPrice(p, i.variant, i.extras) * i.qty)}`);
    });
    lines.push("", `Subtotale: ${money(t.subtotal)}`);
    if (!t.pickup) lines.push(`Consegna: ${t.delivery ? money(t.delivery) : "Gratis"}`);
    if (t.offer) lines.push(`Codice ${t.offer.code}${t.discount ? `: −${money(t.discount)}` : ""}`);
    lines.push(`*Totale: ${money(t.total)}*`, "");
    lines.push(`👤 ${customer.name}`);
    if (customer.phone) lines.push(`📞 ${customer.phone}`);
    lines.push(t.pickup ? "🏪 Ritiro in negozio" : `📍 ${customer.address}`);
    if (customer.notes) lines.push(`📝 ${customer.notes}`);
    return lines.join("\n");
  }

  function openOrder(msg) {
    if (S.order_channel === "telegram") {
      const user = String(S.telegram || "").replace(/^@/, "");
      copyText(msg);
      window.open("https://t.me/" + encodeURIComponent(user), "_blank", "noopener");
    } else {
      const num = String(S.whatsapp || "").replace(/\D/g, "");
      window.open(`https://wa.me/${num}?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
    }
  }

  function sendOrder() {
    const t = totals();
    if (!customer.name.trim()) return toast("Inserisci il tuo nome"), focusField("name");
    if (!t.pickup && !customer.address.trim()) return toast("Inserisci l'indirizzo"), focusField("address");
    if (t.belowMin) return toast(`Ordine minimo ${money(S.min_order)}`);
    const channelOk = S.order_channel === "telegram" ? S.telegram : S.whatsapp;
    if (!channelOk) return toast("Contatto per gli ordini non configurato");
    const msg = buildMessage(t);
    lastOrder = { msg, total: t.total, count: t.count, pickup: t.pickup };
    openOrder(msg);
    cart = [];
    promo = "";
    save();
    updateBadge();
    location.hash = "#/done";
  }

  const focusField = (name) => { const el = app.querySelector(`[data-field="${name}"]`); if (el) el.focus(); };

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    fallbackCopy(text);
  }
  function fallbackCopy(text) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); } catch (e) { /* ignore */ }
    ta.remove();
  }

  // ---------- Toast / badge ----------
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }
  function updateBadge() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    const b = document.getElementById("cartBadge");
    b.textContent = n > 99 ? "99+" : n;
    b.hidden = n === 0;
  }

  // ---------- Router ----------
  const scrollPos = {};
  let currentHash = null;
  const navStack = []; // cronologia interna, per il tasto indietro

  function route() {
    const hash = location.hash || "#/";
    if (currentHash !== null) scrollPos[currentHash] = window.scrollY;
    currentHash = hash;
    if (navStack[navStack.length - 2] === hash) navStack.pop();
    else if (navStack[navStack.length - 1] !== hash) navStack.push(hash);

    const [path, query] = hash.slice(1).split("?");
    const parts = path.split("/").filter(Boolean).map(decodeURIComponent);
    const params = new URLSearchParams(query || "");
    let html, tab;

    switch (parts[0]) {
      case undefined: html = viewHome(); tab = "home"; break;
      case "search": html = viewSearch(params); tab = "search"; break;
      case "category": html = viewCategory(parts[1]); tab = "search"; break;
      case "product": html = viewProduct(parts[1]); tab = "home"; break;
      case "offers": html = viewOffers(); tab = "home"; break;
      case "favorites": html = viewFavorites(); tab = "favorites"; break;
      case "cart": html = viewCart(); tab = "cart"; break;
      case "done": html = viewDone(); tab = "cart"; break;
      case "info": html = viewInfo(); tab = "info"; break;
      default: html = viewNotFound(); tab = "";
    }

    app.innerHTML = html;
    document.querySelectorAll(".tabbar a").forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    window.scrollTo(0, scrollPos[hash] || 0);

    if (parts[0] === "search") {
      const input = document.getElementById("searchInput");
      if (input && window.matchMedia("(hover: hover)").matches) input.focus();
    }
    const titles = { search: "Cerca", cart: "Carrello", favorites: "Preferiti", info: "Info", offers: "Offerte" };
    const p = parts[0] === "product" && byId(parts[1]);
    document.title = p ? `${p.title} · ${S.store_name}` : titles[parts[0]] ? `${titles[parts[0]]} · ${S.store_name}` : S.store_name;
  }

  function rerenderCart() {
    const y = window.scrollY;
    app.innerHTML = viewCart();
    window.scrollTo(0, y);
  }

  // ---------- Events ----------
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const a = el.dataset.action;
    if (el.tagName === "BUTTON") e.preventDefault();
    e.stopPropagation();

    switch (a) {
      case "back":
        if (navStack.length > 1) history.back();
        else location.hash = "#/";
        break;
      case "fav": {
        const on = toggleFav(el.dataset.id);
        el.classList.toggle("active", on);
        el.setAttribute("aria-pressed", on);
        if (location.hash.startsWith("#/favorites")) route();
        break;
      }
      case "quick-add": {
        const p = byId(el.dataset.id);
        if (!p || !p.available) break;
        if (p.variants.length || p.extras.length) location.hash = "#/product/" + encodeURIComponent(p.id);
        else addToCart(p.id);
        break;
      }
      case "copy-code":
        copyText(el.dataset.code);
        toast(`Codice ${el.dataset.code} copiato`);
        break;
      case "share": {
        const p = detail && byId(detail.id);
        const data = { title: p ? p.title : S.store_name, url: location.href };
        if (navigator.share) navigator.share(data).catch(() => {});
        else { copyText(location.href); toast("Link copiato"); }
        break;
      }
      case "filter-cat":
        searchState.cat = el.dataset.cat;
        app.querySelectorAll('[data-action="filter-cat"]').forEach((c) => c.classList.toggle("active", c === el));
        document.getElementById("results").innerHTML = searchResults();
        break;
      case "d-inc": detail.qty = Math.min(99, detail.qty + 1); updateDetailSum(); break;
      case "d-dec": detail.qty = Math.max(1, detail.qty - 1); updateDetailSum(); break;
      case "d-add":
        addToCart(detail.id, detail.variant, [...detail.extras], detail.qty);
        break;
      case "c-inc":
      case "c-dec": {
        const line = cart.find((i) => i.key === el.dataset.key);
        if (!line) break;
        line.qty += a === "c-inc" ? 1 : -1;
        if (line.qty <= 0) cart = cart.filter((i) => i !== line);
        save(); updateBadge(); rerenderCart();
        break;
      }
      case "clear-cart":
        if (confirm("Svuotare il carrello?")) { cart = []; save(); updateBadge(); rerenderCart(); }
        break;
      case "mode":
        customer.mode = el.dataset.mode; save(); rerenderCart();
        break;
      case "apply-promo": {
        const v = (document.getElementById("promoInput").value || "").trim().toUpperCase();
        if (!v) break;
        promo = v; save(); rerenderCart();
        const t = totals();
        toast(t.offer ? "Codice applicato" : t.promoError);
        break;
      }
      case "remove-promo":
        promo = ""; save(); rerenderCart();
        break;
      case "send-order":
        sendOrder();
        break;
      case "resend":
        if (lastOrder) openOrder(lastOrder.msg);
        break;
    }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "searchInput") {
      searchState.q = t.value;
      document.getElementById("results").innerHTML = searchResults();
      history.replaceState(null, "", "#/search" + (t.value ? "?q=" + encodeURIComponent(t.value) : ""));
      currentHash = location.hash;
      navStack[navStack.length - 1] = currentHash;
    } else if (t.dataset.field) {
      customer[t.dataset.field] = t.value;
      save();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.id === "promoInput") { e.preventDefault(); app.querySelector('[data-action="apply-promo"]').click(); }
  });

  document.addEventListener("change", (e) => {
    const t = e.target;
    if (!detail || !t.dataset.change) return;
    if (t.dataset.change === "variant") detail.variant = Number(t.value);
    if (t.dataset.change === "extra") t.checked ? detail.extras.add(Number(t.value)) : detail.extras.delete(Number(t.value));
    updateDetailSum();
  });

  window.addEventListener("hashchange", route);
  updateBadge();
  route();
})();
