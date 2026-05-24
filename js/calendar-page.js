/* js/calendar-page.js */
markActive('calendar');
updateNavUser();

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date();
let curMonth = 4, curYear = 2026;
let selectedKey = null;
let activeFilter = null;
let dayCommentsMap = {};
let _commentSubscription = null;

PHASES.forEach((p,i) => {
  const b = document.createElement('button');
  b.className = 'filter-btn'; b.textContent = p.label; b.dataset.filter = i;
  b.style.cssText = `border-color:${p.border}`;
  document.getElementById('filter-row').appendChild(b);
});
document.getElementById('filter-row').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  activeFilter = btn.dataset.filter === '' ? null : parseInt(btn.dataset.filter);
  render();
});

const legendItems = document.getElementById('legend-items');
PHASES.forEach(p => {
  const item = document.createElement('div');
  item.className = 'legend-item';
  const dot = document.createElement('div');
  dot.className = 'leg-dot';
  dot.style.background = p.border;
  item.appendChild(dot);
  item.appendChild(document.createTextNode(p.label));
  legendItems.appendChild(item);
});

function render() {
  const grid = document.getElementById('cal-grid');
  grid.replaceChildren();
  document.getElementById('month-title').textContent = `${MONTHS[curMonth]} ${curYear}`;

  const first = new Date(curYear, curMonth, 1);
  const dow = first.getDay();
  const dim = new Date(curYear, curMonth+1, 0).getDate();
  const prevDim = new Date(curYear, curMonth, 0).getDate();
  const cells = [];
  for (let i = dow-1; i >= 0; i--) cells.push({d:new Date(curYear,curMonth-1,prevDim-i),other:true});
  for (let d=1; d<=dim; d++) cells.push({d:new Date(curYear,curMonth,d),other:false});
  const rem = 42 - cells.length;
  for (let d=1; d<=rem; d++) cells.push({d:new Date(curYear,curMonth+1,d),other:true});

  cells.forEach(({d, other}) => {
    const cell = document.createElement('div');
    cell.className = 'day-cell' + (other?' other-month':'');

    const phase = getPhase(d);
    const meeting = isMeeting(d);
    const key = dateKey(d);
    const hasComments = dayCommentsMap[key] && dayCommentsMap[key].length > 0;
    const phaseIdx = phase ? PHASES.indexOf(phase) : -1;
    const filtered = activeFilter !== null && phaseIdx !== activeFilter;

    if (phase && !filtered) {
      cell.style.background = phase.bg;
      cell.style.borderColor = phase.border;
    }
    if (meeting && !filtered) cell.classList.add('advising');
    if (key === selectedKey) cell.classList.add('selected');

    const numEl = document.createElement('div');
    numEl.className = 'day-num';
    numEl.style.color = (phase && !filtered) ? phase.text : 'var(--text)';
    numEl.textContent = d.getDate();
    cell.appendChild(numEl);

    if (phase && !filtered && dateKey(d) === dateKey(phase.start)) {
      const tag = document.createElement('div');
      tag.className = 'phase-label-tag';
      tag.style.cssText = `background:${phase.border};color:#fff`;
      tag.textContent = phase.label;
      cell.appendChild(tag);
    }
    if (meeting && !filtered) {
      const dot = document.createElement('span');
      dot.className = 'meet-dot';
      cell.appendChild(dot);
    }
    if (hasComments) {
      const dot = document.createElement('span');
      dot.className = 'comment-dot';
      cell.appendChild(dot);
    }

    if (!other) {
      cell.addEventListener('click', () => selectDay(d));
    }
    grid.appendChild(cell);
  });
}

async function selectDay(d) {
  if (_commentSubscription) {
    _commentSubscription.unsubscribe();
    _commentSubscription = null;
  }
  selectedKey = dateKey(d);
  render();
  document.getElementById('no-select').style.display = 'none';
  document.getElementById('day-detail').style.display = 'block';
  document.getElementById('detail-date').textContent = fmtDate(d);

  const phase = getPhase(d);
  const phaseEl = document.getElementById('detail-phase');
  phaseEl.replaceChildren();
  if (phase) {
    const span = document.createElement('span');
    span.className = 'sidebar-phase';
    span.style.background = phase.bg;
    span.style.color = phase.text;
    span.textContent = phase.label;
    phaseEl.appendChild(span);
  }
  const meetEl = document.getElementById('detail-meeting');
  meetEl.style.display = isMeeting(d) ? 'block' : 'none';
  await renderComments();
  _commentSubscription = subscribeToComments(selectedKey, () => renderComments());
}

async function renderComments() {
  const list = document.getElementById('comments-list');
  if (!selectedKey) return;
  const comments = await dbGetComments(selectedKey);
  dayCommentsMap[selectedKey] = comments;
  list.replaceChildren();
  if (!comments.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:13px;color:var(--text-3);padding:8px 0';
    empty.textContent = 'No comments yet.';
    list.appendChild(empty);
    return;
  }
  comments.forEach(c => {
    const u = USERS[c.uid] || { name: 'User', initials: 'U', color: '#999' };
    const item = document.createElement('div');
    item.className = 'comment-item';
    
    const av = document.createElement('div');
    av.className = 'comment-av';
    av.style.background = u.color;
    av.textContent = u.initials;
    
    const body = document.createElement('div');
    body.className = 'comment-body';
    
    const author = document.createElement('div');
    author.className = 'comment-author';
    author.textContent = u.name;
    
    const time = document.createElement('span');
    time.className = 'comment-time';
    time.textContent = c.time;
    author.appendChild(time);
    
    const text = document.createElement('div');
    text.className = 'comment-text';
    text.textContent = c.text; // SECURE: Uses textContent
    
    body.appendChild(author);
    body.appendChild(text);
    
    item.appendChild(av);
    item.appendChild(body);
    list.appendChild(item);
  });
  list.scrollTop = list.scrollHeight;
}

async function submitComment() {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text || !selectedKey) return;

  const { error } = await dbAddComment(selectedKey, text);
  if (error) {
    console.warn('submitComment:', error);
    return;
  }
  input.value = '';
}

document.getElementById('comment-input').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitComment(); }
});
document.getElementById('prev-btn').addEventListener('click', () => { curMonth--; if(curMonth<0){curMonth=11;curYear--;} render(); });
document.getElementById('next-btn').addEventListener('click', () => { curMonth++; if(curMonth>11){curMonth=0;curYear++;} render(); });

document.addEventListener('DOMContentLoaded', async () => {
  dayCommentsMap = await dbGetAllDayCommentsMap();
  render();
  sb.channel('calendar_comments:' + Date.now())
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'day_comments' }, (payload) => {
      const c = payload.new;
      if (!c || !c.date_key) return;
      if (!dayCommentsMap[c.date_key]) dayCommentsMap[c.date_key] = [];
      dayCommentsMap[c.date_key].push(c);
      render();
      if (selectedKey === c.date_key) renderComments();
    })
    .subscribe();
});