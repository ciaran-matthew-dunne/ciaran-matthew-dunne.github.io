/**
 * Read-only viewer of the household food data for GitHub Pages. Downloads the encrypted
 * snapshot (see packages/core/src/publish/snapshot.ts for the format), decrypts it in the
 * browser with the shared password, and renders lists, pantry, meals, photos and a catalogue
 * search. No server: ticks on a shopping list stay on this device.
 */
const CFG = window.FOOD_CONFIG || {};
const MAGIC = 'FOOD1';
const ITERATIONS = 200_000;
const PW_KEY = 'food.password';
const TICK_KEY = 'food.ticks';
const CACHE = 'food-snapshot-v1';

const $app = document.getElementById('app');
const state = { snap: null, products: new Map(), photos: new Map(), ticks: loadTicks(), offline: false, q: '', src: null, stock: true, pantryQ: '', photoFilter: 'all' };

// ---------------------------------------------------------------------------- helpers
function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'style') el.style.cssText = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}
const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const I = {
  leaf: `<svg viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#3d6b4a"/><path d="M44 16c-9 0-18 5-22 14-3 7-2 14 0 18 4-8 10-14 18-19-6 6-11 13-14 21 5 1 13-1 18-7 5-6 6-16 6-27h-6z" fill="#eef5ea"/></svg>`,
  list: svg('<path d="m3 17 2 2 4-4"/><path d="m3 7 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/>'),
  fridge: svg('<path d="M5 6a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/><path d="M5 10h14"/><path d="M15 7v6"/><path d="M15 15v3"/>'),
  meals: svg('<path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8"/><path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7"/><path d="m2.1 21.8 6.4-6.3"/><path d="m19 5-7 7"/>'),
  camera: svg('<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>'),
  search: svg('<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>'),
  check: svg('<path d="M20 6 9 17l-5-5"/>', 'stroke-width="3"'),
  lock: svg('<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  receipt: svg('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>'),
  image: svg('<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>'),
  back: svg('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  basket: svg('<path d="m15 11-1 9"/><path d="m19 11-4-7"/><path d="M2 11h20"/><path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8a2 2 0 0 0 2-1.6l1.7-7.4"/><path d="M4.5 15.5h15"/><path d="m5 11 4-7"/><path d="m9 11 1 9"/>'),
  cloudOff: svg('<path d="m2 2 20 20"/><path d="M5.8 5.8A7 7 0 0 0 9 19h8.5"/><path d="M22 15a5 5 0 0 0-4-4.9"/>'),
};
const icon = (name) => h('span', { class: 'ic', html: I[name], style: 'display:inline-flex' });

const fmt = {
  euros: (c) => (c == null ? '—' : (c / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })),
  qty: (q, unit) => (q == null ? '' : (Number.isInteger(q) ? String(q) : q.toLocaleString('en-GB', { maximumFractionDigits: 3 })) + (unit ? ' ' + unit : '')),
  rel(iso) {
    if (!iso) return 'never';
    const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const hrs = Math.round(m / 60);
    if (hrs < 48) return `${hrs} h ago`;
    return `${Math.round(hrs / 24)} d ago`;
  },
  time: (iso) => new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
  day(iso) {
    const d = new Date(iso);
    const today = new Date();
    const diff = Math.round((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: diff > 300 ? 'numeric' : undefined });
  },
  date: (s) => (s ? new Date(s.length === 10 ? s + 'T12:00:00' : s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : ''),
};
const fold = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const SOURCE = { nico: 'Nico', auchan: 'Auchan' };
const imageUrl = (p, size = 200) => (p && p.img ? (p.s === 'auchan' ? `${p.img}?width=${size}&height=${size}&fit=pad&format=rw&quality=80` : p.img) : null);
const productName = (p) => (p ? (p.b ? `${p.b} ${p.n}` : p.n) : '');
const priceLabel = (p) => (p && p.p != null ? fmt.euros(p.p) + (p.sb === 'kg' ? ' / kg' : '') : '—');

function loadTicks() {
  try {
    return new Set(JSON.parse(localStorage.getItem(TICK_KEY) || '[]'));
  } catch {
    return new Set();
  }
}
function saveTicks() {
  try {
    localStorage.setItem(TICK_KEY, JSON.stringify([...state.ticks]));
  } catch {
    /* private mode */
  }
}

// ---------------------------------------------------------------------------- data
function dataUrl() {
  const q = new URLSearchParams(location.search).get('data');
  if (q) return q;
  if (location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname)) return './data.enc';
  return CFG.dataUrl || './data.enc';
}

async function fetchBlob(onStatus) {
  const url = dataUrl();
  try {
    onStatus('Downloading…');
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if ('caches' in window) {
      try {
        const c = await caches.open(CACHE);
        await c.put(url, new Response(buf.slice(0), { headers: { 'content-type': 'application/octet-stream', 'x-cached-at': new Date().toISOString() } }));
      } catch {
        /* storage full */
      }
    }
    state.offline = false;
    return buf;
  } catch (err) {
    if ('caches' in window) {
      const hit = await (await caches.open(CACHE)).match(url);
      if (hit) {
        state.offline = true;
        return hit.arrayBuffer();
      }
    }
    throw new Error(`Could not download the data (${err.message}). Are you online?`);
  }
}

class WrongPassword extends Error {}

async function decrypt(buf, password) {
  const bytes = new Uint8Array(buf);
  if (new TextDecoder().decode(bytes.subarray(0, 5)) !== MAGIC) throw new Error('That file is not a food snapshot.');
  const salt = bytes.subarray(5, 21);
  const iv = bytes.subarray(21, 33);
  const body = bytes.subarray(33);
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
  let plain;
  try {
    plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, body);
  } catch {
    throw new WrongPassword('Wrong password.');
  }
  const text = await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  return JSON.parse(text);
}

