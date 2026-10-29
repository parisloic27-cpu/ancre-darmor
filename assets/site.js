// Ancre d'Armor — scripts communs
document.addEventListener('DOMContentLoaded', function () {
  // Menu mobile
  var t = document.querySelector('.tog'), m = document.getElementById('menu');
  if (t && m) {
    t.addEventListener('click', function () {
      var o = m.classList.toggle('open');
      t.setAttribute('aria-expanded', o);
    });
  }

  // Formulaire de contact : objet pré-rempli via ?objet=...
  var obj = new URLSearchParams(location.search).get('objet');
  var field = document.getElementById('objet');
  if (obj && field) field.value = obj;

  // Galerie produit : les miniatures changent l'image principale
  document.querySelectorAll('.gal').forEach(function (g) {
    var main = g.querySelector('.pimg'), img = main.querySelector('img');
    g.querySelectorAll('.thumbs button').forEach(function (b) {
      b.addEventListener('click', function () {
        img.src = b.dataset.src; img.alt = b.dataset.alt; main.href = b.dataset.big;
        g.querySelectorAll('.thumbs button').forEach(function (x) { x.removeAttribute('aria-current'); });
        b.setAttribute('aria-current', 'true');
      });
    });
  });

  // Photo animée : à l'arrêt si l'utilisateur préfère moins d'animations
  var cine = document.querySelector('video.cine');
  if (cine && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cine.removeAttribute('autoplay'); cine.pause();
  }

  // Code promo : bandeau avec décompte + application dans la boutique
  var pb = document.querySelector('.promo');
  if (pb) {
    var END = new Date(pb.dataset.end).getTime(), CODE = pb.dataset.code, PCT = +pb.dataset.pct;
    if (Date.now() < END) {
      pb.hidden = false;
      var els = {}, prev = {};
      pb.querySelectorAll('[data-k]').forEach(function (b) { els[b.dataset.k] = b; });
      var tick = function () {
        var r = Math.max(0, END - Date.now());
        if (!r) { pb.hidden = true; clearInterval(tm); return; }
        var v = { d: Math.floor(r / 864e5), h: Math.floor(r / 36e5) % 24, m: Math.floor(r / 6e4) % 60, s: Math.floor(r / 1e3) % 60 };
        Object.keys(v).forEach(function (k) {
          var t = (v[k] < 10 ? '0' : '') + v[k];
          if (t !== prev[k]) {
            els[k].textContent = t; prev[k] = t;
            els[k].classList.remove('tick'); void els[k].offsetWidth; els[k].classList.add('tick');
          }
        });
      };
      tick(); var tm = setInterval(tick, 1000);
      var cb = pb.querySelector('.pcode'), lab = cb.querySelector('small');
      cb.addEventListener('click', function () {
        var done = function () { lab.textContent = 'copié !'; setTimeout(function () { lab.textContent = 'copier'; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(CODE).then(done, function () {}); else done();
      });

    }
  }

  // ===== Panier =====
  // Contenu gardé dans le navigateur du visiteur (localStorage, ou en mémoire si indisponible).
  // Les prix affichés viennent de la page ; le prix payé est recalculé côté serveur (/api/paypal/create).
  var LS = (function () { var mem = {}; return {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return mem[k] || null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) { mem[k] = v; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) { delete mem[k]; } }
  }; })();
  var CKEY = 'ancre-panier';
  var readCart = function () { try { var c = JSON.parse(LS.get(CKEY) || '[]'); return Array.isArray(c) ? c : []; } catch (e) { return []; } };
  var writeCart = function (c) { if (c.length) LS.set(CKEY, JSON.stringify(c)); else LS.del(CKEY); badge(); };
  var eur = function (c) { return (c / 100).toFixed(2).replace('.', ',') + ' €'; };
  var cents = function (p) { return Math.round(parseFloat(p) * 100); };
  var count = function (c) { return c.reduce(function (n, i) { return n + (+i.qty || 0); }, 0); };
  function badge() {
    var n = count(readCart());
    document.querySelectorAll('.cartl .cnt').forEach(function (b) { b.textContent = n; b.hidden = !n; });
    document.querySelectorAll('.cartl').forEach(function (a) { a.setAttribute('aria-label', n ? 'Mon panier : ' + n + ' article' + (n > 1 ? 's' : '') : 'Mon panier'); });
  }
  badge();
  window.addEventListener('storage', function (e) { if (e.key === CKEY) badge(); });

  // Promo : code, fin, et « un achat par personne » (indicateur gardé dans le navigateur)
  var PROMO = pb && Date.now() < END ? { code: CODE, pct: PCT } : null;
  var PKEY = PROMO ? 'promo-utilise-' + PROMO.code : null;
  var qs = new URLSearchParams(location.search);
  if (PROMO && (qs.get('code') || '').toUpperCase() === PROMO.code) LS.set('panier-code', PROMO.code);
  if (PKEY && qs.get('paiement') === 'annule' && LS.get(PKEY) === 'en-cours') LS.del(PKEY);
  if (/^\/merci/.test(location.pathname)) {
    if (PKEY && LS.get(PKEY) === 'en-cours') LS.set(PKEY, 'paye');
    if (LS.get('panier-envoye')) { LS.del('panier-envoye'); LS.del('panier-code'); writeCart([]); }
  }

  // Animation : la vignette du produit s'envole en arc jusqu'au panier
  var fcart = null, fcartT;
  var floatCart = function () {
    if (!fcart) {
      fcart = document.createElement('a'); fcart.href = '/panier'; fcart.className = 'fcart';
      fcart.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/></svg><span class="cnt"></span>';
      document.body.appendChild(fcart);
    }
    var n = count(readCart()), c = fcart.querySelector('.cnt');
    c.textContent = n; fcart.setAttribute('aria-label', 'Mon panier : ' + n + ' article' + (n > 1 ? 's' : ''));
    fcart.classList.add('on'); clearTimeout(fcartT);
    fcartT = setTimeout(function () { fcart.classList.remove('on'); }, 4500);
    return fcart;
  };
  var bumpCart = function (el) {
    [el].concat([].slice.call(document.querySelectorAll('.cartl'))).forEach(function (l) {
      if (!l) return; l.classList.remove('bump'); void l.offsetWidth; l.classList.add('bump');
    });
  };
  function flyToCart(buyEl, imgSrc) {
    var head = document.querySelector('.cartl'), hr = head && head.getBoundingClientRect();
    var visible = hr && hr.bottom > 0 && hr.top < innerHeight;
    var target = visible ? head : floatCart();
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !document.body.animate) { bumpCart(target); return; }
    var card = buyEl.closest('.card'), src = card && card.querySelector('.pimg img');
    var ir = src && src.getBoundingClientRect();
    var useImg = ir && ir.top > 0 && ir.top + Math.min(ir.height, 260) / 2 < innerHeight - 40;
    var from = (useImg ? src : buyEl.querySelector('.addc')).getBoundingClientRect();
    var to = target.getBoundingClientRect();
    var size = 64;
    var x0 = from.left + from.width / 2 - size / 2, y0 = from.top + Math.min(from.height, 260) / 2 - size / 2;
    if (!useImg) { y0 = from.top - size / 2 - 6; }
    var x1 = to.left + to.width / 2 - size / 2, y1 = to.top + to.height / 2 - size / 2;
    var outer = document.createElement('div'), inner = document.createElement('div'), im = document.createElement('img');
    outer.className = 'fly'; inner.className = 'fly-i'; im.src = (src && src.currentSrc) || imgSrc; im.alt = '';
    inner.appendChild(im); outer.appendChild(inner); document.body.appendChild(outer);
    var dur = Math.min(950, Math.max(650, Math.hypot(x1 - x0, y1 - y0) * 0.9));
    // Horizontal régulier + vertical qui monte puis plonge = trajectoire en arc
    outer.animate([{ transform: 'translateX(' + x0 + 'px)' }, { transform: 'translateX(' + x1 + 'px)' }], { duration: dur, easing: 'cubic-bezier(.3,0,.6,1)', fill: 'forwards' });
    var lift = Math.min(140, Math.abs(y1 - y0) * 0.35 + 60);
    var a = inner.animate([
      { transform: 'translateY(' + y0 + 'px) scale(.6) rotate(0deg)', opacity: 0 },
      { transform: 'translateY(' + (y0 - lift) + 'px) scale(1.05) rotate(-8deg)', opacity: 1, offset: 0.3 },
      { transform: 'translateY(' + y1 + 'px) scale(.28) rotate(12deg)', opacity: .85 }
    ], { duration: dur, easing: 'cubic-bezier(.45,0,.75,.6)', fill: 'forwards' });
    a.onfinish = function () { outer.remove(); bumpCart(target); sparkle(target); };
  }
  var sparkle = function (el) {
    var r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    for (var i = 0; i < 6; i++) {
      var d = document.createElement('i'); d.className = 'spark'; document.body.appendChild(d);
      var ang = i / 6 * Math.PI * 2, dist = 22 + Math.random() * 10;
      d.animate([
        { transform: 'translate(' + cx + 'px,' + cy + 'px) scale(1)', opacity: 1 },
        { transform: 'translate(' + (cx + Math.cos(ang) * dist) + 'px,' + (cy + Math.sin(ang) * dist) + 'px) scale(.2)', opacity: 0 }
      ], { duration: 520, easing: 'ease-out', fill: 'forwards' }).onfinish = (function (x) { return function () { x.remove(); }; })(d);
    }
  };

  // Boutons « Ajouter au panier »
  document.querySelectorAll('.buy').forEach(function (b) {
    var btn = b.querySelector('.addc'), sel = b.querySelector('select'), out = b.querySelector('.added'), tmo;
    btn.addEventListener('click', function () {
      var d = b.dataset, c = readCart(), q = sel ? +sel.value : 1, it = null;
      c.forEach(function (i) { if (i.ref === d.ref) it = i; });
      if (it) it.qty = 'digital' in d ? 1 : Math.min(6, it.qty + q);
      else c.push({ ref: d.ref, qty: q, name: d.name, price: d.price, img: d.img, url: d.url, digital: 'digital' in d });
      writeCart(c);
      out.innerHTML = '';
      var t = document.createElement('span'); t.textContent = ('digital' in d && it ? 'Déjà dans votre panier. ' : 'Ajouté au panier ! ');
      var a = document.createElement('a'); a.href = '/panier'; a.textContent = 'Voir le panier →';
      out.appendChild(t); out.appendChild(a); out.classList.add('on');
      btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop');
      flyToCart(b, d.img);
      clearTimeout(tmo); tmo = setTimeout(function () { out.classList.remove('on'); }, 6000);
    });
  });

  // Page panier
  var cartEl = document.querySelector('.cart');
  if (cartEl) {
    var CAT = {};
    try { CAT = JSON.parse(document.getElementById('cart-cat').textContent); } catch (e) {}
    var list = cartEl.querySelector('.cart-items'), empty = cartEl.querySelector('.cart-empty'), full = cartEl.querySelector('.cart-full');
    var f = cartEl.querySelector('form[data-pay-cart]'), msg = f.querySelector('.pp-msg');
    var cgv = f.querySelector('[data-required]'), retr = f.querySelector('.retr'), retrBox = f.querySelector('[data-required-digital]');
    var inp = cartEl.querySelector('[data-promo]'), pmsg = cartEl.querySelector('.cart-promo .pmsg');
    var S = function (k) { return cartEl.querySelector('[data-sum="' + k + '"]'); };
    var codeOn = false;

    // Remet les articles à jour avec le catalogue de la page (prix, noms), retire les produits disparus
    var clean = function () {
      var c = readCart().filter(function (i) { return CAT[i.ref]; }).map(function (i) {
        var p = CAT[i.ref]; return { ref: i.ref, qty: p.digital ? 1 : Math.max(1, Math.min(6, +i.qty || 1)), name: p.name, price: p.price, img: p.img, url: p.url, digital: p.digital };
      });
      writeCart(c); return c;
    };
    var hasDigital = function (c) { return c.some(function (i) { return i.digital; }); };
    var hasPhysical = function (c) { return c.some(function (i) { return !i.digital; }); };
    var ready = function () {
      var c = readCart();
      return c.length && cgv.checked && (!hasDigital(c) || retrBox.checked);
    };
    var lines = function () {
      var c = readCart(), sub = 0, disc = 0;
      c.forEach(function (i) {
        var u = cents(i.price), l = u * i.qty; sub += l;
        if (codeOn && !i.digital) disc += l - Math.round(u * (100 - PROMO.pct) / 100) * i.qty;
      });
      return { c: c, sub: sub, disc: disc, tot: sub - disc };
    };

    var render = function () {
      var L = lines(), c = L.c;
      empty.hidden = !!c.length; full.hidden = !c.length;
      list.innerHTML = '';
      c.forEach(function (i) {
        var li = document.createElement('li'); li.className = 'ci';
        var img = document.createElement('img'); img.src = i.img; img.alt = ''; img.width = 96; img.height = 96; img.loading = 'lazy';
        var bd = document.createElement('div'); bd.className = 'ci-bd';
        var nm = document.createElement('a'); nm.className = 'ci-n'; nm.href = i.url; nm.textContent = i.name;
        var pr = document.createElement('p'); pr.className = 'ci-p';
        var u = cents(i.price), du = codeOn && !i.digital ? Math.round(u * (100 - PROMO.pct) / 100) : u;
        pr.innerHTML = (du !== u ? '<s>' + eur(u) + '</s> ' : '') + '<span>' + eur(du) + '</span>' + (i.digital ? ' · guide PDF envoyé par e-mail' : ' · frais de port inclus');
        bd.appendChild(nm); bd.appendChild(pr);
        var ctl = document.createElement('div'); ctl.className = 'ci-ctl';
        if (!i.digital) {
          var st = document.createElement('div'); st.className = 'step';
          var mk = function (txt, lab, dq) { var b = document.createElement('button'); b.type = 'button'; b.textContent = txt; b.setAttribute('aria-label', lab);
            b.addEventListener('click', function () { var cc = readCart(); cc.forEach(function (x) { if (x.ref === i.ref) x.qty = Math.max(1, Math.min(6, x.qty + dq)); }); writeCart(cc); render(); });
            return b; };
          var q = document.createElement('output'); q.textContent = i.qty; q.setAttribute('aria-label', 'Quantité');
          var minus = mk('−', 'Retirer un exemplaire de ' + i.name, -1), plus = mk('+', 'Ajouter un exemplaire de ' + i.name, 1);
          minus.disabled = i.qty <= 1; plus.disabled = i.qty >= 6;
          st.appendChild(minus); st.appendChild(q); st.appendChild(plus); ctl.appendChild(st);
        }
        var rm = document.createElement('button'); rm.type = 'button'; rm.className = 'ci-rm'; rm.textContent = 'Retirer';
        rm.setAttribute('aria-label', 'Retirer ' + i.name + ' du panier');
        rm.addEventListener('click', function () { writeCart(readCart().filter(function (x) { return x.ref !== i.ref; })); render(); });
        ctl.appendChild(rm);
        var lt = document.createElement('p'); lt.className = 'ci-t'; lt.textContent = eur(du * i.qty);
        li.appendChild(img); li.appendChild(bd); li.appendChild(ctl); li.appendChild(lt);
        list.appendChild(li);
      });
      S('sub').textContent = eur(L.sub);
      S('disc').parentNode.hidden = !L.disc;
      S('disc').textContent = '− ' + eur(L.disc);
      S('code').textContent = codeOn ? PROMO.code + ' (−' + PROMO.pct + ' %)' : '';
      S('tot').textContent = eur(L.tot);
      S('ship').textContent = hasPhysical(c) ? 'Frais de port inclus · Livraison en France métropolitaine' : 'Guide envoyé par e-mail sous 24 heures';
      retr.hidden = !hasDigital(c);
      if (retr.hidden) retrBox.checked = false;
      sync();
    };

    // Code promo dans le panier
    var applyCode = function () {
      if (!inp || !PROMO) return;
      var v = inp.value.trim().toUpperCase(), deja = v === PROMO.code && LS.get(PKEY);
      codeOn = v === PROMO.code && !deja;
      inp.classList.toggle('ok', codeOn);
      pmsg.className = 'pmsg' + (codeOn ? ' ok' : '');
      pmsg.textContent = codeOn ? (hasPhysical(readCart()) ? 'Code appliqué : −' + PROMO.pct + ' % sur les créations' : 'Le code s\'applique aux créations, pas aux guides')
        : deja ? 'Code déjà utilisé : offre limitée à un achat par personne' : (v && v.length >= PROMO.code.length ? 'Code non valide' : '');
      if (codeOn) LS.set('panier-code', PROMO.code); else if (!v) LS.del('panier-code');
      render();
    };
    if (inp && PROMO) {
      inp.closest('.promo-f').hidden = false;
      inp.addEventListener('input', applyCode);
      if (LS.get('panier-code') === PROMO.code) inp.value = PROMO.code;
    }

    // Paiement
    var acts = [], lock = f.querySelector('.pp-lock'), box = f.querySelector('.pp'), wait = f.querySelector('.pp-wait'), fb = f.querySelector('.pp-fallback');
    function sync() {
      var o = ready(), c = readCart();
      lock.textContent = hasDigital(c) ? 'Cochez les deux cases ci-dessus pour payer.' : 'Cochez la case ci-dessus pour payer.';
      lock.hidden = o; box.classList.toggle('locked', !o); fb.disabled = !o;
      acts.forEach(function (a) { if (o) a.enable(); else a.disable(); });
      if (o) msg.textContent = '';
    }
    f.addEventListener('change', sync);
    var payload = function () {
      return { items: readCart().map(function (i) { return { ref: i.ref, qty: i.qty }; }), code: codeOn ? PROMO.code : '' };
    };
    var started = function () { if (codeOn && PKEY) LS.set(PKEY, 'en-cours'); LS.set('panier-envoye', '1'); };
    var post = function (url, data) {
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (d) { d._ok = r.ok; return d; }); });
    };

    // Repli si les boutons modernes ne se chargent pas : panier PayPal classique (plusieurs articles)
    var fallback = function () {
      wait.hidden = true; box.hidden = true; fb.hidden = false; sync();
    };
    fb.addEventListener('click', function () {
      if (!ready()) { msg.textContent = 'Merci de cocher les cases avant de payer.'; return; }
      var L = lines(), fm = document.createElement('form');
      fm.method = 'post'; fm.action = 'https://www.paypal.com/cgi-bin/webscr';
      var add = function (n, v) { var x = document.createElement('input'); x.type = 'hidden'; x.name = n; x.value = v; fm.appendChild(x); };
      add('cmd', '_cart'); add('upload', '1'); add('business', cartEl.dataset.business); add('currency_code', 'EUR'); add('lc', 'FR'); add('charset', 'utf-8');
      add('return', cartEl.dataset.return); add('cancel_return', cartEl.dataset.cancel); add('no_shipping', hasPhysical(L.c) ? '2' : '1');
      L.c.forEach(function (i, k) {
        var u = cents(i.price); if (codeOn && !i.digital) u = Math.round(u * (100 - PROMO.pct) / 100);
        add('item_name_' + (k + 1), i.name + (codeOn && !i.digital ? ' · code ' + PROMO.code + ' (-' + PROMO.pct + ' %)' : ''));
        add('item_number_' + (k + 1), i.ref); add('amount_' + (k + 1), (u / 100).toFixed(2)); add('quantity_' + (k + 1), i.qty);
      });
      document.body.appendChild(fm); started(); fm.submit();
    });

    var setup = function () {
      if (!window.paypal || !paypal.Buttons) return fallback();
      var slot = box.querySelector('.pp-btns'), n = 0;
      var opts = {
        style: { shape: 'pill', height: 48 },
        onInit: function (d, a) { acts.push(a); sync(); },
        onClick: function () { if (!ready()) msg.textContent = 'Merci de cocher ' + (hasDigital(readCart()) ? 'les deux cases' : 'la case') + ' avant de payer.'; },
        createOrder: function () {
          msg.textContent = ''; started();
          return post('/api/paypal/create', payload()).then(function (d) {
            if (!d._ok || !d.id) throw new Error(d.error || 'commande');
            return d.id;
          });
        },
        onApprove: function (data, actions) {
          return post('/api/paypal/capture', { orderID: data.orderID }).then(function (d) {
            if (d._ok && d.status === 'COMPLETED') { location.href = '/merci?commande=' + encodeURIComponent(d.id); return; }
            if (d.issue === 'INSTRUMENT_DECLINED') return actions.restart();
            msg.textContent = "Le paiement n'a pas abouti et rien n'a été débité. Réessayez ou contactez-moi.";
          });
        },
        onCancel: function () {
          if (PKEY && LS.get(PKEY) === 'en-cours') LS.del(PKEY);
          LS.del('panier-envoye');
          msg.textContent = 'Paiement annulé : votre panier est conservé.';
        },
        onError: function () { LS.del('panier-envoye'); msg.textContent = "Le paiement n'a pas pu démarrer. Réessayez dans un instant ou contactez-moi."; }
      };
      [paypal.FUNDING.PAYPAL, paypal.FUNDING.CARD].forEach(function (src) {
        var o = {}; for (var k in opts) o[k] = opts[k]; o.fundingSource = src;
        var b = paypal.Buttons(o);
        if (b.isEligible()) { var d = document.createElement('div'); d.className = 'pp-b'; slot.appendChild(d); b.render(d); n++; }
      });
      if (!n) return fallback();
      wait.hidden = true; sync();
    };

    clean();
    if (inp && PROMO && inp.value) applyCode(); else render();

    if (readCart().length && window.fetch) {
      var to = setTimeout(fallback, 12000);
      fetch('/api/paypal/config').then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (c) {
        if (!c || !c.clientId) throw new Error();
        var sdk = document.createElement('script');
        sdk.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(c.clientId) + '&currency=EUR&locale=fr_FR&components=buttons&enable-funding=card';
        sdk.onload = function () { clearTimeout(to); setup(); };
        sdk.onerror = function () { clearTimeout(to); fallback(); };
        document.head.appendChild(sdk);
      }).catch(function () { clearTimeout(to); fallback(); });
    } else if (readCart().length) fallback();
  }

  // Année du pied de page
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});
