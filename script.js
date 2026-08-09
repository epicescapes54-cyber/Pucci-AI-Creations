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

// The Reel — one player that runs the films back to back.
// YouTube advances automatically when you hand it the rest of the list, so
// picking a title just reloads the player starting from that point.
const REEL = [
  { id: 'O0ETq_UWxhU', title: 'Put Me In Flower Child', note: 'Generative product film' },
  { id: 'kNAN7vrYlz4', title: 'Boujee and Balanced',    note: 'Launch spot' }
];

const reelFrame = document.getElementById('reelFrame');
const reelList = document.getElementById('reelList');

if (reelFrame && reelList && REEL.length) {
  let reelPlayer = null;
  let current = 0;

  const markCurrent = () => {
    reelList.querySelectorAll('li').forEach((li, n) => li.classList.toggle('on', n === current));
  };

  const goTo = (i, autoplay) => {
    current = i;
    markCurrent();
    if (!reelPlayer) return;
    if (autoplay) reelPlayer.loadVideoById(REEL[i].id);
    else reelPlayer.cueVideoById(REEL[i].id);
  };

  REEL.forEach((v, i) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span class="reel-n">${String(i + 1).padStart(2, '0')}</span>`;
    const t = document.createElement('span');
    t.className = 'reel-t';
    t.textContent = v.title;
    const note = document.createElement('span');
    note.className = 'reel-note';
    note.textContent = v.note;
    btn.append(t, note);
    btn.addEventListener('click', () => goTo(i, true));
    li.appendChild(btn);
    reelList.appendChild(li);
  });
  markCurrent();

  // The playlist= parameter loads films out of order, so drive the player
  // directly and advance on ENDED instead.
  window.onYouTubeIframeAPIReady = () => {
    reelPlayer = new YT.Player('reelFrame', {
      host: 'https://www.youtube-nocookie.com',
      videoId: REEL[0].id,
      playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
      events: {
        onStateChange: (e) => {
          if (e.data !== YT.PlayerState.ENDED) return;
          if (current < REEL.length - 1) goTo(current + 1, true);
        }
      }
    });
  };

  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(api);
}

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

// Throwaway and placeholder domains. These are the addresses people reach for
// when they want the prompt without handing over a real inbox.
const BAD_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net', 'test.com', 'test.test',
  'email.com', 'domain.com', 'fake.com', 'foo.com', 'bar.com', 'asdf.com',
  'mailinator.com', 'guerrillamail.com', 'guerrillamail.info', 'sharklasers.com',
  '10minutemail.com', '10minutemail.net', 'tempmail.com', 'temp-mail.org',
  'throwawaymail.com', 'yopmail.com', 'yopmail.fr', 'trashmail.com',
  'getnada.com', 'dispostable.com', 'maildrop.cc', 'fakeinbox.com',
  'mailnesia.com', 'mytemp.email', 'moakt.com', 'emailondeck.com',
  'spam4.me', 'grr.la', 'inboxbear.com', 'tempr.email', 'discard.email',
  'mailinator.net', 'harakirimail.com', 'anonbox.net', 'burnermail.io'
]);

// Local parts that are obviously not a person.
const BAD_LOCAL = /^(test|tester|testing|fake|asdf|qwerty|abc|aaa|xxx|noone|nobody|none|na|no|nothing|spam|junk|donotreply|no-?reply)\d*$/i;

const setGateNote = (msg, kind) => {
  gateNote.textContent = msg;
  gateNote.className = 'form-note' + (kind ? ' ' + kind : '');
};

const setGateBusy = (busy) => {
  gateForm.classList.toggle('busy', busy);
  gateForm.querySelector('button[type=submit]').disabled = busy;
};

// Mailchimp. Every unlock is also submitted here, so the audience builds a real
// subscriber list. With double opt-in switched on for the audience, Mailchimp
// emails the visitor a confirmation link and only adds them once they click it.
// Values come from Audience → Forms → Other forms → Embedded forms.
const MAILCHIMP = {
  host: 'github.us11.list-manage.com',
  u: '431ed4d99889b35117f103a2c',
  id: 'f4e2af257d'
};

const mailchimpReady = () => !!(MAILCHIMP.host && MAILCHIMP.u && MAILCHIMP.id);

// Mailchimp has no CORS headers, so the classic static-site route is JSONP.
function mailchimpSubscribe(email) {
  return new Promise((resolve) => {
    if (!mailchimpReady()) return resolve({ skipped: true });

    const cb = 'mc_cb_' + Math.random().toString(36).slice(2);
    const script = document.createElement('script');
    const done = (result) => {
      delete window[cb];
      script.remove();
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => done({ error: 'timeout' }), 8000);

    window[cb] = (data) => done(data || {});
    script.onerror = () => done({ error: 'network' });
    script.src = `https://${MAILCHIMP.host}/subscribe/post-json`
      + `?u=${encodeURIComponent(MAILCHIMP.u)}&id=${encodeURIComponent(MAILCHIMP.id)}`
      + `&EMAIL=${encodeURIComponent(email)}&c=${cb}`;
    document.body.appendChild(script);
  });
}

