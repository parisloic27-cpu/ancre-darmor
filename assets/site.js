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

  // Année du pied de page
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});
