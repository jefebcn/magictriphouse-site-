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
  const HERO = OFFERS.filter((o) => o.placement === "hero");
  const BANNERS = OFFERS.filter((o) => o.placement === "banner");
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
  const enc = encodeURIComponent;

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
    burger: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    bell: '<svg viewBox="0 0 24 24"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><path d="M3 4h2l2.2 10.5a1.5 1.5 0 0 0 1.5 1.2h8.6a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-9-8.8C1.6 7.9 3.8 4.5 7.2 4.5c2 0 3.4 1.1 4.8 2.8 1.4-1.7 2.8-2.8 4.8-2.8 3.4 0 5.6 3.4 4.2 6.7C19 15.6 12 20 12 20z"/></svg>',
    share: '<svg viewBox="0 0 24 24"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M5 12h14"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sliders: '<svg viewBox="0 0 24 24"><path d="M4 7h9M17 7h3M4 12h3M11 12h9M4 17h11M19 17h1"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="17" r="2"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
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
    bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12H7z"/><path d="M9 8a3 3 0 0 1 6 0"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
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
      } else if (offer.discount_type === "fixed") discount = Math.min(offer.discount_value, subtotal);
      else if (offer.discount_type === "free_delivery") delivery = 0;
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
    updateBadges();
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
  const emojiFor = (p) => (p && catOf(p) && catOf(p).icon) || "🍽️";

  function thumb(p, cls = "") {
    const badge = p && !p.available ? '<span class="badge off">Esaurito</span>' : p && p.badge ? `<span class="badge">${esc(p.badge)}</span>` : "";
    if (p && p.image)
      return `<div class="thumb ${cls}">${badge}<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy"></div>`;
    return `<div class="thumb fallback ${cls}">${badge}<span class="emoji" aria-hidden="true">${esc(emojiFor(p))}</span></div>`;
  }

  const priceTag = (p) => `<span class="price">${money(p.price)}${p.old_price > p.price ? `<s>${money(p.old_price)}</s>` : ""}</span>`;

  const rating = (p) =>
    p.rating ? `<span class="rating">${I.star}${esc(String(p.rating).replace(".", ","))}${p.reviews ? ` <small>(${esc(p.reviews)})</small>` : ""}</span>` : "";

  const heartBtn = (p) =>
    `<button class="heart ${favs.includes(p.id) ? "active" : ""}" data-action="fav" data-id="${esc(p.id)}" aria-label="Preferito" aria-pressed="${favs.includes(p.id)}">${I.heart}</button>`;

  const addBtn = (p) =>
    `<button class="add-btn" data-action="quick-add" data-id="${esc(p.id)}" aria-label="Aggiungi ${esc(p.title)}" ${p.available ? "" : "disabled"}>${I.plus}</button>`;

  const card = (p) => `
    <article class="pcard">
      <a href="#/product/${enc(p.id)}" aria-label="${esc(p.title)}">${thumb(p)}</a>
      ${heartBtn(p)}
      <a class="body" href="#/product/${enc(p.id)}">
        <h4>${esc(p.title)}</h4>
        ${rating(p) || `<span class="sub">${esc(p.subtitle || p.category)}</span>`}
        <div class="foot">${priceTag(p)}${addBtn(p)}</div>
      </a>
    </article>`;

  const row = (p, opts = {}) => `
    <article class="prow">
      <a href="#/product/${enc(p.id)}">${thumb(p)}</a>
      <a class="info" href="#/product/${enc(p.id)}">
        ${p.badge && p.available ? `<span class="tag">${esc(p.badge)}</span>` : ""}
        <h4>${esc(p.title)}</h4>
        <span class="sub">${esc(p.subtitle || p.category)}</span>
        ${rating(p)}
        <span style="margin-top:2px">${priceTag(p)}</span>
      </a>
      ${opts.fav ? `<button class="row-heart" data-action="fav" data-id="${esc(p.id)}" aria-label="Rimuovi dai preferiti">${I.heart}</button>` : ""}
      ${addBtn(p)}
    </article>`;

  const offerLink = (o) => (o.product && byId(o.product) ? `#/product/${enc(o.product)}` : "#/menu");
  const offerArt = (o) => {
    if (o.image) return `<img src="${esc(o.image)}" alt="" loading="lazy">`;
    const p = o.product && byId(o.product);
    return `<span class="emoji" aria-hidden="true">${esc(o.icon || (p ? emojiFor(p) : "🍔"))}</span>`;
  };
  const codeBtn = (o) => (o.code ? `<button class="code" data-action="copy-code" data-code="${esc(o.code)}">${I.copy} ${esc(o.code)}</button>` : "");

  const slide = (o) => `
    <article class="slide ${o.image ? "has-img" : ""}">
      <div class="copy">
        ${o.label ? `<span class="pill-label">${esc(o.label)}</span>` : ""}
        <h2>${esc(o.title)}${o.title_highlight ? `<em>${esc(o.title_highlight)}</em>` : ""}</h2>
        ${o.subtitle ? `<p>${esc(o.subtitle)}</p>` : ""}
        ${o.code && !o.cta_text ? `<div style="margin-top:12px">${codeBtn(o)}</div>` : ""}
        <a class="cta" href="${offerLink(o)}">${esc(o.cta_text || "Ordina ora")}<i>${I.arrow}</i></a>
      </div>
      <div class="art">${offerArt(o)}</div>
    </article>`;

  const promoBanner = (o) => `
    <article class="promo-banner">
      <a class="copy" href="${offerLink(o)}">
        ${o.label ? `<div class="eyebrow">${esc(o.label)}</div>` : ""}
        <h3>${esc(o.title)}${o.title_highlight ? `<span>${esc(o.title_highlight)}</span>` : ""}</h3>
        ${o.subtitle ? `<p>${esc(o.subtitle)}</p>` : ""}
        ${codeBtn(o)}
      </a>
      ${o.badge_text ? `<div class="save-badge">${badgeHtml(o.badge_text)}</div>` : "<span></span>"}
      <a class="art" href="${offerLink(o)}" tabindex="-1" aria-hidden="true">${offerArt(o)}</a>
    </article>`;

  // "SAVE 20%" -> SAVE / 20% in grande
  const badgeHtml = (t) => {
    const m = String(t).match(/^(.*?)(\S*\d\S*)$/);
    return m ? `${esc(m[1].trim())}<b>${esc(m[2])}</b>` : `<b>${esc(t)}</b>`;
  };

  const catIcon = (c) => (c.image ? `<img src="${esc(c.image)}" alt="" loading="lazy">` : esc(c.icon || "🍽️"));

  const logoHtml = () => `
    <span class="logo">
      ${S.logo ? `<img src="${esc(S.logo)}" alt="">` : S.logo_icon ? `<span class="mark" aria-hidden="true">${esc(S.logo_icon)}</span>` : ""}
      <span class="name">${esc(S.store_name)}</span>
      ${S.subtitle ? `<span class="sub">${esc(S.subtitle)}</span>` : ""}
    </span>`;

  const appbar = () => `
    <header class="appbar">
      <div class="left"><button class="bar-btn" data-action="drawer" aria-label="Apri menu">${I.burger}</button></div>
      <a href="#/" aria-label="${esc(S.store_name)}">${logoHtml()}</a>
      <div class="right">
        <a class="bar-btn" href="#/offers" aria-label="Offerte">${I.bell}${OFFERS.length ? `<b class="dot-badge">${OFFERS.length}</b>` : ""}</a>
        <a class="bar-btn" href="#/cart" aria-label="Carrello">${I.cart}<b class="dot-badge" data-cart-badge hidden>0</b></a>
      </div>
    </header>`;

  const topbar = (title, right = "") => `
    <header class="topbar">
      <button class="icon-btn" data-action="back" aria-label="Indietro">${I.back}</button>
      <div class="title">${esc(title)}</div>
      ${right || '<span class="icon-btn ghost"></span>'}
    </header>`;

  const empty = (emoji, title, text, cta = '<a class="btn" href="#/menu">Vai al menu</a>') => `
    <div class="empty"><div class="big">${emoji}</div><h2>${esc(title)}</h2><p>${esc(text)}</p>${cta}</div>`;

  // ---------- Views ----------
  function viewHome() {
    const featured = PRODUCTS.filter((p) => p.featured);
    return `
      <div class="screen">
        ${appbar()}

        <div class="searchbar">
          <a class="field" href="#/search">${I.search}<span>${esc(S.search_placeholder || "Cerca il tuo piatto preferito…")}</span></a>
          <a class="filter-btn" href="#/menu" aria-label="Filtri">${I.sliders}</a>
        </div>

        ${S.announcement ? `<div class="announce">${I.bike}<span>${esc(S.announcement)}</span></div>` : ""}

        ${HERO.length ? `
        <section class="hero" aria-roledescription="carosello" aria-label="In evidenza">
          <div class="hero-track" id="heroTrack">${HERO.map(slide).join("")}</div>
          ${HERO.length > 1 ? `<div class="dots" id="heroDots">${HERO.map((_, i) => `<button aria-label="Slide ${i + 1}" data-action="slide" data-i="${i}" class="${i ? "" : "active"}"></button>`).join("")}</div>` : ""}
        </section>` : ""}

        ${CATEGORIES.length ? `
        <nav class="cats" aria-label="Categorie">
          ${CATEGORIES.map((c, i) => `<a class="cat" href="#/category/${enc(c.id)}"><span class="cat-icon ${i === 0 ? "lead" : ""}">${catIcon(c)}</span><span class="cat-label">${esc(c.title)}</span></a>`).join("")}
        </nav>` : ""}

        ${featured.length ? `
        <section class="section">
          <div class="section-head"><h2 class="section-title">${esc(S.featured_title || "Più amati")}</h2><a class="link" href="#/menu">Vedi tutti ${I.arrow}</a></div>
          <div class="hscroll">${featured.map(card).join("")}</div>
        </section>` : ""}

        ${BANNERS.length ? `<section class="section promo-list">${BANNERS.map(promoBanner).join("")}</section>` : ""}

        ${CATEGORIES.map((c) => {
          const items = productsIn(c);
          if (!items.length) return "";
          return `
          <section class="section">
            <div class="section-head"><h2 class="section-title">${esc(c.title)}</h2><a class="link" href="#/category/${enc(c.id)}">Vedi tutti ${I.arrow}</a></div>
            <div class="grid">${items.map(card).join("")}</div>
          </section>`;
        }).join("")}

        ${!PRODUCTS.length ? empty("🛍️", "Catalogo in allestimento", "I prodotti saranno disponibili a breve.", "") : ""}
        ${S.footer ? `<p class="footer-note">${esc(S.footer)}</p>` : ""}
      </div>`;
  }

  let menuState = { q: "", cat: "" };

  function menuResults() {
    const q = norm(menuState.q);
    const list = PRODUCTS.filter((p) => {
      if (menuState.cat && p.category !== menuState.cat) return false;
      if (!q) return true;
      return norm([p.title, p.subtitle, p.description, p.category, p.badge].join(" ")).includes(q);
    });
    if (!list.length) return empty("🔎", "Nessun risultato", "Prova con un'altra parola o categoria.", "");
    if (!q && !menuState.cat)
      return CATEGORIES.map((c) => {
        const items = list.filter((p) => p.category === c.title);
        return items.length ? `<section class="section"><div class="section-head"><h2 class="section-title">${esc(c.icon)} ${esc(c.title)}</h2></div><div class="grid">${items.map(card).join("")}</div></section>` : "";
      }).join("");
    return `<p class="muted" style="margin:0 0 10px;font-size:13px">${list.length} ${list.length === 1 ? "prodotto" : "prodotti"}</p><div class="grid">${list.map(card).join("")}</div>`;
  }

  function viewMenu(params, catId) {
    const c = catId && catById(catId);
    if (catId && !c) return viewNotFound();
    menuState = { q: params.get("q") || "", cat: c ? c.title : "" };
    return `
      <div class="screen">
        ${topbar(c ? c.title : "Menu")}
        <div class="searchbar">
          <label class="field">${I.search}<input id="searchInput" type="search" placeholder="${esc(S.search_placeholder || "Cerca il tuo piatto preferito…")}" value="${esc(menuState.q)}" autocomplete="off" enterkeyhint="search"></label>
        </div>
        <div class="chips">
          <button class="chip ${!menuState.cat ? "active" : ""}" data-action="filter-cat" data-cat="">Tutto</button>
          ${CATEGORIES.map((x) => `<button class="chip ${menuState.cat === x.title ? "active" : ""}" data-action="filter-cat" data-cat="${esc(x.title)}">${esc(x.icon)} ${esc(x.title)}</button>`).join("")}
        </div>
        <div id="results">${menuResults()}</div>
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
            ${p.badge && p.available ? `<span class="pill-label">${esc(p.badge)}</span>` : ""}
            <h1>${esc(p.title)}</h1>
            <div class="detail-meta">
              ${rating(p)}
              ${c ? `<a class="pill" href="#/category/${enc(c.id)}">${esc(c.icon)} ${esc(c.title)}</a>` : ""}
              ${p.available ? `<span class="pill ok">${I.check} Disponibile</span>` : `<span class="pill no">Esaurito</span>`}
              ${S.delivery_time ? `<span class="pill">${I.clock} ${esc(S.delivery_time)}</span>` : ""}
            </div>
            <div style="margin-bottom:12px;font-size:24px">${priceTag(p)}</div>
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
            ${p.available ? `Aggiungi <span id="dSum">· ${money(p.price)}</span>` : "Non disponibile"}
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
        ${OFFERS.length ? `
          <div class="offers-list">
            ${OFFERS.map((o) => (o.placement === "banner" ? promoBanner(o) : slide(o))).join("")}
          </div>
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
      return `<div class="screen narrow">${topbar("Il tuo ordine")}${empty("🛒", "Il carrello è vuoto", "Aggiungi qualcosa di buono dal menu.")}</div>`;
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
                <div class="price" style="font-size:14.5px">${money(unitPrice(p, i.variant, i.extras) * i.qty)}</div>
              </div>
              <div class="qty sm">
                <button data-action="c-dec" data-key="${esc(i.key)}" aria-label="Diminuisci">${i.qty > 1 ? I.minus : I.trash}</button>
                <span>${i.qty}</span>
                <button class="plus" data-action="c-inc" data-key="${esc(i.key)}" aria-label="Aumenta">${I.plus}</button>
              </div>
            </div>`;
          }).join("")}
          <a class="link orange" href="#/menu" style="margin-top:12px">${I.plus} Aggiungi altri prodotti</a>
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

        <div class="card totals">
          <div class="line"><span>Subtotale</span><b>${money(t.subtotal)}</b></div>
          ${!t.pickup ? `<div class="line"><span>Consegna</span><b>${t.delivery ? money(t.delivery) : "Gratis"}</b></div>` : ""}
          ${t.discount ? `<div class="line discount"><span>Sconto</span><b>−${money(t.discount)}</b></div>` : ""}
          <div class="line total"><span>Totale</span><b>${money(t.total)}</b></div>
          ${freeLeft ? `<p class="hint">Aggiungi ancora ${money(freeLeft)} per la consegna gratuita</p>` : ""}
          ${t.belowMin ? `<p class="hint warn">Ordine minimo per la consegna: ${money(S.min_order)}</p>` : ""}
        </div>

        <div class="actionbar"><div class="inner">
          <button class="btn" data-action="send-order" ${t.belowMin ? "disabled" : ""}>
            ${S.order_channel === "telegram" ? I.send : I.chat}
            <span>Invia ordine</span><span class="spacer"></span><span>${money(t.total)}</span>
          </button>
        </div></div>
      </div>`;
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

  const menuItem = (m) => {
    const inner = `<span class="ic">${m.ic}</span><span class="tx">${esc(m.t)}${m.s ? `<small>${esc(m.s)}</small>` : ""}</span>${m.href ? I.chev : ""}`;
    const ext = m.href && /^https?:/.test(m.href) ? ' target="_blank" rel="noopener"' : "";
    return m.href ? `<a class="menu-item" href="${esc(m.href)}"${ext}>${inner}</a>` : `<div class="menu-item">${inner}</div>`;
  };

  function contactItems() {
    const list = [];
    if (S.phone) list.push({ ic: I.phone, t: "Telefono", s: S.phone, href: "tel:" + S.phone.replace(/\s+/g, "") });
    if (S.whatsapp) list.push({ ic: I.chat, t: "WhatsApp", s: "Scrivici", href: "https://wa.me/" + S.whatsapp.replace(/\D/g, "") });
    if (S.telegram) list.push({ ic: I.send, t: "Telegram", s: "@" + S.telegram.replace(/^@/, ""), href: "https://t.me/" + S.telegram.replace(/^@/, "") });
    if (S.instagram) list.push({ ic: I.insta, t: "Instagram", s: "@" + S.instagram.replace(/^@/, ""), href: "https://instagram.com/" + S.instagram.replace(/^@/, "") });
    if (S.email) list.push({ ic: I.mail, t: "Email", s: S.email, href: "mailto:" + S.email });
    return list;
  }

  function viewInfo() {
    const items = [];
    if (S.hours) items.push({ ic: I.clock, t: "Orari", s: S.hours });
    if (S.address) items.push({ ic: I.pin, t: "Indirizzo", s: S.address, href: "https://www.google.com/maps/search/?api=1&query=" + enc(S.address) });
    if (S.delivery_time) items.push({ ic: I.bike, t: "Consegna", s: `${S.delivery_time} · ${S.delivery_fee ? money(S.delivery_fee) : "gratis"}${S.free_delivery_over ? ` · gratis da ${money(S.free_delivery_over)}` : ""}` });
    const contacts = contactItems();
    return `
      <div class="screen narrow">
        ${topbar("Profilo")}
        <div class="profile">
          <div class="avatar">${S.logo ? `<img src="${esc(S.logo)}" alt="">` : esc(S.logo_icon || (S.store_name || "?").charAt(0))}</div>
          <h2>${esc(S.store_name)}</h2>
          ${S.about ? `<p>${esc(S.about)}</p>` : ""}
        </div>
        <div class="stats">
          <div><b>${PRODUCTS.length}</b><span>Prodotti</span></div>
          <div><b>${totals().count}</b><span>Nel carrello</span></div>
          <div><b>${favs.length}</b><span>Preferiti</span></div>
        </div>
        <div class="menu">
          ${menuItem({ ic: I.heart, t: "I miei preferiti", s: `${favs.length} salvati`, href: "#/favorites" })}
          ${menuItem({ ic: I.tag, t: "Offerte e codici promo", s: OFFERS.length ? `${OFFERS.length} attive` : "Nessuna al momento", href: "#/offers" })}
          ${menuItem({ ic: I.bag, t: "Il mio ordine", s: `${totals().count} articoli`, href: "#/cart" })}
        </div>
        ${items.length ? `<p class="card-title" style="margin:18px 4px 8px">Il locale</p><div class="menu">${items.map(menuItem).join("")}</div>` : ""}
        ${contacts.length ? `<p class="card-title" style="margin:18px 4px 8px">Contatti</p><div class="menu">${contacts.map(menuItem).join("")}</div>` : ""}
        ${S.footer ? `<p class="footer-note">${esc(S.footer)}</p>` : ""}
      </div>`;
  }

  const viewNotFound = () => `<div class="screen">${topbar("")}${empty("🤷", "Pagina non trovata", "Il contenuto che cerchi non esiste più.")}</div>`;

  // ---------- Drawer ----------
  const drawer = document.getElementById("drawer");
  function renderDrawer() {
    drawer.innerHTML = `
      <div class="scrim" data-action="drawer-close"></div>
      <aside class="panel" role="dialog" aria-modal="true" aria-label="Menu">
        <div class="panel-head">
          ${logoHtml()}
          <button class="icon-btn" data-action="drawer-close" aria-label="Chiudi menu">${I.close}</button>
        </div>
        <div class="menu">
          ${menuItem({ ic: I.home, t: "Home", href: "#/" })}
          ${menuItem({ ic: I.grid, t: "Menu completo", href: "#/menu" })}
          ${menuItem({ ic: I.tag, t: "Offerte", href: "#/offers" })}
          ${menuItem({ ic: I.heart, t: "Preferiti", href: "#/favorites" })}
          ${menuItem({ ic: I.bag, t: "Il mio ordine", href: "#/cart" })}
          ${menuItem({ ic: I.user, t: "Info e contatti", href: "#/info" })}
        </div>
        ${CATEGORIES.length ? `<p class="card-title" style="margin:18px 4px 8px">Categorie</p>
        <div class="menu">${CATEGORIES.map((c) => menuItem({ ic: `<span style="font-size:19px">${esc(c.icon || "🍽️")}</span>`, t: c.title, s: `${productsIn(c).length} prodotti`, href: `#/category/${enc(c.id)}` })).join("")}</div>` : ""}
        ${S.hours ? `<p class="hint" style="text-align:center;margin-top:18px">${esc(S.hours)}</p>` : ""}
      </aside>`;
  }
  let lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.classList.add("open");
    drawer.removeAttribute("inert");
    document.body.classList.add("no-scroll");
    const btn = drawer.querySelector(".panel .icon-btn");
    if (btn) btn.focus();
  }
  function closeDrawer() {
    if (!drawer.classList.contains("open")) return;
    drawer.classList.remove("open");
    drawer.setAttribute("inert", "");
    document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }

  // ---------- Hero carousel ----------
  let heroTimer = null;
  function setupHero() {
    clearInterval(heroTimer);
    const track = document.getElementById("heroTrack");
    const dots = document.getElementById("heroDots");
    if (!track || !dots) return;
    const n = HERO.length;
    const current = () => Math.round(track.scrollLeft / track.clientWidth);
    track.addEventListener("scroll", () => {
      const i = current();
      dots.querySelectorAll("button").forEach((b, j) => b.classList.toggle("active", i === j));
    }, { passive: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = () => {
      clearInterval(heroTimer);
      heroTimer = setInterval(() => {
        if (!document.body.contains(track)) return clearInterval(heroTimer);
        track.scrollTo({ left: ((current() + 1) % n) * track.clientWidth, behavior: "smooth" });
      }, 5000);
    };
    ["pointerdown", "touchstart", "focusin"].forEach((ev) => track.addEventListener(ev, () => clearInterval(heroTimer), { passive: true }));
    start();
  }

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
      copyText(msg);
      window.open("https://t.me/" + enc(String(S.telegram || "").replace(/^@/, "")), "_blank", "noopener");
    } else {
      window.open(`https://wa.me/${String(S.whatsapp || "").replace(/\D/g, "")}?text=${enc(msg)}`, "_blank", "noopener");
    }
  }

  function sendOrder() {
    const t = totals();
    if (!customer.name.trim()) return toast("Inserisci il tuo nome"), focusField("name");
    if (!t.pickup && !customer.address.trim()) return toast("Inserisci l'indirizzo"), focusField("address");
    if (t.belowMin) return toast(`Ordine minimo ${money(S.min_order)}`);
    if (!(S.order_channel === "telegram" ? S.telegram : S.whatsapp)) return toast("Contatto per gli ordini non configurato");
    const msg = buildMessage(t);
    lastOrder = { msg, total: t.total, count: t.count, pickup: t.pickup };
    openOrder(msg);
    cart = [];
    promo = "";
    save();
    updateBadges();
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

  // ---------- Toast / badges ----------
  let toastTimer;
  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1800);
  }
  function updateBadges() {
    const n = cart.reduce((s, i) => s + i.qty, 0);
    document.querySelectorAll("[data-cart-badge]").forEach((b) => { b.textContent = n > 99 ? "99+" : n; b.hidden = n === 0; });
  }

  // ---------- Router ----------
  const scrollPos = {};
  let currentHash = null;
  const navStack = []; // cronologia interna, per il tasto indietro

  function route() {
    closeDrawer();
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
      case "menu":
      case "search": html = viewMenu(params); tab = "menu"; break;
      case "category": html = viewMenu(params, parts[1]); tab = "menu"; break;
      case "product": html = viewProduct(parts[1]); tab = "menu"; break;
      case "offers": html = viewOffers(); tab = "offers"; break;
      case "favorites": html = viewFavorites(); tab = "profile"; break;
      case "cart": html = viewCart(); tab = "order"; break;
      case "done": html = viewDone(); tab = "order"; break;
      case "info": html = viewInfo(); tab = "profile"; break;
      default: html = viewNotFound(); tab = "";
    }

    app.innerHTML = html;
    document.querySelectorAll(".tabbar a").forEach((a) => {
      const on = a.dataset.tab === tab;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    updateBadges();
    setupHero();
    window.scrollTo(0, scrollPos[hash] || 0);

    if (parts[0] === "search") {
      const input = document.getElementById("searchInput");
      if (input) input.focus();
    }
    const titles = { menu: "Menu", search: "Cerca", cart: "Il tuo ordine", favorites: "Preferiti", info: "Profilo", offers: "Offerte" };
    const p = parts[0] === "product" && byId(parts[1]);
    const c = parts[0] === "category" && catById(parts[1]);
    const t = p ? p.title : c ? c.title : titles[parts[0]];
    document.title = t ? `${t} · ${S.store_name}` : S.store_name;
  }

  function rerenderCart() {
    const y = window.scrollY;
    app.innerHTML = viewCart();
    updateBadges();
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
      case "drawer": openDrawer(); break;
      case "drawer-close": closeDrawer(); break;
      case "back":
        if (navStack.length > 1) history.back();
        else location.hash = "#/";
        break;
      case "slide": {
        const track = document.getElementById("heroTrack");
        clearInterval(heroTimer);
        track.scrollTo({ left: Number(el.dataset.i) * track.clientWidth, behavior: "smooth" });
        break;
      }
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
        if (p.variants.length || p.extras.length) location.hash = "#/product/" + enc(p.id);
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
        menuState.cat = el.dataset.cat;
        app.querySelectorAll('[data-action="filter-cat"]').forEach((c) => c.classList.toggle("active", c === el));
        document.getElementById("results").innerHTML = menuResults();
        break;
      case "d-inc": detail.qty = Math.min(99, detail.qty + 1); updateDetailSum(); break;
      case "d-dec": detail.qty = Math.max(1, detail.qty - 1); updateDetailSum(); break;
      case "d-add": addToCart(detail.id, detail.variant, [...detail.extras], detail.qty); break;
      case "c-inc":
      case "c-dec": {
        const line = cart.find((i) => i.key === el.dataset.key);
        if (!line) break;
        line.qty += a === "c-inc" ? 1 : -1;
        if (line.qty <= 0) cart = cart.filter((i) => i !== line);
        save(); rerenderCart();
        break;
      }
      case "clear-cart":
        if (confirm("Svuotare il carrello?")) { cart = []; save(); rerenderCart(); }
        break;
      case "mode": customer.mode = el.dataset.mode; save(); rerenderCart(); break;
      case "apply-promo": {
        const v = (document.getElementById("promoInput").value || "").trim().toUpperCase();
        if (!v) break;
        promo = v; save(); rerenderCart();
        const t = totals();
        toast(t.offer ? "Codice applicato" : t.promoError);
        break;
      }
      case "remove-promo": promo = ""; save(); rerenderCart(); break;
      case "send-order": sendOrder(); break;
      case "resend": if (lastOrder) openOrder(lastOrder.msg); break;
    }
  });

  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "searchInput") {
      menuState.q = t.value;
      document.getElementById("results").innerHTML = menuResults();
    } else if (t.dataset.field) {
      customer[t.dataset.field] = t.value;
      save();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
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
  renderDrawer();
  route();
})();