async function unlock(password, onStatus = () => {}) {
  const buf = await fetchBlob(onStatus);
  onStatus('Decrypting…');
  const snap = await decrypt(buf, password);
  state.snap = snap;
  state.products = new Map(snap.products.map((p) => [p.id, p]));
  state.photos = new Map(snap.photos.map((p) => [p.id, p]));
  try {
    localStorage.setItem(PW_KEY, password);
  } catch {
    /* fine */
  }
}

// ---------------------------------------------------------------------------- shell
function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  const [path, query] = hash.split('?');
  const [tab = 'lists', id] = path.split('/');
  return { tab, id: id ? Number(id) : null, query: new URLSearchParams(query || '') };
}

function render() {
  if (!state.snap) return;
  const r = route();
  const views = { lists: viewLists, list: viewList, pantry: viewPantry, meals: viewMeals, photos: viewPhotos, search: viewSearch, purchases: viewPurchase };
  const view = views[r.tab] || viewLists;
  $app.replaceChildren(header(r), h('main', { class: 'fade' }, view(r)));
  window.scrollTo(0, 0);
}

function header(r) {
  const snap = state.snap;
  const tabs = [
    ['lists', 'Lists', 'list'],
    ['pantry', 'Pantry', 'fridge'],
    ['meals', 'Meals', 'meals'],
    ['photos', 'Photos', 'camera', snap.photo_counts.pending],
    ['search', 'Search', 'search'],
  ];
  const current = r.tab === 'list' ? 'lists' : r.tab === 'purchases' ? 'pantry' : r.tab;
  return h(
    'div',
    { class: 'top' },
    h(
      'div',
      { class: 'top-row' },
      h('a', { class: 'logo', href: '#lists' }, h('span', { html: I.leaf, style: 'display:inline-flex' }), 'Food'),
      h('div', { class: 'top-meta' }, state.offline ? h('span', { title: 'Showing the last copy downloaded on this device' }, 'offline copy · ') : null, `updated ${fmt.rel(snap.generated_at)}`),
      h('button', { class: 'btn ghost', title: 'Forget the password on this device', onclick: forget }, icon('lock')),
    ),
    h(
      'nav',
      { class: 'tabs' },
      tabs.map(([tab, label, ic, count]) => h('a', { class: 'tab', href: `#${tab}`, 'aria-current': current === tab ? 'page' : null }, icon(ic), h('span', { class: 'label' }, label), count ? h('span', { class: 'count' }, count) : null)),
    ),
  );
}

