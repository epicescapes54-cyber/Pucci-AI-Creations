/* Pucci AI Creations — interactions */

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Sticky nav
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('stuck', window.scrollY > 30);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const burger = document.getElementById('burger');
const navLinks = document.getElementById('navLinks');
burger.addEventListener('click', () => {
  const open = navLinks.classList.toggle('open');
  burger.setAttribute('aria-expanded', String(open));
});
navLinks.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false');
  })
);

// Scroll reveal
const io = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (!e.isIntersecting) return;
    setTimeout(() => e.target.classList.add('in'), (i % 4) * 90);
    io.unobserve(e.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

// Portfolio covers — if a thumbnail is missing, fall back to the brand gradient
// so the tile still reads as finished rather than broken.
document.querySelectorAll('.tile-video .cover').forEach(img => {
  const markMissing = () => img.closest('.tile-video').classList.add('no-cover');
  img.addEventListener('error', markMissing);
  if (img.complete && img.naturalWidth === 0) markMissing();
});

// Prompt library — copy is gated behind an email, once per visitor
const promptNote = document.getElementById('promptNote');
const gate = document.getElementById('promptGate');
const gateForm = document.getElementById('gateForm');
const gateEmail = document.getElementById('gateEmail');
const gateWhich = document.getElementById('gateWhich');
const gateNote = document.getElementById('gateNote');
const STORE_KEY = 'pac_prompt_email';

// Unlocked emails are POSTed here and land in the Pucci AI Creations inbox.
// FormSubmit relays to epicescapes54@gmail.com — no backend of our own needed.
const LEAD_ENDPOINT = 'https://formsubmit.co/ajax/epicescapes54@gmail.com';

let noteTimer;
let pending = null; // the card waiting on an email

const savedEmail = () => {
  try { return localStorage.getItem(STORE_KEY); } catch { return null; }
};

const setLocked = () => {
  const locked = !savedEmail();
  document.querySelectorAll('.prompt').forEach(p => p.classList.toggle('locked', locked));
};

async function copyPrompt(card) {
  const text = card.querySelector('code').textContent.trim();
  const label = card.querySelector('.p-label').textContent;
  const chip = card.querySelector('.p-copy');

  let copied = false;
  try {
    await navigator.clipboard.writeText(text);
    copied = true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    ta.remove();
  }

  card.classList.add('open');
  chip.textContent = copied ? 'Copied' : 'Select';
  card.classList.toggle('copied', copied);
  promptNote.textContent = copied
    ? `"${label}" prompt copied to your clipboard.`
    : 'Copy blocked by the browser — select the text manually.';

  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => {
    chip.textContent = 'Copy';
    card.classList.remove('copied');
    promptNote.textContent = '';
  }, 2600);
}

document.querySelectorAll('.prompt').forEach(card => {
  // Tapping the card expands it — touch devices never get :hover.
  card.addEventListener('click', (e) => {
    if (e.target.closest('.p-copy')) return;
    card.classList.toggle('open');
  });

  card.querySelector('.p-copy').addEventListener('click', () => {
    if (savedEmail()) { copyPrompt(card); return; }

    pending = card;
    gateWhich.textContent = `Unlocking: ${card.querySelector('.p-label').textContent}`;
    gateNote.textContent = '';
    gateNote.className = 'form-note';
    gateEmail.classList.remove('invalid');
    gateEmail.value = '';
    gate.showModal();
    gateEmail.focus();
  });
});

setLocked();

document.getElementById('gateClose').addEventListener('click', () => gate.close());
gate.addEventListener('click', (e) => { if (e.target === gate) gate.close(); });

gateForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const email = gateEmail.value.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    gateEmail.classList.add('invalid');
    gateNote.textContent = 'That email doesn\'t look right — mind checking it?';
    gateNote.className = 'form-note err';
    return;
  }

  gateEmail.classList.remove('invalid');
  try { localStorage.setItem(STORE_KEY, email); } catch {}

  if (LEAD_ENDPOINT) {
    const prompt = pending ? pending.querySelector('.p-label').textContent : '—';
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email,
        _subject: `New prompt-library lead — ${email}`,
        Prompt: prompt,
        Source: 'Content Engine prompt library',
        When: new Date().toLocaleString()
      })
    }).catch(() => {});
  }

  setLocked();
  gate.close();
  if (pending) { copyPrompt(pending); pending = null; }
});

// Contact form
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

form.addEventListener('submit', (e) => {
  e.preventDefault();
  note.className = 'form-note';

  const name = form.name;
  const email = form.email;
  const message = form.message;
  let ok = true;

  [name, email, message].forEach(f => {
    const bad = !f.value.trim();
    f.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  if (!emailOk) { email.classList.add('invalid'); ok = false; }

  if (!ok) {
    note.textContent = 'Please fill in your name, a valid email, and a message.';
    note.classList.add('err');
    return;
  }

  // No backend yet — hand off to the user's mail client.
  const subject = encodeURIComponent(`New project inquiry — ${form.service.value}`);
  const body = encodeURIComponent(
    `Name: ${name.value.trim()}\nEmail: ${email.value.trim()}\nService: ${form.service.value}\n\n${message.value.trim()}`
  );
  window.location.href = `mailto:epicescapes54@gmail.com?subject=${subject}&body=${body}`;

  note.textContent = 'Opening your email app — hit send and I\'ll get right back to you.';
  note.classList.add('ok');
  form.reset();
});
