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

      var fromUrl = (new URLSearchParams(location.search).get('code') || '').toUpperCase();
      document.querySelectorAll('form[data-pay]').forEach(function (f) {
        var box = f.querySelector('.promo-f'); if (!box) return;
        box.hidden = false;
        var inp = box.querySelector('input'), msg = box.querySelector('.pmsg');
        var amt = f.querySelector('input[name=amount]'), name = f.querySelector('input[name=item_name]');
        var sel = f.querySelector('.qty select'), card = f.closest('.bd'), price = card && card.querySelector('.price');
        var base = amt.value, baseName = name.value, baseHTML = price ? price.innerHTML : '';
        var fmt = function (x) { return x.replace('.', ',') + ' €'; };
        var apply = function () {
          var c = inp.value.trim().toUpperCase(), on = c === CODE && Date.now() < END;
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
            inp.classList.remove('ok'); msg.className = 'pmsg'; msg.textContent = c && c.length >= CODE.length ? 'Code non valide' : '';
          }
          if (sel) sel.dispatchEvent(new Event('change'));
        };
        inp.addEventListener('input', apply);
        if (fromUrl === CODE) { inp.value = CODE; apply(); }
      });
    }
  }

  // Année du pied de page
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});
