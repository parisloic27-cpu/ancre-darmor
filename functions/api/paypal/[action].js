// Paiement PayPal (boutons modernes : PayPal + carte bancaire) — Cloudflare Pages Function
//   GET  /api/paypal/config   → identifiant public de l'application PayPal
//   POST /api/paypal/create   → crée la commande du panier ; les prix sont calculés ICI, pas dans la page
//   POST /api/paypal/capture  → encaisse la commande après validation par le client
// Variables à définir dans Cloudflare Pages > Settings > Variables and secrets :
//   PAYPAL_CLIENT_ID  (texte)   Client ID de l'application PayPal « Live »
//   PAYPAL_SECRET     (secret)  Secret key de cette application
// Fichier généré par build.py (catalogue et promo ci-dessous) : modifier build.py plutôt que ce fichier.

const CATALOG = {
 "B-MUG-AME": {
  "name": "Mug « L'âme de la Bretagne »",
  "price": "23.90",
  "digital": false
 },
 "B-TOTE-BZH": {
  "name": "Sac cabas « Bretagne »",
  "price": "29.90",
  "digital": false
 },
 "B-BOULE-NOEL": {
  "name": "Décoration de Noël « Joyeux Noël Bretagne »",
  "price": "17.90",
  "digital": false
 },
 "G-FIN": {
  "name": "Guide « Le Finistère »",
  "price": "9.90",
  "digital": true
 }
};
const PROMO = {"code": "BREIZH15", "pct": 15, "end": "2026-11-17T23:59:59+01:00"};
const API = 'https://api-m.paypal.com';

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});

async function token(env) {
  const r = await fetch(API + '/v1/oauth2/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + btoa(env.PAYPAL_CLIENT_ID + ':' + env.PAYPAL_SECRET),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!r.ok) throw new Error('auth ' + r.status);
  return (await r.json()).access_token;
}

// Prix en centimes, arrondi comme sur la page (23,90 € à -15 % = 20,32 €)
const cents = (eur) => Math.round(parseFloat(eur) * 100);
const fmt = (c) => (c / 100).toFixed(2);

// Panier : { items: [{ ref, qty }], code } (ancien format { ref, qty, code } accepté aussi)
export function priceOrder(body, now = Date.now()) {
  body = body || {};
  let list = Array.isArray(body.items) ? body.items : [{ ref: body.ref, qty: body.qty }];
  if (!list.length || list.length > 10) return { error: 'Panier vide ou trop grand' };
  const code = String(body.code || '').trim().toUpperCase();
  const promoOn = !!(PROMO && code === PROMO.code && now < Date.parse(PROMO.end));
  const seen = {};
  const items = [];
  let total = 0, physical = false, promoUsed = false;
  for (const it of list) {
    const ref = it && it.ref;
    const p = CATALOG[ref];
    if (!p) return { error: 'Produit inconnu' };
    if (seen[ref]) return { error: 'Produit en double' };
    seen[ref] = 1;
    let qty = parseInt(it.qty, 10) || 1;
    if (p.digital) qty = 1;
    if (qty < 1 || qty > 6) return { error: 'Quantité non valide' };
    let unit = cents(p.price);
    const promo = promoOn && !p.digital;
    if (promo) { unit = Math.round(unit * (100 - PROMO.pct) / 100); promoUsed = true; }
    if (!p.digital) physical = true;
    total += unit * qty;
    items.push({
      name: (p.name + (promo ? ` · code ${PROMO.code} (-${PROMO.pct} %)` : '')).slice(0, 127),
      sku: ref, quantity: String(qty),
      unit_amount: { currency_code: 'EUR', value: fmt(unit) },
      category: p.digital ? 'DIGITAL_GOODS' : 'PHYSICAL_GOODS',
    });
  }
  return {
    total: fmt(total),
    order: {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: 'panier',
        description: "Commande Ancre d'Armor",
        custom_id: promoUsed ? PROMO.code : undefined,
        amount: {
          currency_code: 'EUR',
          value: fmt(total),
          breakdown: { item_total: { currency_code: 'EUR', value: fmt(total) } },
        },
        items,
      }],
      application_context: {
        brand_name: "Ancre d'Armor",
        locale: 'fr-FR',
        user_action: 'PAY_NOW',
        shipping_preference: physical ? 'GET_FROM_FILE' : 'NO_SHIPPING',
      },
    },
  };
}

export async function onRequest({ request, env, params }) {
  const action = params.action;
  if (!env.PAYPAL_CLIENT_ID || !env.PAYPAL_SECRET) return json({ error: 'Paiement non configuré' }, 503);

  if (action === 'config' && request.method === 'GET') {
    return new Response(JSON.stringify({ clientId: env.PAYPAL_CLIENT_ID }), {
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=300' },
    });
  }
  if (request.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Requête non valide' }, 400); }

  try {
    if (action === 'create') {
      const r0 = priceOrder(body);
      if (r0.error) return json({ error: r0.error }, 400);
      const r = await fetch(API + '/v2/checkout/orders', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (await token(env)), 'Content-Type': 'application/json' },
        body: JSON.stringify(r0.order),
      });
      const d = await r.json();
      if (!r.ok) return json({ error: 'PayPal a refusé la commande', detail: d.name || r.status }, 502);
      return json({ id: d.id });
    }
    if (action === 'capture') {
      const id = String(body.orderID || '');
      if (!/^[A-Z0-9]{10,30}$/.test(id)) return json({ error: 'Commande non valide' }, 400);
      const r = await fetch(API + '/v2/checkout/orders/' + id + '/capture', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + (await token(env)), 'Content-Type': 'application/json' },
      });
      const d = await r.json();
      if (!r.ok) {
        const issue = d.details && d.details[0] && d.details[0].issue;
        return json({ error: 'Paiement non abouti', issue: issue || d.name || r.status }, 502);
      }
      return json({ status: d.status, id: d.id });
    }
  } catch (e) {
    return json({ error: 'Service de paiement indisponible' }, 502);
  }
  return json({ error: 'Action inconnue' }, 404);
}
