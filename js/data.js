// SUPABASE CONFIGURATION
// Replace these with your actual Supabase Project URL and Anon Key
const supabaseUrl = 'ycvdokwyzwrjmentfalh';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljdmRva3d5endyam1lbnRmYWxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNTc0OTksImV4cCI6MjA5MzgzMzQ5OX0.FTgbwf0w-MGelqc4iMwmxSoGJrnk4rjdGy4i7iaXSZk';
const supabase = supabaseUrl !== 'YOUR_SUPABASE_URL' ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// Authentication Check
const token = localStorage.getItem('token') || sessionStorage.getItem('token');
if (!token && window.location.pathname.indexOf('login.html') === -1) {
  window.location.href = 'login.html';
}

const PHASES = [
  { label: "Research + papers", start: new Date(2026, 4, 15), end: new Date(2026, 5, 10), bg: "#EEEDFE", border: "#534AB7", text: "#3C3489" },
  { label: "Core system development", start: new Date(2026, 5, 10), end: new Date(2026, 5, 30), bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
  { label: "AI tutor + RAG", start: new Date(2026, 6, 1), end: new Date(2026, 6, 20), bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
  { label: "Testing + debugging", start: new Date(2026, 6, 20), end: new Date(2026, 6, 31), bg: "#FAEEDA", border: "#BA7517", text: "#633806" },
  { label: "UI/design + CSE 115/116", start: new Date(2026, 7, 1), end: new Date(2026, 7, 10), bg: "#FBEAF0", border: "#993556", text: "#72243E" },
  { label: "Final polish + demo", start: new Date(2026, 7, 10), end: new Date(2026, 7, 20), bg: "#EAF3DE", border: "#3B6D11", text: "#27500A" },
];

const MEETINGS = [];
let _md = new Date(2026, 4, 22);
while (_md <= new Date(2026, 7, 20)) {
  MEETINGS.push(new Date(_md));
  _md = new Date(_md.getTime() + 14 * 86400000);
}

const USERS = {
  owner: { name: "Paul Dickson", initials: "PD", color: "#2D5016" },
  tejas: { name: "Tejas Govind", initials: "TG", color: "#185FA5" },
  atshal: { name: "Atshal Ahmed Khan", initials: "AK", color: "#993556" },
};

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function getPhase(d) { const t = d.getTime(); return PHASES.find(p => t >= p.start.getTime() && t < p.end.getTime()) || null; }
function isMeeting(d) { return MEETINGS.some(m => dateKey(m) === dateKey(d)); }
function fmtDate(d) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
function fmtShort(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }
function fmtTime() { return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }); }

window.serverData = {
  chatPerms: { tejas: true, atshal: true },
  dayComments: {},
  chatMsgs_general: [],
  chatMsgs_research: [],
  chatMsgs_dev: [],
  phaseStatuses: {}
};

// --- SUPABASE FETCH & REALTIME ---
async function initSupabaseData() {
  if (!supabase) {
    console.warn("Supabase not configured yet. Add URL and Key.");
    return;
  }

  // Fetch initial data
  const { data: msgs } = await supabase.from('chat_messages').select('*').order('created_at', { ascending: true });
  if (msgs) {
    msgs.forEach(m => {
      window.serverData['chatMsgs_' + m.channel].push(m);
    });
  }

  const { data: comments } = await supabase.from('day_comments').select('*');
  if (comments) {
    comments.forEach(c => {
      if (!window.serverData.dayComments[c.date_key]) window.serverData.dayComments[c.date_key] = [];
      window.serverData.dayComments[c.date_key].push(c);
    });
  }

  const { data: statuses } = await supabase.from('phase_statuses').select('*');
  if (statuses) {
    statuses.forEach(s => window.serverData.phaseStatuses[s.phase_index] = s.status);
  }

  const { data: perms } = await supabase.from('chat_perms').select('*');
  if (perms) {
    perms.forEach(p => window.serverData.chatPerms[p.uid] = p.can_post);
  }

  triggerRenders();

  // Listen to realtime changes
  supabase.channel('public:chat_messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, payload => {
      window.serverData['chatMsgs_' + payload.new.channel].push(payload.new);
      if (typeof currentChannel !== 'undefined' && currentChannel === payload.new.channel && typeof renderMessages === 'function') renderMessages();
      if (typeof renderPinnedDates === 'function') renderPinnedDates();
    })
    .subscribe();

  supabase.channel('public:day_comments')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'day_comments' }, payload => {
      if (!window.serverData.dayComments[payload.new.date_key]) window.serverData.dayComments[payload.new.date_key] = [];
      window.serverData.dayComments[payload.new.date_key].push(payload.new);
      if (typeof selectedKey !== 'undefined' && selectedKey === payload.new.date_key && typeof renderComments === 'function') renderComments();
      if (typeof render === 'function') render();
      if (typeof renderPinnedDates === 'function') renderPinnedDates();
    })
    .subscribe();

  supabase.channel('public:phase_statuses')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'phase_statuses' }, payload => {
      window.serverData.phaseStatuses[payload.new.phase_index] = payload.new.status;
      if (typeof renderPhases === 'function') renderPhases();
    })
    .subscribe();

  supabase.channel('public:chat_perms')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_perms' }, payload => {
      window.serverData.chatPerms[payload.new.uid] = payload.new.can_post;
      if (typeof renderPermissions === 'function') renderPermissions();
    })
    .subscribe();
}

function triggerRenders() {
  if (typeof render === 'function') render();
  if (typeof renderMessages === 'function') renderMessages();
  if (typeof renderPinnedDates === 'function') renderPinnedDates();
  if (typeof renderPermissions === 'function') renderPermissions();
  if (typeof renderPhases === 'function') renderPhases();
  if (typeof renderComments === 'function' && typeof selectedKey !== 'undefined' && selectedKey) renderComments();
}

initSupabaseData();

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