function forget() {
  localStorage.removeItem(PW_KEY);
  state.snap = null;
  showLock();
}

function showLock(error) {
  const input = h('input', { class: 'input', type: 'password', autocomplete: 'current-password', placeholder: 'Password', autofocus: true });
  const status = h('p', { class: 'muted small', style: 'min-height:1.4em;margin:6px 0 0' }, error ? h('span', { class: 'err' }, error) : '');
  const form = h(
    'form',
    {
      class: 'card lock',
      onsubmit: async (e) => {
        e.preventDefault();
        const pw = input.value;
        if (!pw) return;
        try {
          await unlock(pw, (s) => (status.textContent = s));
          render();
        } catch (err) {
          status.replaceChildren(h('span', { class: 'err' }, err.message));
        }
      },
    },
    h('div', { class: 'logo' }, h('span', { html: I.leaf, style: 'display:inline-flex' }), h('div', null, h('div', null, 'Food'), h('div', { class: 'muted small', style: 'font-weight:400' }, 'Bures-sur-Yvette household'))),
    h('p', { class: 'sub' }, 'Shopping lists, pantry and meals — read-only copy. The password is remembered on this device.'),
    input,
    h('div', { style: 'margin-top:10px' }, h('button', { class: 'btn primary', type: 'submit' }, 'Unlock')),
    status,
  );
  $app.replaceChildren(h('main', null, form));
  setTimeout(() => input.focus(), 50);
}

// ---------------------------------------------------------------------------- lists
function viewLists() {
  const lists = state.snap.lists.filter((l) => l.status !== 'archived');
  const archived = state.snap.lists.filter((l) => l.status === 'archived');
  return [
    h('h1', null, 'Shopping lists'),
    h('p', { class: 'sub' }, 'Ticks made here stay on this phone; the shared lists are edited at home or by agents.'),
    lists.length
      ? h(
          'div',
          { class: 'cards' },
          lists.map((l) => {
            const done = l.items.filter((i) => i.checked || state.ticks.has(i.id)).length;
            return h(
              'a',
              { class: 'card link', href: `#list/${l.id}` },
              h('div', { class: 'row' }, h('h3', null, l.name), h('span', { class: 'spacer' }), h('span', { class: `badge ${l.status === 'active' ? 'ok' : ''}` }, l.status)),
              h('div', { class: 'muted small' }, `${l.items.length} items · ${done} done · by ${l.created_by}`),
              h('div', { class: 'bar' }, h('i', { style: `width:${l.items.length ? (done / l.items.length) * 100 : 0}%` })),
              h('div', { class: 'row small muted' }, h('span', { class: 'num' }, `~${fmt.euros(l.estimated_cents)}`), h('span', { class: 'spacer' }), `updated ${fmt.rel(l.updated_at)}`),
            );
          }),
        )
      : h('div', { class: 'empty' }, 'No lists yet.'),
    archived.length ? h('details', { style: 'margin-top:14px' }, h('summary', { class: 'muted small' }, `Archived (${archived.length})`), h('ul', null, archived.map((l) => h('li', null, h('a', { href: `#list/${l.id}` }, l.name))))) : null,
  ];
}

function viewList(r) {
  const l = state.snap.lists.find((x) => x.id === r.id);
  if (!l) return h('div', { class: 'empty' }, 'List not found.');
  const groups = [
    ['nico', 'Le Panier de Nico'],
    ['auchan', 'Auchan Drive'],
    ['other', 'Notes & other'],
  ].map(([key, title]) => ({ key, title, items: l.items.filter((i) => (i.product_id != null ? (state.products.get(i.product_id)?.s ?? 'other') : 'other') === key) }));
  const partial = l.items.some((i) => !i.checked && i.estimated_cents == null);
  return [
    h('a', { class: 'btn ghost', href: '#lists', style: 'margin-left:-10px' }, icon('back'), 'All lists'),
    h('h1', null, l.name),
    h('p', { class: 'sub' }, `${l.items.length} items · by ${l.created_by} · estimated ${partial ? '≥ ' : ''}${fmt.euros(l.estimated_cents)}`),
    l.notes ? h('p', { class: 'card', style: 'white-space:pre-wrap;font-size:14px' }, l.notes) : null,
    groups
      .filter((g) => g.items.length)
      .map((g) => {
        const priced = g.items.filter((i) => i.estimated_cents != null);
        const subtotal = priced.reduce((a, i) => a + i.estimated_cents, 0);
        return h(
          'section',
          { class: 'section' },
          h('header', null, g.key === 'other' ? g.title : h('span', { class: `badge dot ${g.key}` }, g.title), h('span', { class: 'muted small' }, `${g.items.filter((i) => i.checked || state.ticks.has(i.id)).length}/${g.items.length}`), h('span', { class: 'spacer' }), h('span', { class: 'muted num small' }, priced.length ? `${priced.length < g.items.length ? '≥ ' : ''}${fmt.euros(subtotal)}` : '')),
          h('ul', { class: 'items' }, g.items.map((it) => listItem(it))),
        );
      }),
  ];
}

