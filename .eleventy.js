// Configurazione Eleventy
// I contenuti (prodotti, categorie, offerte, impostazioni) vengono gestiti da /admin (Decap CMS)
// e trasformati in un unico JSON letto dall'app (assets/app.js).

const toNumber = (v) => {
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

const byOrder = (a, b) =>
  (toNumber(a.data.order) || 999) - (toNumber(b.data.order) || 999) ||
  String(a.data.title).localeCompare(String(b.data.title));

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("assets");
  eleventyConfig.addPassthroughCopy("img");
  eleventyConfig.addPassthroughCopy("admin");

  ["products", "categories", "offers"].forEach((name) => {
    eleventyConfig.addCollection(name, (api) =>
      api.getFilteredByGlob(`src/${name}/*.md`).sort(byOrder)
    );
  });

  // Costruisce il catalogo completo usato dal frontend
  eleventyConfig.addFilter("catalog", (collections, settings) => {
    const categories = collections.categories
      .filter((c) => c.data.visible !== false)
      .map((c) => ({
        id: c.fileSlug,
        title: c.data.title,
        icon: c.data.icon || "",
        image: c.data.image || "",
      }));

    const products = collections.products
      .filter((p) => p.data.visible !== false)
      .map((p) => ({
        id: p.fileSlug,
        title: p.data.title,
        category: p.data.category || "",
        subtitle: p.data.subtitle || "",
        description: p.data.description || "",
        image: p.data.image || "",
        price: toNumber(p.data.price),
        old_price: toNumber(p.data.old_price),
        badge: p.data.badge || "",
        featured: !!p.data.featured,
        available: p.data.available !== false,
        extras: (p.data.extras || []).map((e) => ({
          name: e.name,
          price: toNumber(e.price),
        })),
        variants: (p.data.variants || []).map((v) => ({
          name: v.name,
          price: toNumber(v.price),
        })),
      }));

    const offers = collections.offers
      .filter((o) => o.data.active !== false)
      .map((o) => ({
        id: o.fileSlug,
        title: o.data.title,
        subtitle: o.data.subtitle || "",
        code: (o.data.code || "").toUpperCase(),
        image: o.data.image || "",
        color: o.data.color || "orange",
        discount_type: o.data.discount_type || "none",
        discount_value: toNumber(o.data.discount_value),
        min_order: toNumber(o.data.min_order),
        max_discount: toNumber(o.data.max_discount),
      }));

    const s = settings || {};
    return JSON.stringify({
      settings: {
        ...s,
        delivery_fee: toNumber(s.delivery_fee),
        free_delivery_over: toNumber(s.free_delivery_over),
        min_order: toNumber(s.min_order),
      },
      categories,
      products,
      offers,
    }).replace(/</g, "\\u003c");
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      data: "_data",
      output: "dist",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
  };
};
