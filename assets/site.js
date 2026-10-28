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

  // Bouton PayPal actif seulement quand les cases obligatoires sont cochées
  document.querySelectorAll('form[data-pay]').forEach(function (f) {
    var btn = f.querySelector('button[type=submit]');
    var req = f.querySelectorAll('input[type=checkbox][data-required]');
    function check() {
      var ok = true;
      req.forEach(function (c) { if (!c.checked) ok = false; });
      f.querySelectorAll('[data-required-text]').forEach(function (i) { if (!i.value.trim()) ok = false; });
      btn.disabled = !ok;
    }
    f.addEventListener('input', check);
    f.addEventListener('change', check);
    check();
  });

  // Quantité : affiche le total
  document.querySelectorAll('.qty select').forEach(function (sel) {
    var out = sel.parentNode.querySelector('.qtot');
    function upd() {
      var n = +sel.value, t = (n * parseFloat(sel.dataset.unit)).toFixed(2).replace('.', ',');
      out.textContent = n > 1 ? 'Total : ' + t + ' €, livraison incluse' : '';
    }
    sel.addEventListener('change', upd); upd();
  });

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

      // Un seul usage par navigateur : le code est marqué « utilisé » à l'envoi vers PayPal,
      // et libéré si le client annule le paiement (retour sur /boutique?paiement=annule).
      var KEY = 'promo-utilise-' + CODE;
      var store = function (v) { try { if (v) localStorage.setItem(KEY, v); else localStorage.removeItem(KEY); } catch (e) {} };
      var used = function () { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } };
      var qs = new URLSearchParams(location.search);
      if (qs.get('paiement') === 'annule') { try { if (localStorage.getItem(KEY) === 'en-cours') store(null); } catch (e) {} }
      if (/^\/merci/.test(location.pathname)) { try { if (localStorage.getItem(KEY) === 'en-cours') store('paye'); } catch (e) {} }
      var fromUrl = (qs.get('code') || '').toUpperCase();
      document.querySelectorAll('form[data-pay]').forEach(function (f) {
        var box = f.querySelector('.promo-f'); if (!box) return;
        box.hidden = false;
        var inp = box.querySelector('input'), msg = box.querySelector('.pmsg');
        var amt = f.querySelector('input[name=amount]'), name = f.querySelector('input[name=item_name]');
        var sel = f.querySelector('.qty select'), card = f.closest('.bd'), price = card && card.querySelector('.price');
        var base = amt.value, baseName = name.value, baseHTML = price ? price.innerHTML : '';
        var fmt = function (x) { return x.replace('.', ',') + ' €'; };
        var apply = function () {
          var c = inp.value.trim().toUpperCase(), deja = c === CODE && used(), on = c === CODE && Date.now() < END && !deja;
          if (on) {
            var nv = (Math.round(Math.round(parseFloat(base) * 100) * (100 - PCT) / 100) / 100).toFixed(2);
            amt.value = nv; name.value = baseName + ' · code ' + CODE + ' (-' + PCT + ' %)';
            if (price) price.innerHTML = '<s>' + fmt(base) + '</s><span class="np">' + fmt(nv) + '</span><span class="pb">-' + PCT + ' %</span>';
            if (sel) sel.dataset.unit = nv;
            inp.classList.add('ok'); msg.className = 'pmsg ok'; msg.textContent = 'Code appliqué : -' + PCT + ' %';
          } else {
            amt.value = base; name.value = baseName;
            if (price) price.innerHTML = baseHTML;
            if (sel) sel.dataset.unit = base;
            inp.classList.remove('ok'); msg.className = 'pmsg'; msg.textContent = deja ? 'Code déjà utilisé : offre limitée à un achat par personne' : (c && c.length >= CODE.length ? 'Code non valide' : '');
          }
          if (sel) sel.dispatchEvent(new Event('change'));
        };
        inp.addEventListener('input', apply);
        f.addEventListener('submit', function () { if (inp.classList.contains('ok')) store('en-cours'); });
        if (fromUrl === CODE) { inp.value = CODE; apply(); }
      });
    }
  }

  // Paiement : boutons PayPal modernes (PayPal + carte bancaire sans compte).
  // Le prix est recalculé côté serveur (/api/paypal/create). Si PayPal ne se charge pas,
  // l'ancien bouton « Payer avec PayPal » reste affiché.
  var payForms = document.querySelectorAll('form[data-pay]');
  if (payForms.length && window.fetch) {
    fetch('/api/paypal/config').then(function (r) { return r.ok ? r.json() : Promise.reject(); }).then(function (c) {
      if (!c || !c.clientId) return;
      var sdk = document.createElement('script');
      sdk.src = 'https://www.paypal.com/sdk/js?client-id=' + encodeURIComponent(c.clientId) + '&currency=EUR&locale=fr_FR&components=buttons&enable-funding=card';
      sdk.onload = function () { payForms.forEach(setupPay); };
      document.head.appendChild(sdk);
    }).catch(function () {});
  }
  var promoEl = document.querySelector('.promo');
  var PKEY = promoEl ? 'promo-utilise-' + promoEl.dataset.code : null;
  function setupPay(f) {
    if (!window.paypal || !paypal.Buttons) return;
    var box = f.querySelector('.pp'), slot = box && box.querySelector('.pp-btns'), lock = box && box.querySelector('.pp-lock');
    var msg = f.querySelector('.pp-msg'), sub = f.querySelector('button[type=submit]');
    var req = f.querySelectorAll('input[type=checkbox][data-required]');
    var sel = f.querySelector('select[name=quantity]'), inp = f.querySelector('[data-promo]');
    if (!box || !slot) return;
    var acts = [];
    var ok = function () { var o = true; req.forEach(function (c) { if (!c.checked) o = false; }); return o; };
    var sync = function () {
      var o = ok();
      lock.hidden = o; box.classList.toggle('locked', !o);
      acts.forEach(function (a) { if (o) a.enable(); else a.disable(); });
      if (o) msg.textContent = '';
    };
    var post = function (url, data) {
      return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        .then(function (r) { return r.json().then(function (d) { d._ok = r.ok; return d; }); });
    };
    var opts = {
      style: { shape: 'pill', height: 45 },
      onInit: function (d, a) { acts.push(a); sync(); },
      onClick: function () { if (!ok()) msg.textContent = 'Merci de cocher ' + (req.length > 1 ? 'les cases' : 'la case') + ' avant de payer.'; },
      createOrder: function () {
        msg.textContent = '';
        var code = inp && inp.classList.contains('ok') ? inp.value.trim().toUpperCase() : '';
        if (code && PKEY) { try { localStorage.setItem(PKEY, 'en-cours'); } catch (e) {} }
        return post('/api/paypal/create', { ref: f.dataset.ref, qty: sel ? sel.value : 1, code: code }).then(function (d) {
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
        if (PKEY) { try { if (localStorage.getItem(PKEY) === 'en-cours') localStorage.removeItem(PKEY); } catch (e) {} }
        msg.textContent = 'Paiement annulé : vous pouvez réessayer quand vous voulez.';
      },
      onError: function () { msg.textContent = "Le paiement n'a pas pu démarrer. Réessayez dans un instant ou contactez-moi."; }
    };
    var n = 0;
    [paypal.FUNDING.PAYPAL, paypal.FUNDING.CARD].forEach(function (src) {
      var o = {}; for (var k in opts) o[k] = opts[k]; o.fundingSource = src;
      var b = paypal.Buttons(o);
      if (b.isEligible()) { var d = document.createElement('div'); d.className = 'pp-b'; slot.appendChild(d); b.render(d); n++; }
    });
    if (n) { box.hidden = false; sub.hidden = true; req.forEach(function (c) { c.addEventListener('change', sync); }); sync(); }
  }

  // Année du pied de page
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});