function listItem(it) {
  const p = it.product_id != null ? state.products.get(it.product_id) : null;
  const local = state.ticks.has(it.id);
  const done = it.checked || local;
  const li = h('li', { class: `item ${done ? 'done' : ''}` });
  const tick = h(
    'button',
    {
      class: 'tick',
      role: 'checkbox',
      'aria-checked': String(done),
      'aria-label': 'Done',
      title: it.checked ? 'Ticked in the shared list' : 'Tick on this device',
      onclick: () => {
        if (it.checked) return;
        if (state.ticks.has(it.id)) state.ticks.delete(it.id);
        else state.ticks.add(it.id);
        saveTicks();
        const now = it.checked || state.ticks.has(it.id);
        tick.setAttribute('aria-checked', String(now));
        li.classList.toggle('done', now);
      },
    },
    done ? icon('check') : null,
  );
  const unit = it.unit ?? (p?.sb === 'kg' ? 'kg' : null);
  li.append(
    tick,
    productThumb(p),
    h(
      'div',
      { class: 'body' },
      h('div', { class: 'name' }, p ? (p.u ? h('a', { href: p.u, target: '_blank', rel: 'noreferrer', style: 'text-decoration:none' }, productName(p)) : productName(p)) : it.label, p?.q ? h('span', { class: 'muted small' }, p.q) : null, p && !p.st ? h('span', { class: 'small', style: 'color:var(--danger);font-weight:600' }, 'out of stock') : null),
      h('div', { class: 'meta' }, p ? h('span', { class: 'num' }, priceLabel(p)) : null, it.note ? h('span', null, it.note) : null),
    ),
    h('div', { class: 'qty' }, fmt.qty(it.quantity, unit)),
    h('div', { class: 'price muted' }, it.estimated_cents != null ? fmt.euros(it.estimated_cents) : '—'),
  );
  return li;
}

/**
 * An <img> that retries a failed load a couple of times (the Nico host answers 429 to bursts of
 * requests) and turns into a placeholder if it keeps failing.
 */
function productImg(url, attrs, placeholder) {
  const img = h('img', { ...attrs, src: url, referrerpolicy: 'no-referrer' });
  let tries = 0;
  img.addEventListener('error', () => {
    if (tries++ < 2) {
      setTimeout(() => {
        img.src = '';
        img.src = url;
      }, 1500 * tries + Math.random() * 1000);
    } else img.replaceWith(placeholder());
  });
  return img;
}

function productThumb(p, size = 120) {
  const url = imageUrl(p, size);
  const ph = () => h('div', { class: 'thumb ph' }, icon('basket'));
  return url ? productImg(url, { class: 'thumb', alt: '', loading: 'lazy' }, ph) : ph();
}

// ---------------------------------------------------------------------------- pantry
const LOC = { fridge: 'Fridge', freezer: 'Freezer', counter: 'Counter', pantry: 'Pantry', household: 'Household' };

