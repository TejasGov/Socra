/* js/chat-page.js */
let currentChannel = 'general';
let pinnedDate = null;
let pinnedDateLabel = '';
let _msgSubscription = null;
const _renderedMsgIds = new Set();

document.querySelectorAll('.channel-row').forEach((row) => {
  row.addEventListener('click', () => switchChannel(row.dataset.channel, row));
});

document.getElementById('send-btn').addEventListener('click', () => sendMessage());
document.getElementById('clear-pin-btn').addEventListener('click', () => clearPin());

document.addEventListener('DOMContentLoaded', async () => {
  markActive('chat');
  updateNavUser();
  buildUserList();
  window.addEventListener('userchange', buildUserList);
  await initPermissions();
  await initChat();

  const params = new URLSearchParams(location.search);
  if (params.get('pinDate')) {
    const d = new Date(params.get('pinDate'));
    pinDate(params.get('pinDate'), fmtShort(d));
  }

  document.getElementById('msg-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  document.getElementById('msg-input').addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
  });
});

async function initChat() {
  const generalRow = document.querySelector('[data-channel="general"]');
  await switchChannel('general', generalRow);
  await renderPinnedDates();
}

async function switchChannel(ch, el) {
  if (_msgSubscription) {
    _msgSubscription.unsubscribe();
    _msgSubscription = null;
  }
  currentChannel = ch;
  _renderedMsgIds.clear();
  document.querySelectorAll('.channel-row').forEach((r) => r.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('chat-title').textContent = '# ' + ch;
  document.getElementById('msg-input').placeholder = 'Message #' + ch + '…';
  await renderMessages();
  _msgSubscription = subscribeToMessages(ch, (row) => {
    if (row.id && _renderedMsgIds.has(row.id)) return;
    appendMessage(row);
  });
}

async function renderMessages() {
  const area = document.getElementById('messages-area');
  area.replaceChildren();
  _renderedMsgIds.clear();

  const msgs = await dbGetMessages(currentChannel);

  if (!msgs.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;color:var(--text-3);font-size:13px;padding:2rem 0';
    empty.textContent = 'No messages yet. Start the conversation!';
    area.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  let lastDay = '';
  msgs.forEach((m) => {
    const day = m.date || 'Today';
    if (day !== lastDay) {
      const div = document.createElement('div');
      div.className = 'day-divider';
      const span = document.createElement('span');
      span.textContent = day;
      div.appendChild(span);
      frag.appendChild(div);
      lastDay = day;
    }
    const node = buildMessageNode(m);
    if (node) frag.appendChild(node);
  });
  area.appendChild(frag);
  area.scrollTop = area.scrollHeight;
}

function buildMessageNode(row) {
  if (row.id) _renderedMsgIds.add(row.id);
  const u = USERS[row.uid] || { initials: '?', color: '#888', name: 'Unknown' };

  const group = document.createElement('div');
  group.className = 'msg-group';
  if (row.id) group.dataset.msgId = row.id;

  const av = document.createElement('div');
  av.className = 'msg-av';
  av.style.background = u.color;
  av.textContent = u.initials;

  const content = document.createElement('div');
  content.className = 'msg-content';

  const meta = document.createElement('div');
  meta.className = 'msg-meta';

  const author = document.createElement('span');
  author.className = 'msg-author';
  author.textContent = u.name;

  const time = document.createElement('span');
  time.className = 'msg-time';
  time.textContent = row.time || (row.created_at ? relativeTime(row.created_at) : '');

  meta.appendChild(author);
  meta.appendChild(time);

  const text = document.createElement('div');
  text.className = 'msg-text';
  text.textContent = row.text || '';

  content.appendChild(meta);
  content.appendChild(text);

  if (row.pinned_date) {
    const phase = getPhase(new Date(row.pinned_date));
    const pin = document.createElement('div');
    pin.className = 'msg-date-pin';
    let pinText = '\uD83D\uDCC5 ' + (row.pinned_date_label || row.pinned_date);
    if (phase) pinText += ' \u00B7 ' + phase.label;
    pin.textContent = pinText;
    content.appendChild(pin);
  }

  group.appendChild(av);
  group.appendChild(content);
  return group;
}

function appendMessage(row) {
  const area = document.getElementById('messages-area');
  const placeholder = area.querySelector('div[style*="text-align:center"]');
  if (placeholder && !placeholder.classList.contains('msg-group')) {
    placeholder.remove();
  }
  if (row.id && _renderedMsgIds.has(row.id)) return;
  const node = buildMessageNode(row);
  if (!node) return;
  area.appendChild(node);
  area.scrollTop = area.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('msg-input');
  const text = input.value.trim();
  if (!text) return;

  const errEl = document.getElementById('send-error');
  errEl.style.display = 'none';
  errEl.textContent = '';

  const canPost = await dbCanPost(currentUser());
  if (!canPost) {
    errEl.textContent = '(Posting restricted)';
    errEl.style.display = 'block';
    return;
  }

  const msg = {
    text,
    time: fmtTime(),
    date: fmtDateFull(new Date()),
  };
  if (pinnedDate) {
    msg.pinnedDate = pinnedDate;
    msg.pinnedDateLabel = pinnedDateLabel;
  }

  const btn = document.getElementById('send-btn');
  btn.classList.add('btn-spinner');
  btn.disabled = true;
  btn.textContent = '…';

  const { error } = await dbSendMessage(currentChannel, msg);

  btn.classList.remove('btn-spinner');
  btn.disabled = false;
  btn.textContent = 'Send';

  if (error) {
    errEl.textContent = error;
    errEl.style.display = 'block';
    return;
  }

  input.value = '';
  input.style.height = 'auto';
  clearPin();
  renderPinnedDates();
}

function clearPin() {
  pinnedDate = null;
  pinnedDateLabel = '';
  document.getElementById('date-tag-row').style.display = 'none';
}

function pinDate(dateStr, label) {
  pinnedDate = dateStr;
  pinnedDateLabel = label;
  document.getElementById('pinned-date-label').textContent = label;
  document.getElementById('date-tag-row').style.display = 'flex';
  document.getElementById('msg-input').focus();
}

function buildUserList() {
  const el = document.getElementById('user-list');
  el.replaceChildren();
  const cur = currentUser();
  Object.entries(USERS).forEach(([uid, u]) => {
    const row = document.createElement('div');
    row.className = 'user-row' + (uid === cur ? ' active-user' : '');

    const av = document.createElement('div');
    av.className = 'user-av';
    av.style.background = u.color;
    av.textContent = u.initials;

    const info = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'user-name';
    name.textContent = u.name;
    if (uid === cur) {
      const badge = document.createElement('span');
      badge.className = 'you-badge';
      badge.textContent = 'you';
      name.appendChild(badge);
    }

    const role = document.createElement('div');
    role.className = 'user-role';
    role.textContent = uid === 'owner' ? 'Project lead' : 'Collaborator';

    info.appendChild(name);
    info.appendChild(role);

    row.appendChild(av);
    row.appendChild(info);

    const dot = document.createElement('div');
    dot.className = 'online-dot';
    row.appendChild(dot);

    el.appendChild(row);
  });
}

async function renderPinnedDates() {
  const channels = ['general', 'research', 'dev'];
  const dateMap = {};

  for (const ch of channels) {
    const msgs = await dbGetMessages(ch);
    msgs.filter((m) => m.pinned_date).forEach((m) => {
      if (!dateMap[m.pinned_date]) {
        dateMap[m.pinned_date] = { label: m.pinned_date_label, msgs: [] };
      }
      dateMap[m.pinned_date].msgs.push(m);
    });
  }

  const allComments = await dbGetAllDayCommentsMap();
  Object.entries(allComments).forEach(([k, v]) => {
    if (v.length && !dateMap[k]) {
      const d = new Date(k + 'T12:00:00');
      dateMap[k] = { label: fmtShort(d), msgs: v };
    } else if (v.length && dateMap[k]) {
      dateMap[k].msgs = dateMap[k].msgs.concat(v);
    }
  });

  const list = document.getElementById('pinned-list');
  list.replaceChildren();
  const entries = Object.entries(dateMap).sort((a, b) => a[0].localeCompare(b[0]));

  if (!entries.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'padding:12px 14px;font-size:12px;color:var(--text-3)';
    empty.textContent = 'No date-pinned comments yet. Pin a message to a date from the chat input.';
    list.appendChild(empty);
    return;
  }

  entries.forEach(([dateStr, info]) => {
    const d = new Date(dateStr + 'T12:00:00');
    const phase = getPhase(d);
    const preview = info.msgs[info.msgs.length - 1];
    const previewU = preview ? USERS[preview.uid] || null : null;

    const item = document.createElement('div');
    item.className = 'pinned-item';

    const dateEl = document.createElement('div');
    dateEl.className = 'pinned-date';
    dateEl.textContent = info.label || fmtShort(d);
    item.appendChild(dateEl);

    if (phase) {
      const phaseEl = document.createElement('div');
      phaseEl.className = 'pinned-phase';
      phaseEl.style.color = phase.text;
      phaseEl.textContent = phase.label;
      item.appendChild(phaseEl);
    }

    const previewEl = document.createElement('div');
    previewEl.className = 'pinned-preview';
    let previewText = '';
    if (preview) {
      if (previewU) previewText = previewU.name + ': ';
      previewText += preview.text || '';
    }
    previewEl.textContent = previewText;
    item.appendChild(previewEl);

    const countEl = document.createElement('div');
    countEl.className = 'pinned-count';
    countEl.textContent = info.msgs.length + ' comment' + (info.msgs.length > 1 ? 's' : '');
    item.appendChild(countEl);

    item.addEventListener('click', () => pinDate(dateStr, info.label || fmtShort(d)));
    list.appendChild(item);
  });
}

async function initPermissions() {
  const panel = document.getElementById('permissions-panel');
  if (currentUser() !== 'owner') {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = 'block';
  const list = document.getElementById('permissions-list');
  list.replaceChildren();
  const perms = await dbGetPermissions();
  ['tejas', 'atshal'].forEach((uid) => {
    const u = USERS[uid];
    const row = document.createElement('div');
    row.className = 'perm-row';

    const av = document.createElement('div');
    av.className = 'perm-av-sm';
    av.style.background = u.color;
    av.textContent = u.initials;

    const name = document.createElement('div');
    name.className = 'perm-name';
    name.textContent = u.name;

    const toggle = document.createElement('label');
    toggle.className = 'perm-toggle';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = perms[uid] !== false;
    input.addEventListener('change', () => dbSetPermission(uid, input.checked));
    const slider = document.createElement('span');
    slider.className = 'perm-slider';
    toggle.appendChild(input);
    toggle.appendChild(slider);

    row.appendChild(av);
    row.appendChild(name);
    row.appendChild(toggle);
    list.appendChild(row);
  });
}