// Formulaire de contact — Cloudflare Pages Function (POST /api/contact)
// Variables à définir dans Cloudflare Pages > Settings > Variables and secrets :
//   RESEND_API_KEY  (secret)  clé API Resend
//   CONTACT_TO      e-mail qui reçoit les messages (ex. contact@ancre-darmor.fr)
//   CONTACT_FROM    expéditeur vérifié chez Resend (ex. "Ancre d'Armor <site@ancre-darmor.fr>")

const esc = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function onRequestPost({ request, env }) {
  const back = (path) => Response.redirect(new URL(path, request.url).toString(), 303);
  let f;
  try { f = await request.formData(); } catch { return back('/contact'); }

  // Piège à robots : champ caché qui doit rester vide
  if ((f.get('site') || '').trim()) return back('/message-envoye');

  const nom = (f.get('nom') || '').trim().slice(0, 100);
  const email = (f.get('email') || '').trim().slice(0, 200);
  const objet = (f.get('objet') || '').trim().slice(0, 200) || 'Message depuis le site';
  const message = (f.get('message') || '').trim().slice(0, 5000);
  if (!nom || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return back('/contact');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `[Ancre d'Armor] ${objet}`,
      html: `<p><strong>${esc(nom)}</strong> &lt;${esc(email)}&gt;</p><p>${esc(message).replace(/\n/g, '<br>')}</p>`,
    }),
  });
  if (!r.ok) return new Response("Désolée, le message n'a pas pu partir. Écrivez directement à " + (env.CONTACT_TO || 'l\'adresse indiquée sur la page contact') + '.', { status: 502, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  return back('/message-envoye');
}