function viewPantry() {
  const all = state.snap.pantry.filter((i) => i.quantity > 0 || i.staple);
  const q = fold(state.pantryQ);
  const items = q ? all.filter((i) => fold(i.name).includes(q) || fold(productName(state.products.get(i.product_id))).includes(q)) : all;
  const low = items.filter((i) => i.low);
  const expiring = items.filter((i) => i.expires_in_days != null && i.expires_in_days <= 3 && !i.low);
  const input = h('input', {
    class: 'input',
    type: 'search',
    placeholder: 'Filter the pantry…',
    value: state.pantryQ,
    oninput: (e) => {
      state.pantryQ = e.target.value;
      const main = document.querySelector('main');
      const keep = e.target;
      main.replaceChildren(...[].concat(viewPantry()));
      const next = main.querySelector('input[type=search]');
      next.focus();
      next.setSelectionRange(keep.value.length, keep.value.length);
    },
  });
  const groups = Object.keys(LOC).map((key) => ({ key, items: items.filter((i) => i.location === key) })).filter((g) => g.items.length);
  return [
    h('h1', null, 'Pantry'),
    h('p', { class: 'sub' }, `${all.length} items at home · ${low.length} to restock · counts are approximate (meals and receipts logged by agents)`),
    input,
    h('div', { style: 'height:12px' }),
    low.length || expiring.length
      ? h(
          'section',
          { class: 'section' },
          h('header', null, h('span', { class: 'badge warn' }, 'to buy / use soon'), h('span', { class: 'spacer' }), h('span', { class: 'muted small' }, `${low.length + expiring.length}`)),
          h('ul', { class: 'items' }, [...low, ...expiring].map((i) => pantryItem(i))),
        )
      : null,
    groups.length ? groups.map((g) => h('section', { class: 'section' }, h('header', null, LOC[g.key], h('span', { class: 'spacer' }), h('span', { class: 'muted small' }, g.items.length)), h('ul', { class: 'items' }, g.items.map((i) => pantryItem(i))))) : h('div', { class: 'empty' }, 'Nothing matches.'),
    purchasesSection(),
  ];
}

function pantryItem(i) {
  const p = i.product_id != null ? state.products.get(i.product_id) : null;
  const badges = [];
  if (i.quantity <= 0) badges.push(h('span', { class: 'badge danger' }, 'out'));
  else if (i.low) badges.push(h('span', { class: 'badge warn' }, 'low'));
  if (i.expires_in_days != null) {
    const d = i.expires_in_days;
    badges.push(h('span', { class: `badge ${d < 0 ? 'danger' : d <= 3 ? 'warn' : ''}` }, d < 0 ? `expired ${-d} d ago` : d === 0 ? 'expires today' : `${d} d left`));
  }
  if (i.staple) badges.push(h('span', { class: 'badge' }, 'staple'));
  return h(
    'li',
    { class: 'item' },
    productThumb(p, 80),
    h('div', { class: 'body' }, h('div', { class: 'name' }, i.name, ...badges), h('div', { class: 'meta' }, p ? h('span', null, `${SOURCE[p.s]} · ${priceLabel(p)}`) : null, i.note ? h('span', null, i.note) : null, i.min_quantity != null ? h('span', null, `keep ≥ ${fmt.qty(i.min_quantity, i.unit)}`) : null)),
    h('div', { class: 'qty', style: 'font-weight:600' }, fmt.qty(i.quantity, i.unit)),
  );
}

function purchasesSection() {
  const ps = state.snap.purchases;
  if (!ps.length) return null;
  return h(
    'section',
    { class: 'section' },
    h(
      'details',
      null,
      h('summary', null, `Recent purchases (${ps.length})`),
      h(
        'ul',
        { class: 'items' },
        ps.map((p) =>
          h(
            'li',
            { class: 'item' },
            h('div', { class: 'thumb ph' }, icon('receipt')),
            h('div', { class: 'body' }, h('div', { class: 'name' }, h('a', { href: `#purchases/${p.id}`, style: 'text-decoration:none' }, p.shop ? p.shop[0].toUpperCase() + p.shop.slice(1) : 'Purchase'), h('span', { class: 'muted small' }, `${fmt.day(p.bought_at)} ${fmt.time(p.bought_at)}`)), h('div', { class: 'meta' }, h('span', null, `${p.line_count} lines`), p.note ? h('span', null, p.note) : null)),
            h('div', { class: 'price num' }, p.total_cents != null ? fmt.euros(p.total_cents) : `≥ ${fmt.euros(p.lines_cents)}`),
          ),
        ),
      ),
    ),
  );
}

