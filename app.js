(function () {
'use strict';

/* ------------------------------------------------------------------ *
 *  Segédek
 * ------------------------------------------------------------------ */
var cfg = window.APP_CONFIG || {};
function $(s, r) { return (r || document).querySelector(s); }
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
var DAYS = ['hétfő', 'kedd', 'szerda', 'csütörtök', 'péntek', 'szombat', 'vasárnap'];
var MONTHS = ['január', 'február', 'március', 'április', 'május', 'június', 'július', 'augusztus', 'szeptember', 'október', 'november', 'december'];
var KINDS = { csoport: 'Csoport', iroda: 'Irodai munka', fizikai: 'Fizikai munka' };
var KIND_ORDER = { csoport: 0, iroda: 1, fizikai: 2 };

function pad(n) { return String(n).padStart(2, '0'); }
function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function parseDay(s) { var p = s.split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); }
function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
function mondayOf(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); return addDays(x, -((x.getDay() + 6) % 7)); }
function fmtDM(d) { return pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + '.'; }
function fmtN(n) { return Number(n).toLocaleString('hu-HU', { maximumFractionDigits: 2 }); }
function fmtDT(s) {
  var d = new Date(s);
  return d.getFullYear() + '.' + pad(d.getMonth() + 1) + '.' + pad(d.getDate()) + '. ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function fmtD(s) { return s ? s.replace(/-/g, '.') + '.' : ''; }

function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }

var toastTimer;
function toast(msg, isErr) {
  var el = document.createElement('div');
  el.className = 'toast' + (isErr ? ' err' : '');
  el.textContent = msg;
  $('#toast').appendChild(el);
  setTimeout(function () { el.remove(); }, isErr ? 6000 : 2600);
}

