/* js/index-page.js */
markActive('overview');
updateNavUser();

const today = new Date();
const demo = new Date(2026,7,20);
const daysLeft = Math.max(0, Math.ceil((demo - today) / 86400000));
document.getElementById('days-left').textContent = daysLeft;

const phaseList = document.getElementById('phase-list');
window.serverData = { phaseStatuses: {} };

function renderPhases() {
  phaseList.replaceChildren();
  PHASES.forEach((p, i) => {
    const status = window.serverData.phaseStatuses[i] || 'pending';
    const isOwner = currentUser() === 'owner';
    let statusText = 'Pending';
    let statusBg = 'var(--surface2)';
    let statusTx = 'var(--text-2)';

    const el = document.createElement('div');
    el.className = 'phase-item';

    const dot = document.createElement('div');
    dot.className = 'phase-dot';
    dot.style.background = p.border;

    const info = document.createElement('div');
    info.className = 'phase-info';
    const name = document.createElement('div');
    name.className = 'phase-name';
    name.textContent = p.label;
    const dates = document.createElement('div');
    dates.className = 'phase-dates';
    dates.textContent = fmtShort(p.start) + ' – ' + fmtShort(p.end);
    info.appendChild(name);
    info.appendChild(dates);

    const statusEl = document.createElement('div');
    statusEl.className = 'phase-status';

    if (status === 'completed') {
      statusText = 'Complete'; statusBg = '#EAF3DE'; statusTx = '#27500A';
    } else if (status === 'requested') {
      statusText = 'Review Pending'; statusBg = '#FAEEDA'; statusTx = '#BA7517';
      if (isOwner) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-primary btn-sm';
        btn.style.cssText = 'margin-left:auto;padding:2px 8px;font-size:11px';
        btn.textContent = 'Approve';
        btn.addEventListener('click', () => approvePhase(i));
        el.appendChild(dot);
        el.appendChild(info);
        statusEl.style.background = statusBg;
        statusEl.style.color = statusTx;
        statusEl.textContent = statusText;
        el.appendChild(statusEl);
        el.appendChild(btn);
        phaseList.appendChild(el);
        return;
      }
    } else {
      statusText = 'In progress'; statusBg = p.bg; statusTx = p.text;
      if (isOwner) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost btn-sm';
        btn.style.cssText = 'margin-left:auto;padding:2px 8px;font-size:11px';
        btn.textContent = 'Mark Complete';
        btn.addEventListener('click', () => markComplete(i));
        el.appendChild(dot);
        el.appendChild(info);
        statusEl.style.background = statusBg;
        statusEl.style.color = statusTx;
        statusEl.textContent = statusText;
        el.appendChild(statusEl);
        el.appendChild(btn);
        phaseList.appendChild(el);
        return;
      } else {
        const btn = document.createElement('button');
        btn.className = 'btn btn-ghost btn-sm';
        btn.style.cssText = 'margin-left:auto;padding:2px 8px;font-size:11px';
        btn.textContent = 'Request Completion';
        btn.addEventListener('click', () => requestComplete(i));
        el.appendChild(dot);
        el.appendChild(info);
        statusEl.style.background = statusBg;
        statusEl.style.color = statusTx;
        statusEl.textContent = statusText;
        el.appendChild(statusEl);
        el.appendChild(btn);
        phaseList.appendChild(el);
        return;
      }
    }

    statusEl.style.background = statusBg;
    statusEl.style.color = statusTx;
    statusEl.textContent = statusText;
    el.appendChild(dot);
    el.appendChild(info);
    el.appendChild(statusEl);
    phaseList.appendChild(el);
  });
}

function requestComplete(idx) { dbUpdatePhaseStatus(idx, 'requested'); }
function markComplete(idx) { dbUpdatePhaseStatus(idx, 'completed'); }
function approvePhase(idx) { dbUpdatePhaseStatus(idx, 'completed'); }

document.addEventListener('DOMContentLoaded', async () => {
  const statuses = await dbGetPhaseStatuses();
  window.serverData = { phaseStatuses: statuses };
  renderPhases();
  subscribeToPhaseStatuses(() => {
    dbGetPhaseStatuses().then((s) => {
      window.serverData = { phaseStatuses: s };
      renderPhases();
    });
  });
});

const upcoming = MEETINGS.filter(m => m >= today);
const nextM = upcoming[0];
document.getElementById('next-meeting-date').textContent = nextM ? fmtDate(nextM) : 'No more sessions';

function openChangePassword() {
  document.getElementById('pwd-modal').style.display = 'flex';
  document.getElementById('pwd-err').style.display = 'none';
  document.getElementById('old-pwd').value = '';
  document.getElementById('new-pwd').value = '';
}
function closeChangePassword() {
  document.getElementById('pwd-modal').style.display = 'none';
}
async function submitChangePassword() {
  const oldPassword = document.getElementById('old-pwd').value;
  const newPassword = document.getElementById('new-pwd').value;
  const actualUserIdMap = { 'owner': 'PD01', 'tejas': 'TG05', 'atshal': 'AK03' };
  const userId = actualUserIdMap[currentUser()];
  
  if (!oldPassword || !newPassword) return;
  
  // Reverting to the mock API behavior as requested
  try {
    const res = await fetch('/api/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oldPassword, newPassword })
    });
    const data = await res.json();
    if (res.ok) {
      alert('Password changed successfully. Please log in again.');
      logout();
    } else {
      const err = document.getElementById('pwd-err');
      err.textContent = data.error || 'Failed to change password';
      err.style.display = 'block';
    }
  } catch (e) {
    const err = document.getElementById('pwd-err');
    err.textContent = 'Serverless environment: mock API not available.';
    err.style.display = 'block';
  }
}