function viewPurchase(r) {
  const p = state.snap.purchases.find((x) => x.id === r.id);
  if (!p) return h('div', { class: 'empty' }, 'Purchase not found (only recent ones are published).');
  const photos = p.photo_ids.map((id) => state.photos.get(id)).filter(Boolean);
  return [
    h('a', { class: 'btn ghost', href: '#pantry', style: 'margin-left:-10px' }, icon('back'), 'Pantry'),
    h('h1', null, `${p.shop ? p.shop[0].toUpperCase() + p.shop.slice(1) : 'Purchase'} · ${fmt.day(p.bought_at)}`),
    h('p', { class: 'sub' }, `${fmt.time(p.bought_at)} · ${p.line_count} lines · total ${p.total_cents != null ? fmt.euros(p.total_cents) : `≥ ${fmt.euros(p.lines_cents)}`}${p.note ? ' · ' + p.note : ''}`),
    photos.length ? h('div', { class: 'strip' }, photos.map((ph) => photoTile(ph, true))) : null,
    h(
      'section',
      { class: 'section' },
      h('ul', { class: 'items' }, p.lines.map((l) => {
        const prod = l.product_id != null ? state.products.get(l.product_id) : null;
        return h('li', { class: 'item' }, productThumb(prod, 80), h('div', { class: 'body' }, h('div', { class: 'name' }, l.label), h('div', { class: 'meta' }, prod ? h('span', null, productName(prod)) : null, l.item_name ? h('span', null, `→ pantry: ${l.item_name}`) : h('span', null, 'not stocked'))), h('div', { class: 'qty' }, fmt.qty(l.quantity, l.unit)), h('div', { class: 'price num' }, l.price_cents != null ? fmt.euros(l.price_cents) : ''));
      })),
    ),
  ];
}

// ---------------------------------------------------------------------------- meals
function viewMeals() {
  const meals = state.snap.meals;
  if (!meals.length) return [h('h1', null, 'Meals'), h('div', { class: 'empty' }, 'No meals logged yet. Photograph a plate at home and an agent will log it.')];
  const days = new Map();
  for (const m of meals) {
    const key = m.eaten_at.slice(0, 10);
    if (!days.has(key)) days.set(key, []);
    days.get(key).push(m);
  }
  return [
    h('h1', null, 'Meals'),
    h('p', { class: 'sub' }, `${meals.length} logged meals; ingredients came out of the pantry.`),
    [...days.entries()].map(([day, list]) => {
      const kcal = list.reduce((a, m) => a + (m.kcal ?? 0), 0);
      const prot = list.reduce((a, m) => a + (m.protein_g ?? 0), 0);
      return h(
        'section',
        { class: 'section' },
        h('header', null, fmt.day(list[0].eaten_at), h('span', { class: 'muted small' }, new Date(day + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })), h('span', { class: 'spacer' }), h('span', { class: 'muted small num' }, [kcal ? `${kcal} kcal` : '', prot ? `${Math.round(prot)} g protein` : ''].filter(Boolean).join(' · '))),
        [...list].sort((a, b) => a.eaten_at.localeCompare(b.eaten_at)).map((m) => mealCard(m)),
      );
    }),
  ];
}

function mealCard(m) {
  const photos = m.photo_ids.map((id) => state.photos.get(id)).filter(Boolean);
  const macros = [m.kcal != null ? `${m.kcal} kcal` : '', m.protein_g != null ? `${m.protein_g} g protein` : '', m.carbs_g != null ? `${m.carbs_g} g carbs` : '', m.fat_g != null ? `${m.fat_g} g fat` : ''].filter(Boolean);
  return h(
    'article',
    { class: 'meal' },
    h('div', { class: 'row' }, h('span', { class: 'badge' }, m.slot || 'meal'), h('span', { class: 'muted small num' }, fmt.time(m.eaten_at)), h('span', { class: 'spacer' }), macros.length ? h('span', { class: 'muted small num' }, macros.join(' · ')) : null),
    h('div', { class: 'title', style: 'margin-top:4px' }, m.title),
    photos.length ? h('div', { class: 'strip' }, photos.map((p) => photoTile(p, true))) : null,
    m.ingredients.length ? h('ul', null, m.ingredients.map((g) => h('li', { title: g.item_id == null ? 'not a pantry item' : g.taken ? `took ${fmt.qty(g.taken, g.item_unit)} from the pantry` : 'not deducted' }, [fmt.qty(g.quantity, g.unit), g.label].filter(Boolean).join(' ')))) : null,
    m.notes ? h('p', { class: 'notes' }, m.notes) : null,
  );
}

