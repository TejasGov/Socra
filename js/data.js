/* js/data.js — Shared constants, auth, storage, DB, realtime (requires config.js + Supabase CDN) */

const USERS = {
  owner: { name: 'Prof. Paul', initials: 'PD', color: '#2D5016' },
  tejas: { name: 'Tejas Govind', initials: 'TG', color: '#185FA5' },
  atshal: { name: 'Atshal Ahmed Khan', initials: 'AK', color: '#993556' },
};

const PHASES = [
  { label: 'Research + papers', start: new Date(2026, 4, 15), end: new Date(2026, 5, 10), bg: '#EEEDFE', border: '#534AB7', text: '#3C3489' },
  { label: 'Core system development', start: new Date(2026, 5, 10), end: new Date(2026, 5, 30), bg: '#E1F5EE', border: '#0F6E56', text: '#085041' },
  { label: 'AI tutor + RAG', start: new Date(2026, 6, 1), end: new Date(2026, 6, 20), bg: '#E6F1FB', border: '#185FA5', text: '#0C447C' },
  { label: 'Testing + debugging', start: new Date(2026, 6, 20), end: new Date(2026, 6, 31), bg: '#FAEEDA', border: '#BA7517', text: '#633806' },
  { label: 'UI/design + CSE 115/116', start: new Date(2026, 7, 1), end: new Date(2026, 7, 10), bg: '#FBEAF0', border: '#993556', text: '#72243E' },
  { label: 'Final polish + demo', start: new Date(2026, 7, 10), end: new Date(2026, 7, 20), bg: '#EAF3DE', border: '#3B6D11', text: '#27500A' },
];

const MEETINGS = [
  new Date(2026, 4, 20),
  new Date(2026, 5, 3),
  new Date(2026, 5, 17),
  new Date(2026, 6, 1),
  new Date(2026, 6, 15),
  new Date(2026, 7, 5),
  new Date(2026, 7, 15),
];

const _rateLimitMap = new Map();

function rateLimiter(key, maxPerMinute) {
  const now = Date.now();
  const windowMs = 60000;
  let entries = _rateLimitMap.get(key) || [];
  entries = entries.filter((t) => now - t < windowMs);
  if (entries.length >= maxPerMinute) {
    _rateLimitMap.set(key, entries);
    return false;
  }
  entries.push(now);
  _rateLimitMap.set(key, entries);
  return true;
}