// Ask public DNS whether the domain can actually receive mail. A made-up
// domain has no MX (and no A) record, so it fails here.
async function domainAcceptsMail(domain) {
  const ask = async (type) => {
    const r = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${type}`,
      { headers: { Accept: 'application/dns-json' } });
    if (!r.ok) throw new Error('dns');
    return r.json();
  };
  const mx = await ask('MX');
  if (mx.Status === 3) return false;            // NXDOMAIN — no such domain
  if (mx.Answer && mx.Answer.some(a => a.type === 15)) return true;
  const a = await ask('A');                      // some hosts take mail on the A record
  return !!(a.Answer && a.Answer.length);
}

gateForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = gateEmail.value.trim().toLowerCase();
  const fail = (msg) => {
    gateEmail.classList.add('invalid');
    setGateNote(msg, 'err');
  };

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    return fail('That email doesn\'t look right — mind checking it?');
  }

  const [local, domain] = email.split('@');
  if (BAD_DOMAINS.has(domain)) {
    return fail('That looks like a temporary address. Please use the inbox you actually read.');
  }
  if (BAD_LOCAL.test(local)) {
    return fail('Please use your real email — the prompts and any updates get sent there.');
  }

  gateEmail.classList.remove('invalid');
  setGateBusy(true);
  setGateNote('Checking that address…');

  try {
    if (!(await domainAcceptsMail(domain))) {
      setGateBusy(false);
      return fail(`We can't find a mail server at "${domain}". Check the spelling?`);
    }
  } catch {
    // DNS unreachable — don't punish a real visitor for our lookup failing.
  }

  // Only unlock once the lead has actually been delivered.
  setGateNote('Sending…');
  const prompt = pending ? pending.querySelector('.p-label').textContent : '—';

  const [mc, delivered] = await Promise.all([
    mailchimpSubscribe(email),
    (async () => {
      try {
        const res = await fetch(LEAD_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email,
            _subject: `New prompt-library lead — ${email}`,
            Prompt: prompt,
            Source: 'Content Engine prompt library',
            When: new Date().toLocaleString()
          })
        });
        const body = await res.json().catch(() => ({}));
        return res.ok && String(body.success) === 'true';
      } catch {
        return false;
      }
    })()
  ]);

  setGateBusy(false);

  if (!delivered) {
    return fail('Something went wrong sending that. Try again in a moment?');
  }

  try { localStorage.setItem(STORE_KEY, email); } catch {}
  setLocked();
  gate.close();
  if (pending) { copyPrompt(pending); pending = null; }

  // Mailchimp rejects addresses that bounced or unsubscribed before; tell them
  // rather than silently dropping the signup. They keep the prompt either way.
  if (mc && mc.result === 'error' && !/already subscribed/i.test(mc.msg || '')) {
    promptNote.textContent = 'Prompt copied — but we couldn\'t add you to the list.';
  } else if (mailchimpReady() && mc && mc.result === 'success') {
    promptNote.textContent = 'Prompt copied. Check your inbox to confirm your subscription.';
  }
});

// Contact form
const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

const setNote = (msg, kind) => {
  note.textContent = msg;
  note.className = 'form-note' + (kind ? ' ' + kind : '');
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  setNote('');

  const name = form.name;
  const email = form.email;
  const message = form.message;
  let ok = true;

  [name, email, message].forEach(f => {
    const bad = !f.value.trim();
    f.classList.toggle('invalid', bad);
    if (bad) ok = false;
  });

  const address = email.value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) {
    email.classList.add('invalid');
    ok = false;
  }

  if (!ok) {
    return setNote('Please fill in your name, a valid email, and a message.', 'err');
  }

  // Same standard as the prompt gate — a reply is useless without a real inbox.
  const [local, domain] = address.split('@');
  if (BAD_DOMAINS.has(domain) || BAD_LOCAL.test(local)) {
    email.classList.add('invalid');
    return setNote('Please use a real email address so I can reply to you.', 'err');
  }

  const submit = form.querySelector('button[type=submit]');
  submit.disabled = true;
  setNote('Checking your email…');

  try {
    if (!(await domainAcceptsMail(domain))) {
      submit.disabled = false;
      email.classList.add('invalid');
      return setNote(`We can't find a mail server at "${domain}". Check the spelling?`, 'err');
    }
  } catch {
    // DNS lookup failed on our side — let the message through rather than
    // turning away a real enquiry.
  }

  email.classList.remove('invalid');
  setNote('Sending…');

  let sent = false;
  try {
    const res = await fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: address,
        _subject: `New project inquiry — ${form.service.value}`,
        _replyto: address,
        Service: form.service.value,
        Message: message.value.trim(),
        When: new Date().toLocaleString()
      })
    });
    const body = await res.json().catch(() => ({}));
    sent = res.ok && String(body.success) === 'true';
  } catch {
    sent = false;
  }

  submit.disabled = false;

  if (!sent) {
    return setNote(
      'Something went wrong sending that. Please try again in a moment.',
      'err'
    );
  }

  form.reset();
  setNote('Thank you — your message is on its way. I\'ll get right back to you.', 'ok');
});