// ---------------------------------------------------------------------------- photos
function photoTile(p, strip = false) {
  if (strip) return p.thumb ? h('img', { src: p.thumb, alt: p.note || p.kind, loading: 'lazy' }) : null;
  const tags = [h('span', { class: `badge ${p.kind === 'receipt' ? 'auchan' : p.kind === 'meal' ? 'nico' : ''}` }, p.kind)];
  if (p.status === 'pending') tags.push(h('span', { class: 'badge warn' }, 'pending'));
  const link = p.meal_id != null ? `#meals` : p.purchase_id != null ? `#purchases/${p.purchase_id}` : null;
  const cap = [fmt.day(p.taken_at || p.created_at), p.note, p.processed_note].filter(Boolean).join(' · ');
  const tile = h(
    'div',
    { class: 'photo' },
    p.thumb ? h('img', { src: p.thumb, alt: p.note || p.kind, loading: 'lazy' }) : h('div', { class: 'ph' }, icon(p.kind === 'receipt' ? 'receipt' : 'image'), p.kind === 'receipt' ? 'receipt (not published)' : 'no preview'),
    h('div', { class: 'tags' }, tags),
    h('div', { class: 'cap' }, cap),
  );
  return link ? h('a', { href: link, style: 'display:block' }, tile) : tile;
}

function viewPhotos() {
  const all = state.snap.photos;
  const f = state.photoFilter;
  const items = all.filter((p) => (f === 'all' ? true : f === 'pending' ? p.status === 'pending' : p.kind === f));
  const chips = [
    ['all', `All ${all.length}`],
    ['pending', `Pending ${state.snap.photo_counts.pending}`],
    ['meal', 'Meals'],
    ['receipt', 'Receipts'],
    ['pantry', 'Pantry'],
  ].map(([key, label]) =>
    h(
      'button',
      {
        class: 'chip',
        'aria-pressed': String(f === key),
        onclick: () => {
          state.photoFilter = key;
          render();
        },
      },
      label,
    ),
  );
  return [
    h('h1', null, 'Photos'),
    h('p', { class: 'sub' }, 'Uploaded at home; pending ones are waiting for an agent to log them. Receipts are not published here.'),
    h('div', { class: 'chips', style: 'margin-bottom:12px' }, chips),
    items.length ? h('div', { class: 'grid-photos' }, items.map((p) => photoTile(p))) : h('div', { class: 'empty' }, 'No photos.'),
  ];
}

// ---------------------------------------------------------------------------- search
function searchProducts(q, src, inStock) {
  const tokens = fold(q).split(/[^a-z0-9]+/).filter(Boolean);
  if (!tokens.length) return [];
  const out = [];
  for (const p of state.snap.products) {
    if (!p.ls) continue;
    if (src && p.s !== src) continue;
    if (inStock && !p.st) continue;
    const hay = fold(`${p.n} ${p.b || ''} ${p.c || ''}`);
    const words = hay.split(/[^a-z0-9]+/);
    if (!tokens.every((t) => words.some((w) => w.startsWith(t)))) continue;
    const name = fold(p.n);
    const score = (name.startsWith(tokens[0]) ? 0 : tokens.every((t) => name.includes(t)) ? 1 : 2) + (p.st ? 0 : 3);
    out.push([score, p]);
    if (out.length > 400) break;
  }
  return out.sort((a, b) => a[0] - b[0] || (a[1].up ?? 1e9) - (b[1].up ?? 1e9)).slice(0, 60).map((x) => x[1]);
}

