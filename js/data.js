// SUPABASE CONFIGURATION
const supabaseUrl = window.ENV ? window.ENV.SUPABASE_URL : '';
const supabaseKey = window.ENV ? window.ENV.SUPABASE_KEY : '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase credentials missing! Check window.ENV or Vercel Environment Variables.");
}

const sb = window.supabase ? window.supabase.createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder') : null;

// Global State
window.serverData = {
  chatPerms: {},
  dayComments: {},
  chatMsgs_general: [],
  chatMsgs_research: [],
  chatMsgs_dev: [],
  phaseStatuses: {}
};

const PHASES = [
  { label: "Research + papers", start: new Date(2025, 4, 15), end: new Date(2025, 5, 10), bg: "#EEEDFE", border: "#534AB7", text: "#3C3489" },
  { label: "Core system development", start: new Date(2025, 5, 10), end: new Date(2025, 5, 30), bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
  { label: "AI tutor + RAG", start: new Date(2025, 6, 1), end: new Date(2025, 6, 20), bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
  { label: "Testing + debugging", start: new Date(2025, 6, 20), end: new Date(2025, 6, 31), bg: "#FAEEDA", border: "#BA7517", text: "#633806" },
  { label: "UI/design + CSE 115/116", start: new Date(2025, 7, 1), end: new Date(2025, 7, 10), bg: "#FBEAF0", border: "#993556", text: "#72243E" },
  { label: "Final polish + demo", start: new Date(2025, 7, 10), end: new Date(2025, 7, 20), bg: "#EAF3DE", border: "#3B6D11", text: "#27500A" },
];

const MEETINGS = [];
let _md = new Date(2025, 4, 22);
while (_md <= new Date(2025, 7, 20)) {
  MEETINGS.push(new Date(_md));
  _md = new Date(_md.getTime() + 14 * 86400000);
}

// User Metadata (Mapping Supabase IDs to names/initials should be done via a profile table, 
// but we'll use a local map for now to preserve the UI style)
const USERS = {
  'owner': { name: "Paul Dickson", initials: "PD", color: "#2D5016" },
  'tejas': { name: "Tejas Govind", initials: "TG", color: "#185FA5" },
  'atshal': { name: "Atshal Ahmed Khan", initials: "AK", color: "#993556" },
};

// Authentication Check
function checkAuth() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token && window.location.pathname.indexOf('login.html') === -1) {
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

// --- SUPABASE FETCH & REALTIME ---
async function initSupabaseData() {
  // Render early so hardcoded data (like PHASES) shows up immediately
  triggerRenders();

  if (!checkAuth()) return;
  if (!sb) return;

  // Fetch initial data
  try {
    const { data: msgs, error: msgErr } = await sb.from('chat_messages').select('*').order('created_at', { ascending: true });
    if (msgErr) console.warn("Error fetching messages:", msgErr);
    if (msgs) {
      window.serverData.chatMsgs_general = [];
      window.serverData.chatMsgs_research = [];
      window.serverData.chatMsgs_dev = [];
      msgs.forEach(m => window.serverData['chatMsgs_' + m.channel].push(m));
    }

    const { data: comments, error: commErr } = await sb.from('day_comments').select('*');
    if (commErr) console.warn("Error fetching comments:", commErr);
    if (comments) {
      window.serverData.dayComments = {};
      comments.forEach(c => {
        if (!window.serverData.dayComments[c.date_key]) window.serverData.dayComments[c.date_key] = [];
        window.serverData.dayComments[c.date_key].push(c);
      });
    }

    const { data: statuses, error: statErr } = await sb.from('phase_statuses').select('*');
    if (statErr) console.warn("Error fetching statuses:", statErr);
    if (statuses) statuses.forEach(s => window.serverData.phaseStatuses[s.phase_index] = s.status);

    const { data: perms, error: permErr } = await sb.from('chat_perms').select('*');
    if (permErr) console.warn("Error fetching permissions:", permErr);
    if (perms) perms.forEach(p => window.serverData.chatPerms[p.uid] = p.can_post);

    triggerRenders();

    // Listen to realtime changes
    sb.channel('public_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
        window.serverData['chatMsgs_' + payload.new.channel].push(payload.new);
        triggerRenders();
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'day_comments' }, payload => {
        if (!window.serverData.dayComments[payload.new.date_key]) window.serverData.dayComments[payload.new.date_key] = [];
        window.serverData.dayComments[payload.new.date_key].push(payload.new);
        triggerRenders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'phase_statuses' }, payload => {
        window.serverData.phaseStatuses[payload.new.phase_index] = payload.new.status;
        triggerRenders();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_perms' }, payload => {
        window.serverData.chatPerms[payload.new.uid] = payload.new.can_post;
        triggerRenders();
      })
      .subscribe();
  } catch (err) {
    console.error("Supabase initialization failed:", err);
  }
}

function triggerRenders() {
  if (typeof render === 'function') render();
  if (typeof renderMessages === 'function') renderMessages();
  if (typeof renderPinnedDates === 'function') renderPinnedDates();
  if (typeof renderPhases === 'function') renderPhases();
  if (typeof renderComments === 'function' && typeof selectedKey !== 'undefined' && selectedKey) renderComments();
}

// Helper Functions
function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function getPhase(d) { const t = d.getTime(); return PHASES.find(p => t >= p.start.getTime() && t < p.end.getTime()) || null; }
function isMeeting(d) { const k = dateKey(d); return MEETINGS.some(m => dateKey(m) === k); }
function fmtDate(d) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtTime() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }

function loadData(key, def) {
  return window.serverData[key] !== undefined ? window.serverData[key] : def;
}

function currentUser() {
  return localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser') || 'owner';
}

function markActive(page) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

function updateNavUser() {
  const uid = currentUser();
  const u = USERS[uid] || USERS['owner'];
  const av = document.getElementById('nav-avatar');
  const un = document.getElementById('nav-name');
  if (av) { av.textContent = u.initials; av.style.background = u.color; }
  if (un) un.textContent = u.name;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

// Centralized Data Mutation Functions (to replace socket.emit)
async function dbSendMessage(channel, msg) {
  const { error } = await sb.from('chat_messages').insert([{
    channel,
    uid: currentUser(),
    text: msg.text,
    time: msg.time,
    date: msg.date,
    pinned_date: msg.pinnedDate,
    pinned_date_label: msg.pinnedDateLabel
  }]);
  if (error) console.error("Error sending message:", error);
}

async function dbUpdatePhaseStatus(idx, status) {
  const { error } = await sb.from('phase_statuses').upsert({ phase_index: idx, status });
  if (error) console.error("Error updating status:", error);
}

async function dbUpdatePerms(perms) {
  for (const [uid, canPost] of Object.entries(perms)) {
    await sb.from('chat_perms').upsert({ uid: uid, can_post: canPost });
  }
}

initSupabaseData();
