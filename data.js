const PHASES = [
  { label: "Research + papers",       start: new Date(2025,4,15), end: new Date(2025,5,10),  bg: "#EEEDFE", border: "#534AB7", text: "#3C3489" },
  { label: "Core system development", start: new Date(2025,5,10), end: new Date(2025,5,30),  bg: "#E1F5EE", border: "#0F6E56", text: "#085041" },
  { label: "AI tutor + RAG",          start: new Date(2025,6,1),  end: new Date(2025,6,20),  bg: "#E6F1FB", border: "#185FA5", text: "#0C447C" },
  { label: "Testing + debugging",     start: new Date(2025,6,20), end: new Date(2025,6,31),  bg: "#FAEEDA", border: "#BA7517", text: "#633806" },
  { label: "UI/design + CSE 115/116", start: new Date(2025,7,1),  end: new Date(2025,7,10),  bg: "#FBEAF0", border: "#993556", text: "#72243E" },
  { label: "Final polish + demo",     start: new Date(2025,7,10), end: new Date(2025,7,20),  bg: "#EAF3DE", border: "#3B6D11", text: "#27500A" },
];

const MEETINGS = [];
let _md = new Date(2025,4,22);
while (_md <= new Date(2025,7,20)) {
  MEETINGS.push(new Date(_md));
  _md = new Date(_md.getTime() + 14*86400000);
}

const USERS = {
  owner: { name: "You (Owner)", initials: "YO", color: "#2D5016" },
  alex:  { name: "Alex Chen",   initials: "AC", color: "#185FA5" },
  priya: { name: "Priya Nair",  initials: "PN", color: "#993556" },
};

function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function getPhase(d) { const t=d.getTime(); return PHASES.find(p=>t>=p.start.getTime()&&t<p.end.getTime())||null; }
function isMeeting(d) { return MEETINGS.some(m=>dateKey(m)===dateKey(d)); }
function fmtDate(d) { return d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'}); }
function fmtShort(d) { return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
function fmtTime() { return new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); }

function loadData(key, def) {
  try { const v=localStorage.getItem(key); return v?JSON.parse(v):def; } catch(e){ return def; }
}
function saveData(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
}

function currentUser() {
  return loadData('currentUser','owner');
}

function markActive(page) {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.classList.toggle('active', a.dataset.page === page);
  });
}

function updateNavUser() {
  const uid = currentUser();
  const u = USERS[uid];
  const av = document.getElementById('nav-avatar');
  const un = document.getElementById('nav-name');
  if (av) { av.textContent = u.initials; av.style.background = u.color; }
  if (un) un.textContent = u.name;
}
