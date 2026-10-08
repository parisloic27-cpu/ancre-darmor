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

  // Formulaire de contact : objet pré-rempli via ?objet=...
  var obj = new URLSearchParams(location.search).get('objet');
  var field = document.getElementById('objet');
  if (obj && field) field.value = obj;

  // Année du pied de page
  var y = document.getElementById('y');
  if (y) y.textContent = new Date().getFullYear();
});