function loadData(key, defaultVal) {
  try {
    const raw = localStorage.getItem('rps_' + key);
    if (raw === null) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
}

function saveData(key, val) {
  try {
    localStorage.setItem('rps_' + key, JSON.stringify(val));
  } catch {
    /* ignore quota errors */
  }
}

function sanitizeText(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.textContent;
}

function currentUser() {
  return localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || null;
}

function logout() {
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('currentUser');
  localStorage.removeItem('savedUserId');
  window.location.href = 'login.html';
}

(function routeGuard() {
  const path = window.location.pathname || '';
  const onLogin = /login\.html$/i.test(path) || path.endsWith('/login');
  if (!onLogin && !currentUser()) {
    window.location.href = 'login.html';
  }
})();

function markActive(page) {
  document.querySelectorAll('.nav-links a').forEach((a) => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

function updateNavUser() {
  const uid = currentUser();
  const u = uid && USERS[uid] ? USERS[uid] : { name: 'Guest', initials: '?', color: '#888' };
  const av = document.getElementById('nav-avatar');
  const un = document.getElementById('nav-name');
  if (av) {
    av.textContent = u.initials;
    av.style.background = u.color;
  }
  if (un) un.textContent = u.name;
}

function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fmtDate(d) {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtShort(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fmtDateFull(d) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function fmtTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function relativeTime(isoStr) {
  if (!isoStr) return '';
  const then = new Date(isoStr).getTime();
  const diff = Date.now() - then;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + ' min ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + ' hr ago';
  return fmtShort(new Date(isoStr));
}

function getPhase(d) {
  const t = d.getTime();
  return PHASES.find((p) => t >= p.start.getTime() && t < p.end.getTime()) || null;
}

function isMeeting(d) {
  const k = dateKey(d);
  return MEETINGS.some((m) => dateKey(m) === k);
}

async function dbGetMessages(channel) {
  try {
    if (!sb) return [];
    const { data, error } = await sb
      .from('chat_messages')
      .select('*')
      .eq('channel', channel)
      .order('created_at', { ascending: true })
      .limit(300);
    if (error) {
      console.warn('dbGetMessages:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('dbGetMessages:', e);
    return [];
  }
}

async function dbSendMessage(channel, msg) {
  try {
    if (!rateLimiter('chat_send', 20)) {
      return { data: null, error: 'Rate limit exceeded. Please wait a moment.' };
    }
    if (!sb) return { data: null, error: 'Database unavailable.' };
    const uid = currentUser();
    if (!uid) return { data: null, error: 'Not signed in.' };
    const text = sanitizeText(String(msg.text || '').slice(0, 2000));
    if (!text) return { data: null, error: 'Message is empty.' };
    const row = {
      channel,
      uid,
      text,
      time: msg.time || fmtTime(),
      date: msg.date || fmtDateFull(new Date()),
      pinned_date: msg.pinnedDate || null,
      pinned_date_label: msg.pinnedDateLabel || null,
    };
    const { data, error } = await sb.from('chat_messages').insert([row]).select();
    if (error) return { data: null, error: error.message || 'Failed to send message.' };
    return { data: data && data[0] ? data[0] : null, error: null };
  } catch (e) {
    console.warn('dbSendMessage:', e);
    return { data: null, error: 'Failed to send message.' };
  }
}

async function dbGetComments(dateKeyStr) {
  try {
    if (!sb) return [];
    const { data, error } = await sb
      .from('day_comments')
      .select('*')
      .eq('date_key', dateKeyStr)
      .order('created_at', { ascending: true });
    if (error) {
      console.warn('dbGetComments:', error);
      return [];
    }
    return data || [];
  } catch (e) {
    console.warn('dbGetComments:', e);
    return [];
  }
}

async function dbGetAllDayCommentsMap() {
  try {
    if (!sb) return {};
    const { data, error } = await sb
      .from('day_comments')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(500);
    if (error) {
      console.warn('dbGetAllDayCommentsMap:', error);
      return {};
    }
    const map = {};
    (data || []).forEach((c) => {
      if (!map[c.date_key]) map[c.date_key] = [];
      map[c.date_key].push(c);
    });
    return map;
  } catch (e) {
    console.warn('dbGetAllDayCommentsMap:', e);
    return {};
  }
}

async function dbAddComment(dateKeyStr, text) {
  try {
    if (!rateLimiter('comment_add', 10)) {
      return { data: null, error: 'Rate limit exceeded. Please wait a moment.' };
    }
    if (!sb) return { data: null, error: 'Database unavailable.' };
    const uid = currentUser();
    if (!uid) return { data: null, error: 'Not signed in.' };
    const clean = sanitizeText(String(text || '').slice(0, 2000));
    if (!clean) return { data: null, error: 'Comment is empty.' };
    const { data, error } = await sb
      .from('day_comments')
      .insert([{ date_key: dateKeyStr, uid, text: clean, time: fmtTime() }])
      .select();
    if (error) return { data: null, error: error.message || 'Failed to post comment.' };
    return { data: data && data[0] ? data[0] : null, error: null };
  } catch (e) {
    console.warn('dbAddComment:', e);
    return { data: null, error: 'Failed to post comment.' };
  }
}

async function dbGetPhaseStatuses() {
  try {
    if (!sb) return {};
    const { data, error } = await sb.from('phase_statuses').select('*');
    if (error) {
      console.warn('dbGetPhaseStatuses:', error);
      return {};
    }
    const map = {};
    (data || []).forEach((r) => {
      map[r.phase_index] = r.status;
    });
    return map;
  } catch (e) {
    console.warn('dbGetPhaseStatuses:', e);
    return {};
  }
}

async function dbUpdatePhaseStatus(idx, status) {
  try {
    if (!sb) return { data: null, error: 'Database unavailable.' };
    const { data, error } = await sb
      .from('phase_statuses')
      .upsert({ phase_index: idx, status }, { onConflict: 'phase_index' })
      .select();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (e) {
    console.warn('dbUpdatePhaseStatus:', e);
    return { data: null, error: 'Update failed.' };
  }
}

async function dbGetPermissions() {
  try {
    if (!sb) return {};
    const { data, error } = await sb.from('chat_perms').select('*');
    if (error) {
      console.warn('dbGetPermissions:', error);
      return {};
    }
    const map = {};
    (data || []).forEach((r) => {
      map[r.uid] = r.can_post;
    });
    return map;
  } catch (e) {
    console.warn('dbGetPermissions:', e);
    return {};
  }
}

async function dbSetPermission(uid, canPost) {
  try {
    if (currentUser() !== 'owner') return;
    if (!sb) return;
    await sb.from('chat_perms').upsert({ uid, can_post: !!canPost }, { onConflict: 'uid' });
  } catch (e) {
    console.warn('dbSetPermission:', e);
  }
}

async function dbCanPost(uid) {
  if (uid === 'owner') return true;
  try {
    const perms = await dbGetPermissions();
    return perms[uid] !== false;
  } catch {
    return true;
  }
}

function subscribeToMessages(channel, onMessage) {
  if (!sb) return { unsubscribe: () => {} };
  const ch = sb
    .channel('messages:' + channel + ':' + Date.now())
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: 'channel=eq.' + channel },
      (payload) => {
        if (payload.new) onMessage(payload.new);
      }
    )
    .subscribe();
  return ch;
}

function subscribeToComments(dateKeyStr, onComment) {
  if (!sb) return { unsubscribe: () => {} };
  const ch = sb
    .channel('comments:' + dateKeyStr + ':' + Date.now())
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'day_comments', filter: 'date_key=eq.' + dateKeyStr },
      (payload) => {
        if (payload.new) onComment(payload.new);
      }
    )
    .subscribe();
  return ch;
}

function subscribeToPhaseStatuses(onChange) {
  if (!sb) return { unsubscribe: () => {} };
  const ch = sb
    .channel('phase_statuses:' + Date.now())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'phase_statuses' }, (payload) => {
      onChange(payload);
    })
    .subscribe();
  return ch;
}

window.USERS = USERS;
window.PHASES = PHASES;
window.MEETINGS = MEETINGS;
window.rateLimiter = rateLimiter;
window.loadData = loadData;
window.saveData = saveData;
window.sanitizeText = sanitizeText;
window.currentUser = currentUser;
window.logout = logout;
window.markActive = markActive;
window.updateNavUser = updateNavUser;
window.dateKey = dateKey;
window.fmtDate = fmtDate;
window.fmtShort = fmtShort;
window.fmtDateFull = fmtDateFull;
window.fmtTime = fmtTime;
window.relativeTime = relativeTime;
window.getPhase = getPhase;
window.isMeeting = isMeeting;
window.dbGetMessages = dbGetMessages;
window.dbSendMessage = dbSendMessage;
window.dbGetComments = dbGetComments;
window.dbGetAllDayCommentsMap = dbGetAllDayCommentsMap;
window.dbAddComment = dbAddComment;
window.dbGetPhaseStatuses = dbGetPhaseStatuses;
window.dbUpdatePhaseStatus = dbUpdatePhaseStatus;
window.dbGetPermissions = dbGetPermissions;
window.dbSetPermission = dbSetPermission;
window.dbCanPost = dbCanPost;
window.subscribeToMessages = subscribeToMessages;
window.subscribeToComments = subscribeToComments;
window.subscribeToPhaseStatuses = subscribeToPhaseStatuses;
