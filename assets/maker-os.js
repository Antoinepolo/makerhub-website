/* =====================================================================
   MAKER_OS — comportements communs à toutes les pages
   Nécessite assets/data.js chargé avant.
   ===================================================================== */
(() => {
'use strict';

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc  = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isHome = document.body.dataset.page === 'home';
// Pages placées dans un sous-dossier (articles/, formations/) : <body data-root="../">
const ROOT = document.body.dataset.root || '';
const url = p => /^(https?:|mailto:|#|\/)/.test(p) ? p : ROOT + p;
const HOME = url('index.html');
// Toujours du plus récent au plus ancien (tri stable : à date égale, l'ordre du fichier est gardé)
const ARTICLES = (window.MH_ARTICLES || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
const fmtDate = d => { try { return new Date(d + 'T12:00:00').toLocaleDateString('fr-BE', { day: 'numeric', month: 'short', year: 'numeric' }); } catch { return d; } };
const FORMATIONS = window.MH_FORMATIONS || [];
const LINKS = window.MH_LINKS || {};
const COLORS = { amber: '--amber', rose: '--rose', purple: '--purple', neon: '--neon', cyan: '--cyan', pink: '--pink' };

const store = {
    get(k)    { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
    sget(k)   { try { return sessionStorage.getItem(k); } catch { return null; } },
    sset(k, v){ try { sessionStorage.setItem(k, v); } catch {} }
};
const isTyping = () => { const a = document.activeElement; return !!a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable); };
const smooth = () => (reduce ? 'auto' : 'smooth');

/* ---------- Éléments injectés (identiques sur toutes les pages) ---------- */
document.body.insertAdjacentHTML('afterbegin', '<div id="spot" aria-hidden="true"></div><div class="bg-grid" aria-hidden="true"></div>');
document.body.insertAdjacentHTML('beforeend', `
<div id="toast" role="status" aria-live="polite"></div>
<div class="statusbar" aria-hidden="true">
    <span class="mode" id="sb-mode">NORMAL</span>
    <span class="seg file">~/maker-hub/<b id="sb-file">${esc(document.body.dataset.file || 'accueil')}</b></span>
    <span class="seg hint hide-sm"><kbd>?</kbd>&nbsp;raccourcis</span>
    <span class="right">
        <span class="seg hide-sm">utf-8</span>
        <span class="seg hide-sm">fr_BE</span>
        <span class="seg" id="sb-pct">Top</span>
        <span class="seg" id="sb-clock">--:--</span>
    </span>
</div>
<dialog id="palette" aria-label="Navigation rapide">
    <div class="pal">
        <div class="pal-in"><span>❯</span><input id="pal-in" type="text" placeholder="Aller à une section, un article, une formation…" aria-controls="pal-list" aria-autocomplete="list" autocomplete="off" spellcheck="false"></div>
        <ul id="pal-list" role="listbox" aria-label="Résultats"></ul>
        <div class="pal-foot"><span><kbd>↑</kbd> <kbd>↓</kbd> naviguer</span><span><kbd>↵</kbd> ouvrir</span><span><kbd>Esc</kbd> fermer</span></div>
    </div>
</dialog>
<dialog id="keys" aria-labelledby="keys-title">
    <h2 id="keys-title">:help raccourcis</h2>
    <dl>
        <dt><kbd>Ctrl</kbd> <kbd>K</kbd> / <kbd>/</kbd></dt><dd>Navigation rapide</dd>
        <dt><kbd>j</kbd> / <kbd>k</kbd></dt><dd>Section suivante / précédente</dd>
        <dt><kbd>g</kbd> / <kbd>G</kbd></dt><dd>Haut / bas de page</dd>
        ${isHome ? '<dt><kbd>t</kbd></dt><dd>Focus sur le terminal</dd>' : ''}
        <dt><kbd>?</kbd></dt><dd>Cette aide</dd>
    </dl>
    <form method="dialog"><button class="btn btn-ghost" type="submit">:q</button></form>
</dialog>`);

/* ---------- Toast ---------- */
function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- Thème phosphore + CRT ---------- */
const ACCENTS = ['green', 'amber', 'cyan', 'purple'];
function setAccent(a, silent) {
    if (!ACCENTS.includes(a)) return false;
    document.documentElement.dataset.accent = a;
    store.set('mh-accent', a);
    if (!silent) toast(`phosphore : ${a}`);
    return true;
}
function toggleCrt() {
    const on = document.body.classList.toggle('crt');
    store.set('mh-crt', on ? '1' : '0');
    toast(`CRT ${on ? 'activé' : 'désactivé'}`);
    return on;
}
setAccent(store.get('mh-accent') || 'green', true);
if (store.get('mh-crt') === '1') document.body.classList.add('crt');

/* ---------- Projecteur + halos : mis à jour une fois par image ---------- */
if (!reduce && matchMedia('(pointer: fine)').matches) {
    const spot = $('#spot');
    let mx = 0, my = 0, target = null, queued = false;
    const frame = () => {
        queued = false;
        spot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
        if (target) {
            const r = target.getBoundingClientRect();
            target.style.setProperty('--x', (mx - r.left) + 'px');
            target.style.setProperty('--y', (my - r.top) + 'px');
        }
    };
    addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY;
        target = e.target.closest ? e.target.closest('.glow') : null;
        if (!queued) { queued = true; requestAnimationFrame(frame); }
    }, { passive: true });
}

/* ---------- Révélation au scroll ---------- */
function reveal(root = document) {
    const els = $$('.reveal:not(.in)', root);
    if (reduce || !('IntersectionObserver' in window)) return els.forEach(el => el.classList.add('in'));
    const io = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -8% 0px' });
    els.forEach((el, i) => { el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
}

/* ---------- Navigation ---------- */
function go(hash) {
    if (!isHome) { location.href = HOME + (hash === '#top' ? '' : hash); return; }
    if (hash === '#top') return scrollTo({ top: 0, behavior: smooth() });
    const el = $(hash); el && el.scrollIntoView({ behavior: smooth() });
}

/* ---------- Retour intelligent : <a data-back href="…"> ----------
   Si on vient d'une page du site, on revient en arrière dans l'historique
   (le navigateur restaure la position exacte). Sinon, le href sert de repli. */
$$('[data-back]').forEach(a => a.addEventListener('click', e => {
    try {
        const ref = new URL(document.referrer);
        if (ref.origin === location.origin && ref.href !== location.href && history.length > 1) { e.preventDefault(); history.back(); }
    } catch { /* pas de referrer : le lien fait le travail */ }
}));

/* =====================================================================
   PAGES D'ARTICLE (.prose)
   ===================================================================== */
const prose = $('.prose');
if (prose) {
    const file = document.body.dataset.file || 'article';
    const slug = s => norm(s).replace(/^\d+\.\s*/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const heads = $$('h2', prose);
    heads.forEach((h, i) => {
        h.dataset.label = h.textContent.trim();
        if (!h.id) h.id = slug(h.textContent) || 'section-' + (i + 1);
        h.dataset.section = `${file} § ${String(i + 1).padStart(2, '0')}`;
        // Ancre « # » au survol, pour partager un lien direct vers la section
        h.insertAdjacentHTML('beforeend', ` <a class="anchor" href="#${h.id}" aria-label="Lien vers cette section">#</a>`);
    });

    // Sommaire
    const toc = $('#toc');
    if (toc) {
        if (heads.length < 2) toc.closest('.toc').remove();
        else {
            toc.innerHTML = heads.map(h => `<li><a href="#${h.id}">${esc(h.dataset.label)}</a></li>`).join('');
            const links = $$('a', toc);
            const spy = () => {
                let cur = -1;
                heads.forEach((h, i) => { if (h.getBoundingClientRect().top < 140) cur = i; });
                links.forEach((l, i) => l.classList.toggle('on', i === cur));
            };
            addEventListener('scroll', spy, { passive: true }); spy();
        }
    }

    // Barre de progression de lecture
    $('.topbar').insertAdjacentHTML('beforeend', '<div class="read-progress" aria-hidden="true"><span></span></div>');
    const bar = $('.read-progress span');
    const progress = () => {
        const r = prose.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight * 0.4 - r.top) / Math.max(1, r.height)));
        bar.style.transform = `scaleX(${p})`;
    };
    addEventListener('scroll', progress, { passive: true }); addEventListener('resize', progress); progress();

    // Copier le lien de l'article
    $$('[data-copy-link]').forEach(b => b.addEventListener('click', async () => {
        const link = location.href.split('#')[0];
        try { await navigator.clipboard.writeText(link); toast('lien copié'); }
        catch { prompt('Copie ce lien :', link); }
    }));

    // Boutons « copier » des blocs de code
    $$('.codeblock').forEach(cb => {
        const btn = $('[data-copy]', cb), code = $('pre', cb);
        if (!btn || !code) return;
        btn.addEventListener('click', async () => {
            const text = code.innerText.replace(/\n$/, '');
            try { await navigator.clipboard.writeText(text); }
            catch {
                const r = document.createRange(); r.selectNodeContents(code);
                const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy'); s.removeAllRanges();
            }
            btn.classList.add('ok'); btn.innerHTML = '<i class="fa-solid fa-check" aria-hidden="true"></i> copié';
            toast('code copié dans le presse-papiers');
            setTimeout(() => { btn.classList.remove('ok'); btn.innerHTML = '<i class="fa-regular fa-copy" aria-hidden="true"></i> copier'; }, 1600);
        });
    });
}

/* ---------- Section active, status bar, horloge ---------- */
const sections = $$('[data-section]');
const tabs = $$('.tabs a[href^="#"]');
let lastSection = null;
function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (sections.length) {
        const y = scrollY + innerHeight * 0.35;
        let cur = sections[0];
        sections.forEach(s => { if (s.getBoundingClientRect().top + scrollY <= y) cur = s; });
        if (max - scrollY < 4) cur = sections[sections.length - 1];   // tout en bas : dernière section
        if (cur !== lastSection) {                                     // on ne touche au DOM que si ça change
            lastSection = cur;
            const id = cur.id ? '#' + cur.id : '#top';
            tabs.forEach(a => {
                const on = a.getAttribute('href') === id;
                a.classList.toggle('active', on);
                on ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current');
            });
            $('#sb-file').textContent = cur.dataset.section;
        }
    }
    const pct = max > 0 ? Math.round(scrollY / max * 100) : 0;
    $('#sb-pct').textContent = pct <= 0 ? 'Top' : pct >= 100 ? 'Bot' : pct + '%';
}
addEventListener('scroll', onScroll, { passive: true });
const clock = () => { $('#sb-clock').textContent = new Date().toLocaleTimeString('fr-BE', { hour: '2-digit', minute: '2-digit' }); };
clock(); setInterval(clock, 15000);
addEventListener('focusin',  () => { $('#sb-mode').textContent = isTyping() ? 'INSERT' : 'NORMAL'; });
addEventListener('focusout', () => setTimeout(() => { $('#sb-mode').textContent = isTyping() ? 'INSERT' : 'NORMAL'; }));

/* ---------- Footer (une seule source pour tout le site) ----------
   Chaque page contient <footer data-footer>…liens de secours…</footer> ;
   le contenu est remplacé ici, avec les bons chemins selon la page. */
const homeLink = h => (isHome ? h : HOME + h);
$$('footer[data-footer]').forEach(f => {
    f.innerHTML = `
    <div class="wrap">
        <div class="foot-grid">
            <div class="about">
                <a href="${homeLink('#top')}" class="brand"><img src="${url('images/logo.png')}" alt="" width="30" height="30"><span>MAKER HUB</span></a>
                <p>Projet étudiant autour de la Maker Culture, né en avril 2026 à Namur (Belgique). Électronique, code, fabrication et cybersécurité.</p>
                <div class="social">
                    <a href="${esc(LINKS.discord)}" target="_blank" rel="noopener noreferrer" aria-label="Discord"><i class="fa-brands fa-discord" aria-hidden="true"></i></a>
                    <a href="${esc(LINKS.github)}" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><i class="fa-brands fa-github" aria-hidden="true"></i></a>
                    <a href="mailto:${esc(LINKS.mail)}" aria-label="E-mail"><i class="fa-solid fa-envelope" aria-hidden="true"></i></a>
                </div>
            </div>
            <nav aria-label="Plan du site">
                <h2>site</h2>
                <ul>
                    <li><a href="${homeLink('#projet')}">Le projet</a></li>
                    <li><a href="${url('articles.html')}">Articles</a></li>
                    <li><a href="${homeLink('#formations')}">Formations</a></li>
                    <li><a href="${homeLink('#equipe')}">Équipe</a></li>
                    <li><a href="${homeLink('#faq')}">FAQ</a></li>
                    <li><a href="${homeLink('#contact')}">Contact</a></li>
                </ul>
            </nav>
            <div>
                <h2>valeurs</h2>
                <ul class="values">
                    <li><b>Entraide</b> on apprend ensemble, sans jugement</li>
                    <li><b>Accessible</b> des explications claires, quel que soit le niveau</li>
                    <li><b>Ouvert</b> contenus gratuits, doc libre sur GitHub</li>
                    <li><b>Curiosité</b> aller plus loin que les tutos habituels</li>
                </ul>
            </div>
            <nav aria-label="Informations légales">
                <h2>legal</h2>
                <ul>
                    <li><a href="${url('mentions-legales.html')}">Mentions légales</a></li>
                    <li><a href="${url('confidentialite.html')}">Confidentialité</a></li>
                    <li><a href="${url('conditions.html')}">Conditions d'utilisation</a></li>
                    <li><a href="${url('accessibilite.html')}">Accessibilité</a></li>
                </ul>
            </nav>
        </div>
        <div class="foot-bottom">
            <span>$ Maker Hub © <span data-year>2026</span> — Propulsé par la curiosité.</span>
            <span class="meta">
                <span><i class="fa-solid fa-cookie-bite" aria-hidden="true"></i> 0 cookie traceur</span>
                <span>uptime : <span data-uptime>—</span></span>
                <a href="#top" class="to-top" data-to-top>$ cd ~ <i class="fa-solid fa-arrow-up" aria-hidden="true"></i></a>
            </span>
        </div>
    </div>`;
});
$$('[data-to-top]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollTo({ top: 0, behavior: smooth() }); }));
$$('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
$$('[data-uptime]').forEach(el => {
    const now = new Date(), months = (now.getFullYear() - 2026) * 12 + now.getMonth() - 3;
    el.textContent = months <= 0 ? 'depuis avril 2026' : `${months} mois`;
});

/* =====================================================================
   LISTES D'ARTICLES  <ul data-articles data-limit="4">
   ===================================================================== */
function rowHtml(a) {
    const type = a.tags.includes('new') ? 'new' : a.tags[0];
    const color = COLORS[a.color] ? `var(${COLORS[a.color]})` : 'var(--accent)';
    const date = a.date ? `<time class="date" datetime="${esc(a.date)}">${esc(fmtDate(a.date))}</time>` : '<span></span>';
    return `<li data-tags="${esc(a.tags.join(' '))}"><a class="ls-row" href="${esc(url(a.href))}" style="--c: ${color}">
        <span class="type ${esc(type)}">${esc(type.toUpperCase())}</span>
        <span class="name"><h3 class="${esc(a.grad || '')}">${esc(a.title)}</h3><p>${esc(a.desc)}</p></span>
        ${date}
        <i class="fa-solid fa-arrow-right go" aria-hidden="true"></i></a></li>`;
}
$$('[data-articles]').forEach(list => {
    const box = list.closest('.ls');
    const limit = parseInt(list.dataset.limit, 10) || Infinity;
    const exclude = list.dataset.exclude || '';
    const toolbar = list.dataset.toolbar ? $(list.dataset.toolbar) : null;
    const grep = toolbar && $('input[type="search"]', toolbar);
    const btns = toolbar ? $$('[data-f]', toolbar) : [];
    const total = $('.ls-total', box), empty = $('.ls-empty', box), more = $('.ls-more', box);
    let filter = 'all';

    function render() {
        const q = grep ? norm(grep.value.trim()) : '';
        const found = ARTICLES.filter(a => a.href !== exclude &&
            (filter === 'all' || a.tags.includes(filter)) &&
            (!q || norm(a.title + ' ' + a.desc).includes(q)));
        const shown = found.slice(0, limit);
        list.innerHTML = shown.map(rowHtml).join('');
        if (total) total.textContent = `total ${found.length}` + (found.length > shown.length ? ` — affichés ${shown.length}` : '');
        if (empty) empty.hidden = found.length > 0;
        if (more && $('.c-dim', more)) {
            const rest = ARTICLES.length - Math.min(limit, ARTICLES.length);
            $('.c-dim', more).textContent = rest > 0 ? `(+${rest})` : `(${ARTICLES.length})`;
        }
    }
    grep && grep.addEventListener('input', render);
    btns.forEach(b => b.addEventListener('click', () => {
        filter = b.dataset.f;
        btns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        render();
    }));
    // ?q=… dans l'URL pré-remplit la recherche (ex. articles.html?q=pic)
    const urlQ = new URLSearchParams(location.search).get('q');
    if (grep && urlQ) grep.value = urlQ;
    render();
});

/* =====================================================================
   PALETTE Ctrl+K
   ===================================================================== */
const pal = $('#palette'), palIn = $('#pal-in'), palList = $('#pal-list'), keys = $('#keys');
const homeSections = { Accueil: '#top', 'Le projet': '#projet', 'Articles (accueil)': '#articles', Formations: '#formations', Équipe: '#equipe', FAQ: '#faq', Contact: '#contact' };
const nav = href => () => { location.href = url(href); };
let items = [
    ...Object.entries(homeSections).map(([t, h]) => ({ k: 'section', t, run: () => go(h) })),
    { k: 'page', t: 'Tous les articles', run: nav('articles.html') },
    ...$$('.prose h2[id]').map(h => ({ k: 'ici', t: h.dataset.label || h.textContent.trim(), run: () => h.scrollIntoView({ behavior: smooth() }) })),
    ...ARTICLES.map(a => ({ k: 'article', t: a.title, run: nav(a.href) })),
    ...FORMATIONS.map(f => ({ k: 'formation', t: f.title, run: nav(f.href) })),
    { k: 'lien', t: 'Rejoindre le Discord', run: () => open(LINKS.discord, '_blank', 'noopener') },
    { k: 'lien', t: 'Documentation GitHub', run: () => open(LINKS.github, '_blank', 'noopener') },
    { k: 'lien', t: 'Envoyer un e-mail', run: () => { location.href = 'mailto:' + LINKS.mail; } },
    { k: 'légal', t: 'Mentions légales', run: nav('mentions-legales.html') },
    { k: 'légal', t: 'Politique de confidentialité', run: nav('confidentialite.html') },
    { k: 'légal', t: "Conditions d'utilisation", run: nav('conditions.html') },
    ...ACCENTS.map(a => ({ k: 'thème', t: `Phosphore ${a}`, run: () => setAccent(a) })),
    { k: 'thème', t: 'Effet CRT on/off', run: toggleCrt }
];
let palSel = 0, palRes = [];
function fuzzy(q, s) {
    if (!q) return { score: 0, html: esc(s) };
    const ns = norm(s); let qi = 0, html = '', score = 0, last = -2;
    for (let i = 0; i < s.length; i++) {
        if (qi < q.length && ns[i] === q[qi]) { html += `<mark>${esc(s[i])}</mark>`; score += (i === last + 1 ? 3 : 1) + (i === 0 ? 2 : 0); last = i; qi++; }
        else html += esc(s[i]);
    }
    return qi === q.length ? { score, html } : null;
}
function renderPal() {
    const q = norm(palIn.value.trim()).replace(/\s+/g, ' ');
    palRes = items.map(it => ({ it, m: fuzzy(q, it.t) })).filter(x => x.m).sort((a, b) => b.m.score - a.m.score);
    palSel = Math.min(palSel, Math.max(0, palRes.length - 1));
    palList.innerHTML = palRes.length
        ? palRes.map((x, i) => `<li role="option" id="po${i}" aria-selected="${i === palSel}" data-i="${i}"><span class="k">${esc(x.it.k)}</span><span class="t">${x.m.html}</span></li>`).join('')
        : '<li style="color:var(--dim)">aucun résultat</li>';
    palIn.setAttribute('aria-activedescendant', palRes.length ? 'po' + palSel : '');
    const s = $('#po' + palSel); s && s.scrollIntoView({ block: 'nearest' });
}
function openPal() { if (pal.open) return; palIn.value = ''; palSel = 0; renderPal(); pal.showModal(); palIn.focus(); }
function choose(i) { const x = palRes[i]; if (!x) return; pal.close(); x.it.run(); }
palIn.addEventListener('input', () => { palSel = 0; renderPal(); });
palIn.addEventListener('keydown', e => {
    const n = Math.max(1, palRes.length);
    if (e.key === 'ArrowDown') { e.preventDefault(); palSel = (palSel + 1) % n; renderPal(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); palSel = (palSel - 1 + n) % n; renderPal(); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(palSel); }
});
palList.addEventListener('click', e => { const li = e.target.closest('li[data-i]'); li && choose(+li.dataset.i); });
pal.addEventListener('click', e => { if (e.target === pal) pal.close(); });
$$('[data-open-palette]').forEach(b => b.addEventListener('click', openPal));

/* ---------- Raccourcis clavier ---------- */
addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return pal.open ? pal.close() : openPal(); }
    if (isTyping() || pal.open || keys.open || e.ctrlKey || e.metaKey || e.altKey) return;
    const secs = sections.length ? sections : [document.body];
    const curIdx = () => { let idx = 0; secs.forEach((s, i) => { if (s.getBoundingClientRect().top <= 90) idx = i; }); return idx; };
    switch (e.key) {
        case '/': e.preventDefault(); openPal(); break;
        case '?': e.preventDefault(); keys.showModal(); break;
        case 'j': secs[Math.min(secs.length - 1, curIdx() + 1)].scrollIntoView({ behavior: smooth() }); break;
        case 'k': { const i = curIdx(); i <= 1 ? scrollTo({ top: 0, behavior: smooth() }) : secs[i - 1].scrollIntoView({ behavior: smooth() }); break; }
        case 'g': scrollTo({ top: 0, behavior: smooth() }); break;
        case 'G': scrollTo({ top: document.documentElement.scrollHeight, behavior: smooth() }); break;
        default: document.dispatchEvent(new CustomEvent('mh:key', { detail: e }));
    }
});

reveal();
onScroll();

/* API partagée avec les scripts propres à chaque page */
window.MH = { $, $$, esc, norm, reduce, store, toast, setAccent, toggleCrt, ACCENTS, go, reveal, isHome,
              articles: ARTICLES, formations: FORMATIONS, links: LINKS };
})();