function viewSearch(r) {
  if (r.query.get('q') != null) state.q = r.query.get('q');
  const results = searchProducts(state.q, state.src, state.stock);
  const rerender = () => {
    const main = document.querySelector('main');
    main.replaceChildren(...[].concat(viewSearch(route())));
  };
  const input = h('input', {
    class: 'input',
    type: 'search',
    placeholder: 'Search both shops (French names, accents optional)…',
    value: state.q,
    oninput: (e) => {
      state.q = e.target.value;
      const grid = document.getElementById('results');
      if (grid) grid.replaceChildren(...resultsGrid(searchProducts(state.q, state.src, state.stock)));
      const count = document.getElementById('count');
      if (count) count.textContent = countLabel(searchProducts(state.q, state.src, state.stock));
    },
  });
  const chip = (label, pressed, onclick) => h('button', { class: 'chip', 'aria-pressed': String(pressed), onclick }, label);
  const countLabel = (res) => (state.q.trim() ? `${res.length}${res.length === 60 ? '+' : ''} products` : `${state.snap.products.filter((p) => p.ls).length.toLocaleString('fr-FR')} products · Nico synced ${fmt.rel(state.snap.sources.find((s) => s.id === 'nico')?.last_sync_at)}, Auchan ${fmt.rel(state.snap.sources.find((s) => s.id === 'auchan')?.last_sync_at)}`);
  return [
    h('h1', null, 'Catalogue'),
    h('p', { class: 'sub', id: 'count' }, countLabel(results)),
    input,
    h(
      'div',
      { class: 'chips', style: 'margin:10px 0 14px' },
      chip('Nico', state.src === 'nico', () => {
        state.src = state.src === 'nico' ? null : 'nico';
        rerender();
      }),
      chip('Auchan', state.src === 'auchan', () => {
        state.src = state.src === 'auchan' ? null : 'auchan';
        rerender();
      }),
      chip('In stock', state.stock, () => {
        state.stock = !state.stock;
        rerender();
      }),
    ),
    h('div', { class: 'results', id: 'results' }, resultsGrid(results)),
  ];
}

function resultsGrid(results) {
  if (!results.length) return [h('div', { class: 'empty', style: 'grid-column:1/-1' }, state.q.trim() ? 'Nothing found. Try other French words.' : 'Type to search the mirrored catalogues.')];
  return results.map((p) => {
    const url = imageUrl(p, 300);
    return h(
      'a',
      { class: `result ${p.st ? '' : 'oos'}`, href: p.u, target: '_blank', rel: 'noreferrer' },
      url ? productImg(url, { alt: '', loading: 'lazy' }, () => h('div', { class: 'ph' })) : h('div', { class: 'ph' }),
      h(
        'div',
        { class: 'b' },
        h('div', { class: 'row', style: 'gap:6px;margin-bottom:4px' }, h('span', { class: `badge dot ${p.s}` }, SOURCE[p.s]), p.ns ? h('span', { class: `ns ns-${p.ns}` }, p.ns) : null),
        h('div', { class: 'n' }, p.b ? h('span', { class: 'muted' }, p.b + ' ') : null, p.n),
        h('div', { class: 'p num' }, priceLabel(p), p.rp != null ? h('span', { class: 'muted small', style: 'text-decoration:line-through;margin-left:6px;font-weight:400' }, fmt.euros(p.rp)) : null),
        h('div', { class: 'muted small' }, [p.q, p.up != null && p.sb !== 'kg' ? `${fmt.euros(p.up)} / ${p.uu || 'u'}` : ''].filter(Boolean).join(' · ')),
        p.st ? null : h('div', { class: 'out' }, 'Out of stock'),
      ),
    );
  });
}

// ---------------------------------------------------------------------------- boot
window.addEventListener('hashchange', render);
(async () => {
  const saved = (() => {
    try {
      return localStorage.getItem(PW_KEY);
    } catch {
      return null;
    }
  })();
  if (!saved) return showLock();
  const status = h('p', { class: 'muted', style: 'text-align:center;margin-top:20vh' }, 'Opening…');
  $app.replaceChildren(h('main', null, status));
  try {
    await unlock(saved, (s) => (status.textContent = s));
    render();
  } catch (err) {
    if (err instanceof WrongPassword) localStorage.removeItem(PW_KEY);
    showLock(err.message);
  }
})();