function openModal(title, body) {
  var m = $('#modal');
  m.innerHTML = '<div class="overlay"><div class="modal" role="dialog" aria-modal="true">' +
    '<div class="mhead"><h3>' + esc(title) + '</h3><button class="icon" data-close aria-label="Bezár">✕</button></div>' +
    '<div class="mbody">' + body + '</div></div></div>';
  m.onclick = function (e) {
    if (e.target.classList.contains('overlay') || e.target.closest('[data-close]')) closeModal();
  };
  return $('.modal', m);
}
function closeModal() { $('#modal').innerHTML = ''; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

/* ------------------------------------------------------------------ *
 *  Állapot
 * ------------------------------------------------------------------ */
var sb = null;
var S = {
  me: null, profile: null, view: 'tasks',
  tasks: [], schedule: [], proc: [], log: [], profiles: [],
  f: { cat: '', kind: '', open: false, q: '' },
  pf: { q: '', need: false },
  collapsed: {}, weekStart: mondayOf(new Date()), logDays: 30, chan: null
};
function isAdmin() { return !!(S.profile && S.profile.role === 'admin'); }
function myName() { return (S.profile && (S.profile.name || S.profile.email)) || 'ismeretlen'; }

/* ------------------------------------------------------------------ *
 *  Indítás, belépés
 * ------------------------------------------------------------------ */
function boot() {
  if (!window.supabase || !cfg.SUPABASE_URL || /IDE_MASOLD/.test(cfg.SUPABASE_URL) || /IDE_MASOLD/.test(cfg.SUPABASE_ANON_KEY || '')) {
    $('#root').innerHTML = '<div class="authwrap"><div class="authcard"><h1>Beállítás szükséges</h1>' +
      '<p class="muted">Nyisd meg a <b>config.js</b> fájlt, és írd be a Supabase projekt URL-jét és anon kulcsát. A részletek a README.md-ben vannak.</p></div></div>';
    return;
  }
  sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  sb.auth.onAuthStateChange(function (ev) { if (ev === 'SIGNED_OUT') { S.profile = null; showLogin(); } });
  sb.auth.getSession().then(function (r) {
    if (r.data && r.data.session) afterLogin(r.data.session.user); else showLogin();
  });
}

function showLogin(msg) {
  closeModal();
  $('#root').innerHTML = '<div class="authwrap"><form class="authcard" id="loginForm">' +
    '<h1>Céges teendők</h1><p class="muted" style="margin:0">Jelentkezz be a belső felület eléréséhez.</p>' +
    '<label>E-mail<input type="email" name="email" required autocomplete="username"></label>' +
    '<label>Jelszó<input type="password" name="password" required autocomplete="current-password"></label>' +
    '<div class="err" id="loginErr">' + esc(msg || '') + '</div>' +
    '<button class="btn primary" type="submit">Belépés</button></form></div>';
  $('#loginForm').onsubmit = function (e) {
    e.preventDefault();
    var f = e.target, btn = $('button', f);
    btn.disabled = true;
    sb.auth.signInWithPassword({ email: f.email.value.trim(), password: f.password.value }).then(function (r) {
      if (r.error) { $('#loginErr').textContent = 'Hibás e-mail vagy jelszó.'; btn.disabled = false; return; }
      afterLogin(r.data.user);
    });
  };
}

function showPending(user) {
  $('#root').innerHTML = '<div class="authwrap"><div class="authcard"><h1>Jóváhagyásra vár</h1>' +
    '<p class="muted">A(z) <b>' + esc(user.email) + '</b> fiók még nincs jóváhagyva. Szólj az adminnak, majd lépj be újra.</p>' +
    '<button class="btn" id="outBtn">Kilépés</button></div></div>';
  $('#outBtn').onclick = logout;
}

function logout() {
  if (sb.removeAllChannels) sb.removeAllChannels();
  sb.auth.signOut().then(function () { S.profile = null; showLogin(); });
}

function afterLogin(user) {
  S.me = user;
  return sb.from('profiles').select('*').eq('id', user.id).maybeSingle().then(function (r) {
    if (r.error) { showLogin('Nem sikerült betölteni a profilt: ' + r.error.message); return; }
    if (!r.data || !r.data.approved) { showPending(user); return; }
    S.profile = r.data;
    return loadAll().then(function () { mountShell(); subscribe(); });
  });
}

/* ------------------------------------------------------------------ *
 *  Adatbetöltés
 * ------------------------------------------------------------------ */
function scheduleRange() {
  var ws = S.weekStart;
  var mStart = new Date(ws.getFullYear(), ws.getMonth(), 1);
  var mEnd = new Date(ws.getFullYear(), ws.getMonth() + 1, 0);
  var from = mStart < ws ? mStart : ws;
  var wEnd = addDays(ws, 6);
  var to = mEnd > wEnd ? mEnd : wEnd;
  return [iso(from), iso(to)];
}

var LOADERS = {
  tasks: function () { return sb.from('tasks').select('*').order('cat_order').order('pos').order('id'); },
  schedule: function () { var r = scheduleRange(); return sb.from('schedule').select('*').gte('day', r[0]).lte('day', r[1]).order('day'); },
  procurement: function () { return sb.from('procurement').select('*').order('pos').order('id'); },
  procurement_log: function () { return sb.from('procurement_log').select('*').order('created_at', { ascending: false }).limit(1000); },
  profiles: function () { return sb.from('profiles').select('*').order('created_at'); }
};
var TARGET = { tasks: 'tasks', schedule: 'schedule', procurement: 'proc', procurement_log: 'log', profiles: 'profiles' };

function reloadTable(t) {
  return LOADERS[t]().then(function (r) {
    if (r.error) { toast('Betöltési hiba (' + t + '): ' + r.error.message, true); return; }
    S[TARGET[t]] = r.data || [];
    refresh(t);
  });
}
function loadAll() {
  return Promise.all(Object.keys(LOADERS).map(function (t) {
    return LOADERS[t]().then(function (r) {
      if (r.error) toast('Betöltési hiba (' + t + '): ' + r.error.message, true);
      else S[TARGET[t]] = r.data || [];
    });
  }));
}
function refresh(t) {
  if (!V[S.view]) return;
  var rel = { tasks: ['tasks'], schedule: ['schedule'], proc: ['procurement', 'procurement_log'], users: ['profiles'] };
  if (rel[S.view].indexOf(t) >= 0 || (S.view === 'schedule' && t === 'profiles')) V[S.view].update();
}

var timers = {};
function debReload(t) { clearTimeout(timers[t]); timers[t] = setTimeout(function () { reloadTable(t); }, 250); }
function subscribe() {
  S.chan = sb.channel('db-changes');
  Object.keys(LOADERS).forEach(function (t) {
    S.chan.on('postgres_changes', { event: '*', schema: 'public', table: t }, function () { debReload(t); });
  });
  S.chan.subscribe();
}

/* ------------------------------------------------------------------ *
 *  Keret
 * ------------------------------------------------------------------ */
function mountShell() {
  var tabs = [['tasks', 'Teendők'], ['schedule', 'Heti beosztás'], ['proc', 'Beszerzés']];
  if (isAdmin()) tabs.push(['users', 'Felhasználók']);
  $('#root').innerHTML = '<header class="top"><div class="brand">Céges teendők</div>' +
    '<nav id="nav">' + tabs.map(function (t) { return '<button data-view="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</nav>' +
    '<div class="user"><span>' + esc(myName()) + (isAdmin() ? ' <span class="tag">admin</span>' : '') + '</span>' +
    '<button class="btn small" id="pwBtn">Jelszó</button><button class="btn small" id="outBtn">Kilépés</button></div></header>' +
    '<main id="content"></main>';
  $('#nav').onclick = function (e) { var b = e.target.closest('[data-view]'); if (b) setView(b.dataset.view); };
  $('#outBtn').onclick = logout;
  $('#pwBtn').onclick = openPassword;
  setView(S.view === 'users' && !isAdmin() ? 'tasks' : S.view);
}

function setView(v) {
  S.view = v;
  $$('#nav button').forEach(function (b) { b.classList.toggle('on', b.dataset.view === v); });
  V[v].mount();
}

function openPassword() {
  var m = openModal('Jelszó módosítása',
    '<form class="form" id="pwForm"><label>Új jelszó (legalább 8 karakter)<input type="password" name="p" minlength="8" required autocomplete="new-password"></label>' +
    '<div class="actions"><button type="button" class="btn" data-close>Mégse</button><button class="btn primary" type="submit">Mentés</button></div></form>');
  $('#pwForm', m).onsubmit = function (e) {
    e.preventDefault();
    sb.auth.updateUser({ password: e.target.p.value }).then(function (r) {
      if (r.error) toast('Hiba: ' + r.error.message, true); else { toast('Jelszó módosítva'); closeModal(); }
    });
  };
}

/* ------------------------------------------------------------------ *
 *  1) TEENDŐK
 * ------------------------------------------------------------------ */
function catList() {
  var m = {};
  S.tasks.forEach(function (t) { if (!(t.category in m)) m[t.category] = t.cat_order; });
  return Object.keys(m).sort(function (a, b) { return m[a] - m[b]; });
}
function catNote(c) {
  var cs = (window.SEED && window.SEED.categories) || [];
  for (var i = 0; i < cs.length; i++) if (cs[i].name === c) return cs[i].note || '';
  return '';
}

function tasksMount() {
  var admin = isAdmin();
  $('#content').innerHTML =
    '<div class="toolbar">' +
    '<select id="fCat"></select>' +
    '<select id="fKind"><option value="">Minden típus</option><option value="folyamatos">Folyamatos</option><option value="egyszeri">Egyszeri</option></select>' +
    '<label class="chk"><input type="checkbox" id="fOpen"> Csak nyitott</label>' +
    '<input type="search" id="fQ" placeholder="Keresés…">' +
    '<span class="grow"></span>' +
    (admin ? '<button class="btn" id="resetCont" title="A folyamatos feladatok pipáinak törlése (új időszak kezdete)">Folyamatosak nullázása</button>' : '') +
    '<button class="btn primary" id="addTask">+ Új teendő</button></div>' +
    '<div class="stats" id="stats"></div>' +
    '<div class="legend"><span><i class="dot folyamatos"></i>Folyamatos teendő</span><span><i class="dot egyszeri"></i>Egyszer megcsinálandó</span><span><span class="tag">új</span> az eredeti listához hozzáadott pont</span></div>' +
    '<div id="taskList"></div>';
  $('#fKind').value = S.f.kind; $('#fOpen').checked = S.f.open; $('#fQ').value = S.f.q;
  $('#fCat').onchange = function (e) { S.f.cat = e.target.value; tasksUpdate(); };
  $('#fKind').onchange = function (e) { S.f.kind = e.target.value; tasksUpdate(); };
  $('#fOpen').onchange = function (e) { S.f.open = e.target.checked; tasksUpdate(); };
  $('#fQ').oninput = function (e) { S.f.q = e.target.value; tasksUpdate(); };
  $('#addTask').onclick = function () { openTask(null, S.f.cat); };
  if (admin) $('#resetCont').onclick = resetContinuous;
  var list = $('#taskList');
  list.addEventListener('change', function (e) {
    var cb = e.target.closest('input[type=checkbox][data-toggle]');
    if (cb) toggleTask(Number(cb.dataset.toggle), cb.checked);
  });
  list.addEventListener('click', function (e) {
    var ed = e.target.closest('[data-edit]');
    if (ed) { openTask(Number(ed.dataset.edit)); return; }
    var h = e.target.closest('[data-cat]');
    if (h) { S.collapsed[h.dataset.cat] = !S.collapsed[h.dataset.cat]; tasksUpdate(); return; }
    var imp = e.target.closest('#importSeed');
    if (imp) importSeed();
  });
  tasksUpdate();
}

function tasksUpdate() {
  if (!$('#taskList')) return;
  var f = S.f, q = f.q.trim().toLowerCase();
  var cats = catList();
  var sel = $('#fCat');
  sel.innerHTML = '<option value="">Minden kategória</option>' + cats.map(function (c) {
    return '<option value="' + esc(c) + '"' + (c === f.cat ? ' selected' : '') + '>' + esc(c) + '</option>';
  }).join('');
  if (f.cat && cats.indexOf(f.cat) < 0) { f.cat = ''; sel.value = ''; }

  // összesítők (a teljes listára)
  var one = S.tasks.filter(function (t) { return t.kind === 'egyszeri'; });
  var cont = S.tasks.filter(function (t) { return t.kind === 'folyamatos'; });
  var oneDone = one.filter(function (t) { return t.done; }).length;
  var contDone = cont.filter(function (t) { return t.done; }).length;
  function pct(a, b) { return b ? Math.round(a * 100 / b) : 0; }
  $('#stats').innerHTML =
    '<div class="card stat"><div class="top2"><span>Egyszeri feladatok kész</span><b>' + oneDone + ' / ' + one.length + '</b></div><div class="bar r"><i style="width:' + pct(oneDone, one.length) + '%"></i></div></div>' +
    '<div class="card stat"><div class="top2"><span>Folyamatos teendők pipálva</span><b>' + contDone + ' / ' + cont.length + '</b></div><div class="bar g"><i style="width:' + pct(contDone, cont.length) + '%"></i></div></div>';

  var list = S.tasks.filter(function (t) {
    if (f.cat && t.category !== f.cat) return false;
    if (f.kind && t.kind !== f.kind) return false;
    if (f.open && t.done) return false;
    if (q && (t.title + ' ' + (t.assignee || '') + ' ' + (t.note || '')).toLowerCase().indexOf(q) < 0) return false;
    return true;
  });

  var box = $('#taskList');
  if (!S.tasks.length) {
    box.innerHTML = '<div class="card empty">Még nincs egyetlen teendő sem.' +
      (isAdmin() ? '<br><br><button class="btn primary" id="importSeed">Alaplista betöltése (a PDF összes pontja)</button>' : '<br>Az admin tölti fel az alaplistát.') + '</div>';
    return;
  }
  if (!list.length) { box.innerHTML = '<div class="card empty">Nincs a szűrésnek megfelelő teendő.</div>'; return; }

  var today = iso(new Date());
  var html = '';
  cats.forEach(function (c) {
    var all = S.tasks.filter(function (t) { return t.category === c; });
    var items = list.filter(function (t) { return t.category === c; });
    if (!items.length) return;
    var done = all.filter(function (t) { return t.done; }).length;
    var closed = S.collapsed[c] && !q;
    var note = catNote(c);
    html += '<section class="card cat' + (closed ? ' closed' : '') + '">' +
      '<div class="chead" data-cat="' + esc(c) + '"><span class="arrow">▾</span><h3>' + esc(c) + '</h3><span class="cnt">' + done + ' / ' + all.length + '</span></div>' +
      (note ? '<div class="cnote">' + esc(note) + '</div>' : '') +
      '<div class="tasks">' + items.map(function (t) {
        var meta = [];
        if (t.assignee) meta.push('<span>👤 ' + esc(t.assignee) + '</span>');
        if (t.due) meta.push('<span class="' + (!t.done && t.due < today ? 'late' : '') + '">📅 ' + esc(fmtD(t.due)) + '</span>');
        if (t.note) meta.push('<span>📝 ' + esc(t.note) + '</span>');
        if (t.done && t.done_at) meta.push('<span>✔ ' + esc(t.done_by || '') + ', ' + esc(fmtDT(t.done_at)) + '</span>');
        return '<div class="task' + (t.done ? ' done' : '') + '">' +
          '<input type="checkbox" data-toggle="' + t.id + '"' + (t.done ? ' checked' : '') + ' aria-label="Kész">' +
          '<span class="dotw"><i class="dot ' + t.kind + '" title="' + (t.kind === 'folyamatos' ? 'Folyamatos' : 'Egyszeri') + '"></i></span>' +
          '<div class="tmain"><div class="ttitle" data-edit="' + t.id + '">' + esc(t.title) + (t.is_new ? ' <span class="tag">új</span>' : '') + '</div>' +
          (meta.length ? '<div class="tmeta">' + meta.join('') + '</div>' : '') + '</div>' +
          '<button class="icon" data-edit="' + t.id + '" title="Szerkesztés">✎</button></div>';
      }).join('') + '</div></section>';
  });
  box.innerHTML = html;
}

function toggleTask(id, checked) {
  var t = S.tasks.filter(function (x) { return x.id === id; })[0];
  if (!t) return;
  var prev = { done: t.done, done_by: t.done_by, done_at: t.done_at };
  t.done = checked; t.done_by = checked ? myName() : null; t.done_at = checked ? new Date().toISOString() : null;
  tasksUpdate();
  sb.from('tasks').update({ done: t.done, done_by: t.done_by, done_at: t.done_at }).eq('id', id).then(function (r) {
    if (r.error) { Object.assign(t, prev); tasksUpdate(); toast('Nem sikerült menteni: ' + r.error.message, true); }
  });
}

function resetContinuous() {
  if (!confirm('Minden folyamatos teendő pipája törlődik (új időszak kezdődik). Folytatod?')) return;
  sb.from('tasks').update({ done: false, done_by: null, done_at: null }).eq('kind', 'folyamatos').eq('done', true).then(function (r) {
    if (r.error) toast('Hiba: ' + r.error.message, true); else { toast('Folyamatos teendők nullázva'); reloadTable('tasks'); }
  });
}

function nameOptions() {
  var set = {};
  S.profiles.forEach(function (p) { if (p.approved) set[p.name || p.email] = 1; });
  S.schedule.forEach(function (e) { (e.staff || []).forEach(function (n) { set[n] = 1; }); });
  return Object.keys(set).sort();
}

function openTask(id, defCat) {
  var t = id ? S.tasks.filter(function (x) { return x.id === id; })[0] : null;
  var cats = catList();
  var m = openModal(t ? 'Teendő szerkesztése' : 'Új teendő',
    '<form class="form" id="tForm">' +
    '<label>Kategória<input type="text" name="category" list="catList" required value="' + esc(t ? t.category : (defCat || cats[0] || '')) + '"></label>' +
    '<datalist id="catList">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
    '<label>Teendő<textarea name="title" rows="3" required>' + esc(t ? t.title : '') + '</textarea></label>' +
    '<div class="row"><label>Típus<select name="kind"><option value="egyszeri"' + (t && t.kind === 'egyszeri' ? ' selected' : '') + '>Egyszeri (piros)</option>' +
    '<option value="folyamatos"' + (!t || t.kind === 'folyamatos' ? ' selected' : '') + '>Folyamatos (zöld)</option></select></label>' +
    '<label>Felelős<input type="text" name="assignee" list="nameList" value="' + esc(t ? t.assignee : '') + '"></label></div>' +
    '<datalist id="nameList">' + nameOptions().map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist>' +
    '<label>Határidő<input type="date" name="due" value="' + esc(t && t.due ? t.due : '') + '"></label>' +
    '<label>Megjegyzés<textarea name="note" rows="2">' + esc(t ? t.note : '') + '</textarea></label>' +
    '<div class="actions">' + (t && isAdmin() ? '<button type="button" class="btn danger" id="delT">Törlés</button>' : '') + '<span class="sp"></span>' +
    '<button type="button" class="btn" data-close>Mégse</button><button class="btn primary" type="submit">Mentés</button></div></form>');
  $('#tForm', m).onsubmit = function (e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var row = {
      category: String(fd.get('category')).trim(), title: String(fd.get('title')).trim(), kind: fd.get('kind'),
      assignee: String(fd.get('assignee')).trim() || null, due: fd.get('due') || null, note: String(fd.get('note')).trim() || null
    };
    var p;
    if (t) {
      p = sb.from('tasks').update(row).eq('id', t.id);
    } else {
      var same = S.tasks.filter(function (x) { return x.category === row.category; });
      if (same.length) {
        row.cat_order = same[0].cat_order;
        row.pos = Math.max.apply(null, same.map(function (x) { return x.pos; })) + 1;
      } else {
        row.cat_order = S.tasks.length ? Math.max.apply(null, S.tasks.map(function (x) { return x.cat_order; })) + 1 : 1;
        row.pos = 1;
      }
      p = sb.from('tasks').insert(row);
    }
    p.then(function (r) {
      if (r.error) { toast('Hiba: ' + r.error.message, true); return; }
      closeModal(); reloadTable('tasks');
    });
  };
  var del = $('#delT', m);
  if (del) del.onclick = function () {
    if (!confirm('Biztosan törlöd ezt a teendőt?')) return;
    sb.from('tasks').delete().eq('id', t.id).then(function (r) {
      if (r.error) toast('Hiba: ' + r.error.message, true); else { closeModal(); reloadTable('tasks'); }
    });
  };
}

function chunked(table, rows) {
  var p = Promise.resolve({ error: null });
  for (var i = 0; i < rows.length; i += 100) {
    (function (part) {
      p = p.then(function (prev) { return prev.error ? prev : sb.from(table).insert(part); });
    })(rows.slice(i, i + 100));
  }
  return p;
}

function importSeed() {
  if (!window.SEED) return;
  if (!confirm('Betöltöd az alaplistát (a PDF összes teendője + a kiinduló beszerzési tételek)?')) return;
  var rows = [];
  SEED.categories.forEach(function (c, ci) {
    c.tasks.forEach(function (t, i) {
      rows.push({ category: c.name, cat_order: ci + 1, pos: i + 1, title: t[0], kind: t[1] === 'F' ? 'folyamatos' : 'egyszeri', is_new: !!t[2] });
    });
  });
  chunked('tasks', rows).then(function (r) {
    if (r.error) { toast('Hiba: ' + r.error.message, true); return null; }
    if (S.proc.length) return { error: null };
    var pr = [], pos = 1;
    SEED.procurement.forEach(function (g) { g.items.forEach(function (it) { pr.push({ category: g.category, item: it, pos: pos++ }); }); });
    return chunked('procurement', pr);
  }).then(function (r) {
    if (!r) return;
    if (r.error) toast('Hiba a beszerzési tételeknél: ' + r.error.message, true); else toast('Alaplista betöltve');
    reloadTable('tasks'); reloadTable('procurement');
  });
}

/* ------------------------------------------------------------------ *
 *  2) HETI BEOSZTÁS
 * ------------------------------------------------------------------ */
function schedMount() {
  var admin = isAdmin();
  $('#content').innerHTML =
    '<div class="weeknav"><button class="btn" id="wPrev">‹ Előző</button><button class="btn" id="wToday">Ez a hét</button><button class="btn" id="wNext">Következő ›</button>' +
    '<h2 id="weekLabel"></h2><span class="grow" style="flex:1"></span>' +
    (admin ? '<button class="btn" id="wCopy" title="A megjelenített hét beosztását átmásolja a következő hétre">Hét másolása a következőre</button>' : '') + '</div>' +
    '<div class="legend"><span><i class="dot" style="background:var(--green)"></i>Csoport – van előleg</span><span><i class="dot" style="background:var(--accent)"></i>Csoport – nincs előleg</span><span><i class="dot" style="background:var(--red)"></i>Escape</span><span><i class="dot" style="background:#8b5cf6"></i>Irodai munka</span><span><i class="dot" style="background:#f08a3c"></i>Fizikai munka</span>' +
    (admin ? '' : '<span>(a beosztást az admin szerkeszti)</span>') + '</div>' +
    '<div class="grid7" id="weekGrid"></div><div class="card sum" id="monthSum"></div>';
  function go(ws) { S.weekStart = ws; reloadTable('schedule'); schedUpdate(); }
  $('#wPrev').onclick = function () { go(addDays(S.weekStart, -7)); };
  $('#wNext').onclick = function () { go(addDays(S.weekStart, 7)); };
  $('#wToday').onclick = function () { go(mondayOf(new Date())); };
  if (admin) $('#wCopy').onclick = copyWeek;
  $('#weekGrid').addEventListener('click', function (e) {
    if (!admin) return;
    var a = e.target.closest('[data-add]');
    if (a) { openEntry(null, a.dataset.add); return; }
    var en = e.target.closest('[data-entry]');
    if (en) openEntry(Number(en.dataset.entry));
  });
  reloadTable('schedule');
  schedUpdate();
}

function entryClass(e) {
  if (e.kind === 'csoport') {
    if (/escape/i.test(e.title || '')) return 'k-escape';
    return e.deposit ? 'k-deposit' : 'k-nodeposit';
  }
  return 'k-' + e.kind;
}

function sortEntry(a, b) {
  return (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || String(a.time_label || '').localeCompare(String(b.time_label || ''));
}

function schedUpdate() {
  if (!$('#weekGrid')) return;
  var admin = isAdmin(), ws = S.weekStart, today = iso(new Date());
  $('#weekLabel').textContent = ws.getFullYear() + '. ' + fmtDM(ws) + ' – ' + fmtDM(addDays(ws, 6));
  var html = '';
  for (var i = 0; i < 7; i++) {
    var d = addDays(ws, i), key = iso(d);
    var es = S.schedule.filter(function (e) { return e.day === key; }).sort(sortEntry);
    html += '<div class="day' + (key === today ? ' today' : '') + (i >= 5 ? ' wknd' : '') + '">' +
      '<div class="dhead"><b>' + DAYS[i] + '</b><span>' + fmtDM(d) + '</span>' +
      (admin ? '<button class="icon" data-add="' + key + '" title="Hozzáadás">＋</button>' : '') + '</div>' +
      (es.map(function (e) {
        return '<div class="entry ' + entryClass(e) + (admin ? ' adm' : '') + '" data-entry="' + e.id + '"' + (e.note ? ' title="' + esc(e.note) + '"' : '') + '>' +
          '<div class="ek">' + KINDS[e.kind] + (e.time_label ? ' · ' + esc(e.time_label) : '') + (e.kind === 'csoport' && e.deposit ? ' · előleg ✔' : '') + '</div>' +
          (e.title ? '<div class="et">' + esc(e.title) + '</div>' : '') +
          ((e.staff && e.staff.length) ? '<div class="staff">' + e.staff.map(function (n) { return '<span class="chip">' + esc(n) + '</span>'; }).join('') + '</div>' : '') + '</div>';
      }).join('') || '<div class="empty small">–</div>') + '</div>';
  }
  $('#weekGrid').innerHTML = html;

  // havi összesítő
  var mStart = iso(new Date(ws.getFullYear(), ws.getMonth(), 1));
  var mEnd = iso(new Date(ws.getFullYear(), ws.getMonth() + 1, 0));
  var per = {};
  S.schedule.filter(function (e) { return e.day >= mStart && e.day <= mEnd; }).forEach(function (e) {
    var d = parseDay(e.day);
    (e.staff || []).forEach(function (n) {
      var k = n.toLowerCase();
      var o = per[k] || (per[k] = { name: n, we: {}, csoport: 0, iroda: 0, fizikai: 0 });
      o[e.kind]++;
      if (e.kind === 'csoport' && (d.getDay() === 0 || d.getDay() === 6)) o.we[iso(mondayOf(d))] = 1;
    });
  });
  var rows = Object.keys(per).map(function (k) { return per[k]; }).sort(function (a, b) { return a.name.localeCompare(b.name); });
  $('#monthSum').innerHTML = '<h3>Havi összesítő – ' + ws.getFullYear() + '. ' + MONTHS[ws.getMonth()] + '</h3>' +
    (rows.length ? '<table><thead><tr><th>Név</th><th class="n">Hétvége csoporttal (cél: 2)</th><th class="n">Csoport összesen</th><th class="n">Irodai</th><th class="n">Fizikai</th></tr></thead><tbody>' +
      rows.map(function (o) {
        var we = Object.keys(o.we).length;
        return '<tr><td>' + esc(o.name) + '</td><td class="n ' + (we === 2 ? 'ok' : (we < 2 ? 'warn' : 'bad')) + '">' + we + '</td><td class="n">' + o.csoport + '</td><td class="n">' + o.iroda + '</td><td class="n">' + o.fizikai + '</td></tr>';
      }).join('') + '</tbody></table>' : '<div class="empty small">Ebben a hónapban még nincs beosztás.</div>');
}

function openEntry(id, day) {
  var e = id ? S.schedule.filter(function (x) { return x.id === id; })[0] : null;
  var names = nameOptions();
  var m = openModal(e ? 'Beosztás szerkesztése' : 'Új beosztás',
    '<form class="form" id="eForm">' +
    '<div class="row"><label>Nap<input type="date" name="day" required value="' + esc(e ? e.day : day) + '"></label>' +
    '<label>Sík<select name="kind">' + Object.keys(KINDS).map(function (k) {
      return '<option value="' + k + '"' + (e && e.kind === k ? ' selected' : '') + '>' + KINDS[k] + '</option>';
    }).join('') + '</select></label></div>' +
    '<div class="row"><label>Időpont<input type="text" name="time_label" placeholder="pl. 14:00–17:00" value="' + esc(e ? e.time_label : '') + '"></label>' +
    '<label>Esemény / csoport<input type="text" name="title" placeholder="pl. Szülinap – Netflix Copii, vagy Escape" value="' + esc(e ? e.title : '') + '"></label></div>' +
    '<label class="inline" id="depWrap"><input type="checkbox" name="deposit"' + (e && e.deposit ? ' checked' : '') + '> Előleg befizetve</label>' +
    '<label>Kik vesznek részt (vesszővel elválasztva)<input type="text" name="staff" id="staffIn" value="' + esc(e ? (e.staff || []).join(', ') : '') + '"></label>' +
    (names.length ? '<div class="suggest" id="sug">' + names.map(function (n) { return '<button type="button" data-n="' + esc(n) + '">+ ' + esc(n) + '</button>'; }).join('') + '</div>' : '') +
    '<label>Megjegyzés<textarea name="note" rows="2">' + esc(e ? e.note : '') + '</textarea></label>' +
    '<div class="actions">' + (e ? '<button type="button" class="btn danger" id="delE">Törlés</button>' : '') + '<span class="sp"></span>' +
    '<button type="button" class="btn" data-close>Mégse</button><button class="btn primary" type="submit">Mentés</button></div></form>');
  var kindSel = $('[name=kind]', m), depWrap = $('#depWrap', m);
  function syncDep() { depWrap.style.display = kindSel.value === 'csoport' ? '' : 'none'; }
  kindSel.onchange = syncDep; syncDep();
  var sug = $('#sug', m);
  if (sug) sug.onclick = function (ev) {
    var b = ev.target.closest('[data-n]'); if (!b) return;
    var inp = $('#staffIn', m);
    var cur = inp.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    if (cur.map(function (s) { return s.toLowerCase(); }).indexOf(b.dataset.n.toLowerCase()) < 0) cur.push(b.dataset.n);
    inp.value = cur.join(', ');
  };
  $('#eForm', m).onsubmit = function (ev) {
    ev.preventDefault();
    var fd = new FormData(ev.target);
    var row = {
      day: fd.get('day'), kind: fd.get('kind'), deposit: fd.get('kind') === 'csoport' && !!fd.get('deposit'), time_label: String(fd.get('time_label')).trim() || null,
      title: String(fd.get('title')).trim() || null, note: String(fd.get('note')).trim() || null,
      staff: String(fd.get('staff')).split(',').map(function (s) { return s.trim(); }).filter(Boolean)
    };
    (e ? sb.from('schedule').update(row).eq('id', e.id) : sb.from('schedule').insert(row)).then(function (r) {
      if (r.error) { toast('Hiba: ' + r.error.message, true); return; }
      closeModal(); reloadTable('schedule');
    });
  };
  var del = $('#delE', m);
  if (del) del.onclick = function () {
    if (!confirm('Törlöd ezt a beosztást?')) return;
    sb.from('schedule').delete().eq('id', e.id).then(function (r) {
      if (r.error) toast('Hiba: ' + r.error.message, true); else { closeModal(); reloadTable('schedule'); }
    });
  };
}

function copyWeek() {
  var ws = S.weekStart, from = iso(ws), to = iso(addDays(ws, 6));
  var es = S.schedule.filter(function (e) { return e.day >= from && e.day <= to; });
  if (!es.length) { toast('Ezen a héten nincs mit másolni.', true); return; }
  if (!confirm(es.length + ' beosztás átmásolása a következő hétre? (A már meglévőket nem törli.)')) return;
  var rows = es.map(function (e) {
    return { day: iso(addDays(parseDay(e.day), 7)), kind: e.kind, deposit: false, time_label: e.time_label, title: e.title, staff: e.staff, note: e.note };
  });
  sb.from('schedule').insert(rows).then(function (r) {
    if (r.error) toast('Hiba: ' + r.error.message, true);
    else { toast('Átmásolva – lapozz a következő hétre'); reloadTable('schedule'); }
  });
}

/* ------------------------------------------------------------------ *
 *  3) BESZERZÉS
 * ------------------------------------------------------------------ */
function pstatus(p) {
  var min = Number(p.min_stock) || 0, st = Number(p.stock) || 0, ord = Number(p.ordered) || 0;
  if (min <= 0) return { k: 'none', t: 'Nincs minimum' };
  if (st >= min) return { k: 'ok', t: 'Rendben' };
  if (st + ord >= min) return { k: 'ordered', t: 'Megrendelve' };
  return { k: 'need', t: 'Rendelendő' };
}
function procCats() {
  var seen = [];
  S.proc.forEach(function (p) { if (seen.indexOf(p.category) < 0) seen.push(p.category); });
  return seen;
}

function procMount() {
  $('#content').innerHTML =
    '<div class="toolbar"><input type="search" id="pQ" placeholder="Keresés…">' +
    '<label class="chk"><input type="checkbox" id="pNeed"> Csak rendelendő</label><span class="grow"></span>' +
    '<button class="btn" id="pCopy">Rendelési lista másolása</button>' +
    '<button class="btn primary" id="pAdd">+ Új tétel</button></div>' +
    '<div id="pBanner"></div><div id="pList"></div>' +
    '<div class="card sum"><div class="toolbar" style="margin-bottom:6px"><h3 style="margin:0;flex:1">Miből mennyi lett rendelve és fogyott</h3>' +
    '<select id="pDays"><option value="7">Utolsó 7 nap</option><option value="30">Utolsó 30 nap</option><option value="90">Utolsó 90 nap</option></select></div><div id="pLog"></div></div>';
  $('#pQ').value = S.pf.q; $('#pNeed').checked = S.pf.need; $('#pDays').value = String(S.logDays);
  $('#pQ').oninput = function (e) { S.pf.q = e.target.value; procUpdate(); };
  $('#pNeed').onchange = function (e) { S.pf.need = e.target.checked; procUpdate(); };
  $('#pDays').onchange = function (e) { S.logDays = Number(e.target.value); procUpdate(); };
  $('#pAdd').onclick = function () { openItem(null); };
  $('#pCopy').onclick = copyOrderList;
  $('#pList').addEventListener('click', function (e) {
    var a = e.target.closest('[data-act]'); if (a) { openAction(Number(a.dataset.act)); return; }
    var ed = e.target.closest('[data-pedit]'); if (ed) openItem(Number(ed.dataset.pedit));
  });
  procUpdate();
}

function procUpdate() {
  if (!$('#pList')) return;
  var q = S.pf.q.trim().toLowerCase();
  var noMin = S.proc.filter(function (p) { return !(Number(p.min_stock) > 0); }).length;
  $('#pBanner').innerHTML = (S.proc.length && noMin) ? '<div class="banner">' + noMin + ' tételnél nincs megadva minimum készlet – ezeknél nem tudok figyelmeztetni. Szerkeszd a tételt (✎), és add meg a minimumot.</div>' : '';

  if (!S.proc.length) {
    $('#pList').innerHTML = '<div class="card empty">Még nincs beszerzési tétel. Vegyél fel egyet, vagy az admin töltse be az alaplistát a Teendők fülön.</div>';
  } else {
    var html = '';
    procCats().forEach(function (c) {
      var items = S.proc.filter(function (p) {
        if (p.category !== c) return false;
        if (q && (p.item + ' ' + (p.supplier || '')).toLowerCase().indexOf(q) < 0) return false;
        if (S.pf.need && pstatus(p).k !== 'need') return false;
        return true;
      });
      if (!items.length) return;
      html += '<section class="card cat" style="margin-bottom:12px"><div class="chead" style="cursor:default"><h3>' + esc(c) + '</h3><span class="cnt">' + items.length + ' tétel</span></div>' +
        '<div class="phead"><span>Tétel</span><span>Készlet</span><span>Minimum</span><span>Úton</span><span>Könyveléshez</span><span>Állapot</span><span></span></div>' +
        items.map(function (p) {
          var st = pstatus(p), u = p.unit ? ' ' + esc(p.unit) : '';
          return '<div class="prow"><div class="pname"><b>' + esc(p.item) + '</b>' +
            ((p.supplier || p.note) ? '<small>' + esc([p.supplier, p.note].filter(Boolean).join(' · ')) + '</small>' : '') + '</div>' +
            '<div class="pnum"><span>Készlet</span><b>' + fmtN(p.stock) + u + '</b></div>' +
            '<div class="pnum"><span>Minimum</span>' + (Number(p.min_stock) > 0 ? fmtN(p.min_stock) + u : '–') + '</div>' +
            '<div class="pnum"><span>Úton</span>' + (Number(p.ordered) > 0 ? fmtN(p.ordered) + u : '–') + '</div>' +
            '<div class="pnum"><span>Könyveléshez</span>' + (p.acct_unit ? esc(p.acct_unit) : '–') + '</div>' +
            '<div class="pst"><span class="badge b-' + st.k + '">' + st.t + '</span></div>' +
            '<div class="pact"><button class="btn small" data-act="' + p.id + '">Rögzítés</button><button class="icon" data-pedit="' + p.id + '" title="Szerkesztés">✎</button></div></div>';
        }).join('') + '</section>';
    });
    $('#pList').innerHTML = html || '<div class="card empty">Nincs a szűrésnek megfelelő tétel.</div>';
  }

  // napló-összesítő
  var since = Date.now() - S.logDays * 86400000;
  var agg = {};
  S.log.forEach(function (l) {
    if (new Date(l.created_at).getTime() < since) return;
    var o = agg[l.item_id] || (agg[l.item_id] = { rendelés: 0, beérkezett: 0, fogyás: 0 });
    if (l.kind in o) o[l.kind] += Number(l.qty);
  });
  var rows = Object.keys(agg).map(function (id) {
    var p = S.proc.filter(function (x) { return String(x.id) === id; })[0];
    return p ? { p: p, a: agg[id] } : null;
  }).filter(Boolean);
  $('#pLog').innerHTML = rows.length ?
    '<table><thead><tr><th>Tétel</th><th class="n">Rendelve</th><th class="n">Beérkezett</th><th class="n">Elfogyott</th></tr></thead><tbody>' +
    rows.map(function (r) {
      var u = r.p.unit ? ' ' + esc(r.p.unit) : '';
      return '<tr><td>' + esc(r.p.item) + '</td><td class="n">' + fmtN(r.a['rendelés']) + u + '</td><td class="n">' + fmtN(r.a['beérkezett']) + u + '</td><td class="n">' + fmtN(r.a['fogyás']) + u + '</td></tr>';
    }).join('') + '</tbody></table>' : '<div class="empty small">Ebben az időszakban még nincs rögzített mozgás.</div>';
}

function openAction(id) {
  var p = S.proc.filter(function (x) { return x.id === id; })[0];
  if (!p) return;
  var u = p.unit ? ' ' + p.unit : '';
  var m = openModal(p.item,
    '<form class="form" id="aForm"><p class="muted small" style="margin:0">Most: készlet <b>' + fmtN(p.stock) + u + '</b>, úton <b>' + fmtN(p.ordered) + u + '</b></p>' +
    '<label>Mit rögzítesz?<select name="a" id="aSel"><option value="fogyás">Fogyás (elhasználtunk)</option><option value="rendelés">Rendelés (megrendeltük)</option>' +
    '<option value="beérkezett">Beérkezett (megjött a rendelés)</option><option value="leltár">Leltár (a készlet pontos értéke)</option></select></label>' +
    '<label>Mennyiség<input type="number" name="qty" id="aQty" step="any" min="0" required></label>' +
    '<label>Megjegyzés<input type="text" name="note"></label>' +
    '<div class="actions"><span class="sp"></span><button type="button" class="btn" data-close>Mégse</button><button class="btn primary" type="submit">Rögzítés</button></div></form>');
  $('#aSel', m).onchange = function (e) { if (e.target.value === 'beérkezett' && Number(p.ordered) > 0) $('#aQty', m).value = p.ordered; };
  $('#aForm', m).onsubmit = function (e) {
    e.preventDefault();
    var fd = new FormData(e.target), a = fd.get('a'), qty = Number(fd.get('qty'));
    var stock = Number(p.stock) || 0, ord = Number(p.ordered) || 0;
    if (a === 'fogyás') stock = Math.max(0, stock - qty);
    else if (a === 'rendelés') ord += qty;
    else if (a === 'beérkezett') { stock += qty; ord = Math.max(0, ord - qty); }
    else stock = qty;
    var upd = { stock: stock, ordered: ord };
    if (a === 'rendelés') upd.ordered_at = iso(new Date());
    sb.from('procurement').update(upd).eq('id', p.id).then(function (r) {
      if (r.error) { toast('Hiba: ' + r.error.message, true); return; }
      sb.from('procurement_log').insert({ item_id: p.id, kind: a, qty: qty, by_name: myName(), note: String(fd.get('note')).trim() || null }).then(function (r2) {
        if (r2.error) toast('A napló mentése nem sikerült: ' + r2.error.message, true);
        closeModal(); reloadTable('procurement'); reloadTable('procurement_log');
      });
    });
  };
}

function openItem(id) {
  var p = id ? S.proc.filter(function (x) { return x.id === id; })[0] : null;
  var cats = procCats();
  var m = openModal(p ? 'Tétel szerkesztése' : 'Új beszerzési tétel',
    '<form class="form" id="iForm">' +
    '<label>Tétel neve<input type="text" name="item" required value="' + esc(p ? p.item : '') + '"></label>' +
    '<label>Kategória<input type="text" name="category" list="pcats" required value="' + esc(p ? p.category : (cats[0] || '')) + '"></label>' +
    '<datalist id="pcats">' + cats.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist>' +
    '<div class="row"><label>Mértékegység<input type="text" name="unit" placeholder="db, csomag, l…" value="' + esc(p ? p.unit : '') + '"></label>' +
    '<label>Minimum készlet<input type="number" name="min_stock" step="any" min="0" value="' + esc(p ? p.min_stock : 0) + '"></label></div>' +
    '<label>Könyveléshez (könyvelési mértékegység)<input type="text" name="acct_unit" placeholder="pl. db, kg, l, doboz" value="' + esc(p ? p.acct_unit : '') + '"></label>' +
    (p ? '' : '<label>Jelenlegi készlet<input type="number" name="stock" step="any" min="0" value="0"></label>') +
    '<label>Beszállító<input type="text" name="supplier" value="' + esc(p ? p.supplier : '') + '"></label>' +
    '<label>Megjegyzés<input type="text" name="note" value="' + esc(p ? p.note : '') + '"></label>' +
    '<div class="actions">' + (p && isAdmin() ? '<button type="button" class="btn danger" id="delI">Törlés</button>' : '') + '<span class="sp"></span>' +
    '<button type="button" class="btn" data-close>Mégse</button><button class="btn primary" type="submit">Mentés</button></div></form>');
  $('#iForm', m).onsubmit = function (e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var row = {
      item: String(fd.get('item')).trim(), category: String(fd.get('category')).trim(), unit: String(fd.get('unit')).trim() || null,
      min_stock: Number(fd.get('min_stock')) || 0, acct_unit: String(fd.get('acct_unit')).trim() || null, supplier: String(fd.get('supplier')).trim() || null, note: String(fd.get('note')).trim() || null
    };
    var req;
    if (p) req = sb.from('procurement').update(row).eq('id', p.id);
    else {
      row.stock = Number(fd.get('stock')) || 0;
      row.pos = S.proc.length ? Math.max.apply(null, S.proc.map(function (x) { return x.pos; })) + 1 : 1;
      req = sb.from('procurement').insert(row);
    }
    req.then(function (r) {
      if (r.error) { toast('Hiba: ' + r.error.message, true); return; }
      closeModal(); reloadTable('procurement');
    });
  };
  var del = $('#delI', m);
  if (del) del.onclick = function () {
    if (!confirm('Törlöd a tételt és a hozzá tartozó naplót?')) return;
    sb.from('procurement').delete().eq('id', p.id).then(function (r) {
      if (r.error) toast('Hiba: ' + r.error.message, true); else { closeModal(); reloadTable('procurement'); reloadTable('procurement_log'); }
    });
  };
}

function copyOrderList() {
  var lines = [];
  procCats().forEach(function (c) {
    var need = S.proc.filter(function (p) { return p.category === c && pstatus(p).k === 'need'; });
    if (!need.length) return;
    lines.push(c + ':');
    need.forEach(function (p) {
      var miss = Math.max(0, (Number(p.min_stock) || 0) - (Number(p.stock) || 0) - (Number(p.ordered) || 0));
      lines.push('- ' + p.item + ': hiányzik ' + fmtN(miss) + (p.unit ? ' ' + p.unit : '') + ' (készlet ' + fmtN(p.stock) + ', minimum ' + fmtN(p.min_stock) + ')' + (p.supplier ? ' – ' + p.supplier : ''));
    });
    lines.push('');
  });
  if (!lines.length) { toast('Nincs rendelendő tétel.'); return; }
  var text = lines.join('\n').trim();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { toast('Rendelési lista a vágólapon'); }, function () { showText(text); });
  } else showText(text);
}
function showText(text) {
  openModal('Rendelési lista', '<textarea rows="12" readonly>' + esc(text) + '</textarea>');
}

/* ------------------------------------------------------------------ *
 *  4) FELHASZNÁLÓK (csak admin)
 * ------------------------------------------------------------------ */
function usersMount() {
  $('#content').innerHTML = '<div class="card sum" style="margin-top:0"><h3>Felhasználók</h3>' +
    '<p class="muted small" style="margin-top:0">Új felhasználót a Supabase-ben kell létrehozni (Authentication → Users → Add user). Itt jóváhagyod, megadod a nevét és a szerepkörét. A jóváhagyatlan fiók nem lát semmit.</p>' +
    '<div id="uList"></div></div>';
  $('#uList').addEventListener('change', function (e) {
    var el = e.target.closest('[data-u]'); if (!el) return;
    var upd = {};
    if (el.dataset.f === 'approved') upd.approved = el.checked; else upd[el.dataset.f] = el.value.trim();
    sb.from('profiles').update(upd).eq('id', el.dataset.u).then(function (r) {
      if (r.error) toast('Hiba: ' + r.error.message, true); else { toast('Mentve'); reloadTable('profiles'); }
    });
  });
  usersUpdate();
}
function usersUpdate() {
  if (!$('#uList')) return;
  $('#uList').innerHTML = '<table><thead><tr><th>E-mail</th><th>Név</th><th>Szerepkör</th><th class="n">Jóváhagyva</th></tr></thead><tbody>' +
    S.profiles.map(function (p) {
      var self = S.me && p.id === S.me.id;
      return '<tr><td>' + esc(p.email) + (self ? ' <span class="tag">te</span>' : '') + '</td>' +
        '<td><input type="text" data-u="' + p.id + '" data-f="name" value="' + esc(p.name || '') + '"></td>' +
        '<td><select data-u="' + p.id + '" data-f="role"' + (self ? ' disabled' : '') + '><option value="user"' + (p.role === 'user' ? ' selected' : '') + '>Felhasználó</option><option value="admin"' + (p.role === 'admin' ? ' selected' : '') + '>Admin</option></select></td>' +
        '<td class="n"><input type="checkbox" data-u="' + p.id + '" data-f="approved"' + (p.approved ? ' checked' : '') + (self ? ' disabled' : '') + '></td></tr>';
    }).join('') + '</tbody></table>';
}

/* ------------------------------------------------------------------ */
var V = {
  tasks: { mount: tasksMount, update: tasksUpdate },
  schedule: { mount: schedMount, update: schedUpdate },
  proc: { mount: procMount, update: procUpdate },
  users: { mount: usersMount, update: usersUpdate }
};

boot();
})();
